import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import { Run, RunModel, Status } from '../db_schema/run';
import { PlannerCall } from '../planner/general_planner';
import { experimentsRootPath } from '../settings';
import { ProjectModel } from '../db_schema/project';
import { projectRouter } from './project';
import { PlanPropertyModel } from '../db_schema/plan_property';

export const plannerCallRouter = express.Router();

function to_id_list(props: any) {
    const res = [];
    for ( const p of props) {
        const id = mongoose.Types.ObjectId(p._id);
        res.push(id);
    }
    console.log(res);
    return res;
}


plannerCallRouter.post('/mugs', async (req, res) => {
    try {
        // console.log(req.body);
        const runModel = new RunModel({
            name: req.body.name,
            status: Status.pending,
            project: req.body.project,
            hard_properties: req.body.hard_properties,
            soft_properties: req.body.soft_properties,
        });
        if (!runModel) {
            console.log('project ERROR');
            return res.status(403).send('run could not be stored');
        }
        const saveResult = await runModel.save();
        console.log(saveResult);
        const run: Run = req.body  as Run;
        run._id = runModel._id;

        const planner = new PlannerCall(experimentsRootPath, run);
        await planner.run_planner_python_shell();

        // TODO find better way to write this
        const data = await RunModel.updateOne({ _id: run._id}, { $set: { result: run.result, log: run.log, status: Status.finished} });
        console.log(data);

        const runReturn = await RunModel.findOne({ _id: runModel._id }).populate('hard_properties').populate('soft_properties');
        console.log(runReturn);
        res.send({
            status: true,
            message: 'Project is stored',
            data: runReturn,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});

plannerCallRouter.get('', async (req, res) => {
    const runs = await RunModel.find().populate('hard_properties').populate('soft_properties');
    console.log('#runs: ' + runs.length);
    if (!runs) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: runs
    });

});

plannerCallRouter.delete('/:id', async (req, res) => {
    console.log('Delete Run: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const run = await RunModel.deleteOne({ _id: id });
    console.log(run);
    if (!run) { return res.status(404).send({ message: 'not found run' }); }
    res.send({
        data: run
    });

});


