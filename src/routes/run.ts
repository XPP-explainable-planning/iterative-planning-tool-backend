import express from 'express';
import mongoose from 'mongoose';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, Status } from '../db_schema/run';


export const runRouter = express.Router();

runRouter.get('/plan', async (req, res) => {
    console.log(req.query);
    console.log('Run id: ' + req.query.projectId);
    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const runs = await PlanRunModel.find({ project: projectId}).populate('planProperties').populate('explanationRuns');
    console.log('#runs: ' + runs.length);
    if (!runs) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: runs
    });

});

runRouter.get('/plan/:id', async (req, res) => {
    const id =  mongoose.Types.ObjectId(req.params.id);
    const run = await PlanRunModel.findOne({ _id: id}).populate('planProperties');
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });

});

runRouter.delete('plan/:id', async (req, res) => {
    console.log('Delete Run: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const run = await PlanRunModel.deleteOne({ _id: id });
    console.log(run);
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });

});


runRouter.get('/explanation/:id', async (req, res) => {
    const id =  mongoose.Types.ObjectId(req.params.id);
    const run = await ExplanationRunModel.findOne({ _id: id}).populate('planProperties');
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });

});

runRouter.delete('explanation/:id', async (req, res) => {
    console.log('Delete Run: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const run = await ExplanationRunModel.deleteOne({ _id: id });
    console.log(run);
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });

});


