import { PlanPropertyModel, PlanProperty } from './../db_schema/plan_property';
import { PropertyCheck } from './../planner/property_check';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, RunStatus } from '../db_schema/run';
import { ExplanationCall, PlanCall, PlannerCall } from '../planner/general_planner';
import { experimentsRootPath } from '../settings';


export const plannerRouter = express.Router();

function to_id_list(props: any) {
    const res = [];
    for ( const p of props) {
        const id = mongoose.Types.ObjectId(p._id);
        res.push(id);
    }
    console.log(res);
    return res;
}


plannerRouter.post('/plan', async (req, res) => {
    console.log('Compute Plan');
    try {
        console.log(req.body);
        const runModel = new PlanRunModel({
            name: req.body.name,
            status: RunStatus.pending,
            type: req.body.type,
            project: req.body.project,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            previousRun: req.body.previousRun,
        });
        if (!runModel) {
            console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await runModel.save();
        const run: PlanRun = req.body  as PlanRun;
        run._id = runModel._id;

        try {
            const planner = new PlanCall(experimentsRootPath, run);
            await planner.executeRun();
            planner.tidyUp();
            console.log('Plan computed');

            // check which plan properties are satisfied by the plan
            const planPropertiesDoc = await PlanPropertyModel.find({ project: run.project._id, isUsed: true });
            const planProperties = planPropertiesDoc?.map(pd => pd.toJSON() as PlanProperty);
            console.log('#used plan properties: ' + planProperties.length);

            const propertyChecker = new  PropertyCheck(experimentsRootPath, planProperties, run);
            const propNames: string[] = await propertyChecker.executeRun();
            // console.log('Sat Properties: ');
            // console.log(propNames);
            propertyChecker.tidyUp();

            // TODO find better way to write this
            const data = await PlanRunModel.updateOne({ _id: run._id},
                { $set: { log: run.log, planPath: run.planPath, status: RunStatus.finished, satPlanProperties: propNames} });
            // console.log(data);

            const runReturn = await PlanRunModel.findOne({ _id: runModel._id }).populate('planProperties').populate('explanationRuns');
            // console.log(runReturn);
            res.send({
                status: true,
                message: 'run successful',
                data: runReturn,
            });
        }
        catch (ex) {
            const data = await PlanRunModel.updateOne({ _id: run._id},
                { $set: {  status: RunStatus.failed} });
            console.warn(ex.message);
            res.send({
                status: true,
                message: 'run failed',
                data
            });
        }
    }
    catch (ex) {
        console.warn(ex.message);
        res.send(ex.message);
    }
});

plannerRouter.post('/mugs/:id', async (req, res) => {
    try {
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
            console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await explanationRunModel.save();

        const run: ExplanationRun = req.body  as ExplanationRun;
        run._id = explanationRunModel.id;

        const planner = new ExplanationCall(experimentsRootPath, planRun.project, run);
        planner.executeRun().then( async () => {
            console.log('Update result');
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


