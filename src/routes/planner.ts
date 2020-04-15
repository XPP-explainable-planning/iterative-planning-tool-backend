import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, Status } from '../db_schema/run';
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
    try {
        console.log(req.body);
        const runModel = new PlanRunModel({
            name: req.body.name,
            status: Status.pending,
            type: req.body.type,
            project: req.body.project,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
        });
        if (!runModel) {
            console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await runModel.save();
        console.log(saveResult);
        const run: PlanRun = req.body  as PlanRun;
        run._id = runModel._id;

        const planner = new PlanCall(experimentsRootPath, run);
        await planner.run_planner_python_shell();

        // TODO find better way to write this
        const data = await PlanRunModel.updateOne({ _id: run._id},
            { $set: { log: run.log, plan: run.plan, status: Status.finished} });
        console.log(data);

        const runReturn = await PlanRunModel.findOne({ _id: runModel._id }).populate('hard_properties');
        console.log(runReturn);
        res.send({
            status: true,
            message: 'run successful',
            data: runReturn,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});

plannerRouter.post('/mugs/:id', async (req, res) => {
    try {
        const id =  mongoose.Types.ObjectId(req.params.id);
        const planRunModel = await PlanRunModel.findOne({ _id: id}).populate('project');
        if (!planRunModel) { return res.status(404).send({ message: 'no run found' }); }
        const planRun: PlanRun = planRunModel.toJSON() as PlanRun;

        console.log(req.body);
        const explanationRunModel = new ExplanationRunModel({
            name: req.body.name,
            status: Status.pending,
            type: req.body.type,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            softGoals: req.body.softGoals,
        });
        if (!explanationRunModel) {
            console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await explanationRunModel.save();
        console.log(saveResult);
        const run: ExplanationRun = req.body  as ExplanationRun;
        run._id = explanationRunModel._id;

        const planner = new ExplanationCall(experimentsRootPath, planRun.project, run);
        await planner.run_planner_python_shell();

        // TODO find better way to write this
        const data = await PlanRunModel.updateOne({ _id: run._id},
            { $set: { result: run.result, log: run.log, status: Status.finished} });
        console.log(data);

        const runReturn = await PlanRunModel.findOne({ _id: explanationRunModel._id }).populate('hard_properties').populate('soft_properties');
        console.log(runReturn);
        res.send({
            status: true,
            message: 'run successful',
            data: runReturn,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


