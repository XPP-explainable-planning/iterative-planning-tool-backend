import { PlanPropertyModel, PlanProperty } from './../db_schema/plan_property';
import { PropertyCheck } from './../planner/property_check';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, RunStatus } from '../db_schema/run';
import { ExplanationCall, PlanCall, PlannerCall } from '../planner/general_planner';
import { experimentsRootPath } from '../settings';
import { USPlanRunModel, USExplanationRunModel } from '../db_schema/user-study-store';
import { auth, authUserStudy } from '../middleware/auth';


export const plannerRouter = express.Router();

function to_id_list(props: any) {
    const res = [];
    for ( const p of props) {
        const id = mongoose.Types.ObjectId(p._id);
        res.push(id);
    }
    // console.log(res);
    return res;
}


plannerRouter.post('/plan', authUserStudy, async (req, res) => {
    console.log('Compute Plan');
    const saveRun: boolean = JSON.parse(req.query.save);

    try {
        // console.log(req.body);
        const planRun: PlanRun = new PlanRunModel({
            name: req.body.name,
            status: RunStatus.pending,
            type: req.body.type,
            project: req.body.project,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            previousRun: req.body.previousRun,
        });
        if (!planRun) {
            // console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        if (saveRun) {
            console.log('Run stored in database');
            const saveResult = await planRun.save();
        }

        if (req.userStudyUser) {
            console.log('Store run for user study user');
            await planRun.save();
            const usPlanRun = new USPlanRunModel({
                user: req.userStudyUser._id,
                planRun: planRun._id,
            });
            await usPlanRun.save();
        }

        try {
            await planRun.populate('project').execPopulate();
            await planRun.populate('planProperties').execPopulate();

            const planner = new PlanCall(experimentsRootPath, planRun);
            const planFound = await planner.executeRun();
            planner.tidyUp();
            // console.log('Plan computed and plan found: ' + planFound);

            let propNames: string[] = [];
            if (planFound) {
                // check which plan properties are satisfied by the plan
                const planPropertiesDoc = await PlanPropertyModel.find({ project: planRun.project._id, isUsed: true });
                const planProperties = planPropertiesDoc?.map(pd => pd.toJSON() as PlanProperty);
                // console.log('#used plan properties: ' + planProperties.length);

                const propertyChecker = new  PropertyCheck(experimentsRootPath, planProperties, planRun);
                propNames = await propertyChecker.executeRun();
                // console.log('Sat Properties: ');
                // console.log(propNames);
                propertyChecker.tidyUp();
            }

                planRun.status = planFound ? RunStatus.finished : RunStatus.noSolution;
                planRun.satPlanProperties = propNames;

            if (saveRun) {
                await planRun.save();
                await planRun.populate('explanationRuns').execPopulate();
            }

            res.send({
                status: true,
                message: 'run successful',
                data: planRun,
            });
        }
        catch (ex) {
            if (req.query.save) {
                planRun.status = RunStatus.failed;
                await planRun.save();
            }
            console.warn(ex.message);
            res.send({
                status: true,
                message: 'run failed',
                data: planRun
            });
        }
    }
    catch (ex) {
        console.warn(ex.message);
        res.send(ex.message);
    }
});

plannerRouter.post('/mugs/:id', auth, async (req, res) => {
    try {
        const saveRun: boolean = JSON.parse(req.query.save);
        const planRunId =  mongoose.Types.ObjectId(req.params.id);
        const planRunModel = await PlanRunModel.findOne({ _id: planRunId}).populate('project');
        if (!planRunModel) { return res.status(404).send({ message: 'no run found' }); }
        const planRun: PlanRun = planRunModel.toJSON() as PlanRun;

        const explanationRunModel = new ExplanationRunModel({
            name: req.body.name,
            status: RunStatus.pending,
            type: req.body.type,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            softGoals: req.body.softGoals,
            planRun: planRunId,
        });
        if (!explanationRunModel) {
            // console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await explanationRunModel.save();

        const run: ExplanationRun = req.body  as ExplanationRun;
        run._id = explanationRunModel.id;

        const planner = new ExplanationCall(experimentsRootPath, planRun.project, run);
        planner.executeRun().then( async () => {
            // console.log('Update result');
            // set result file path
            const returnData = await ExplanationRunModel.updateOne({ _id: run._id},
                { $set: { result: run.result, log: run.log, status: RunStatus.finished} });

            const newExpRunDoc = await ExplanationRunModel.findOne({ _id: run._id});
            const newExpRun: ExplanationRun = newExpRunDoc?.toJSON() as ExplanationRun;
            // console.log('---------------- EXPLANATION ----------------------');
            // console.log(newExpRun);
            // console.log('---------------- EXPLANATION ----------------------');
            await PlanRunModel.updateOne({ _id: planRunId}, { $set: { explanationRuns: planRun.explanationRuns.concat(newExpRun)}});

            // return the plan run with new questionRun elem
            const runReturn = await PlanRunModel.findOne({ _id: planRunId}).populate('planProperties').populate('explanationRuns');
            // console.log('---------------- PLAN RUN RETURN ----------------------');
            // console.log(runReturn?.toString());
            res.send({
                status: true,
                message: 'run successful',
                data: runReturn,
            });
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


plannerRouter.post('/mugs-save/:id', authUserStudy, async (req, res) => {
    try {
        if (! req.userStudyUser) {
            return res.status(401).send({ message: 'Access denied.' });
        }

        const planRunId =  mongoose.Types.ObjectId(req.params.id);
        const planRun = await PlanRunModel.findOne({ _id: planRunId}).populate('project');
        if (!planRun) { return res.status(404).send({ message: 'no run found' }); }

        const explanationRun = new ExplanationRunModel({
            name: req.body.name,
            status: RunStatus.finished,
            type: req.body.type,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            softGoals: req.body.softGoals,
            planRun: planRunId,
        });

        if (!explanationRun) {
            return res.status(403).send('run could not be stored');
        }

        await explanationRun.save();

        const usExpRun = new USExplanationRunModel({
            user: req.userStudyUser._id,
            expRun: explanationRun._id,
        });
        await usExpRun.save();

        res.send({
            status: true,
            message: 'run saved successfully',
            data: explanationRun,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


