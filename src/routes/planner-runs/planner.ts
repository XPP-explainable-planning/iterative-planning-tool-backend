import { PlanPropertyModel, PlanProperty } from '../../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../../planner/property_check';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, RunStatus } from '../../db_schema/run';
import { ExplanationCall, PlanCall, PlannerCall } from '../../planner/general_planner';
import { experimentsRootPath } from '../../settings';
import { USPlanRunModel, USExplanationRunModel } from '../../db_schema/user-study/user-study-store';
import { auth, authUserStudy } from '../../middleware/auth';


export const plannerRouter = express.Router();

plannerRouter.post('/plan', authUserStudy, async (req, res) => {
    const saveRun: boolean = req.query.save ? JSON.parse(req.query.save) : false;

    try {
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
            return res.status(403).send('run could not be stored');
        }
        if (saveRun) {
            await planRun.save();
        }

        if (req.userStudyUser) {
            await planRun.save();
            const usPlanRun = new USPlanRunModel({
                user: req.userStudyUser._id,
                planRun: planRun._id,
            });
            await usPlanRun.save();
        }

        try {
            // load project and plan-properties and compute plan
            await planRun.populate('project').execPopulate();
            await planRun.populate('planProperties').execPopulate();

            const planner = new PlanCall(experimentsRootPath, planRun);
            const planFound = await planner.executeRun();
            planner.tidyUp();

            let propNames: string[] = [];
            if (planFound) {
                // check which plan properties are satisfied by the plan
                const planProperties: PlanProperty[] = await PlanPropertyModel.find({ project: planRun.project._id, isUsed: true });
                const propertyChecker = new  PropertyCheck(experimentsRootPath, planProperties, planRun);
                propNames = await propertyChecker.executeRun();
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
            planRun.status = RunStatus.failed;
            if (req.query.save) {
                await planRun.save();
            }
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
        const planRunId =  mongoose.Types.ObjectId(req.params.id);
        const planRun = await PlanRunModel.findOne({ _id: planRunId}).populate('project');
        if (!planRun) { return res.status(404).send({ message: 'no run found' }); }

        const explanationRun = new ExplanationRunModel({
            name: req.body.name,
            status: RunStatus.pending,
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

        const planner = new ExplanationCall(experimentsRootPath, planRun.project, explanationRun);
        planner.executeRun().then( async () => {

            await ExplanationRunModel.updateOne({ _id: explanationRun._id},
                { $set: { result: explanationRun.result, log: explanationRun.log, status: RunStatus.finished} });

            const newExpRun = await ExplanationRunModel.findOne({ _id: explanationRun._id});
            await PlanRunModel.updateOne({ _id: planRunId}, { $set: { explanationRuns: planRun.explanationRuns.concat(newExpRun)}});

            // return the plan run with new questionRun elem
            const runReturn = await PlanRunModel.findOne({ _id: planRunId}).populate('planProperties').populate('explanationRuns');

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

