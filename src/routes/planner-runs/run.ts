import express from 'express';
import mongoose from 'mongoose';

import { ExplanationRunModel, PlanRun, PlanRunModel } from '../../db_schema/run';
import { deleteResultFile } from '../../planner/pddl_file_utils';


export const runRouter = express.Router();

runRouter.get('/plan-run', async (req, res) => {

    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const runs = await PlanRunModel.find({ project: projectId.toHexString()}).populate('planProperties').populate('explanationRuns');
    if (!runs) { return res.status(404).send({ message: 'No plan-runs found.' }); }
    res.send({
        data: runs
    });

});

runRouter.get('/plan-run/:id', async (req, res) => {
    const id =  mongoose.Types.ObjectId(req.params.id);
    const run = await PlanRunModel.findOne({ _id: id}).populate('planProperties').populate('explanationRuns');
    if (!run) { return res.status(404).send({ message: 'No plan-run found.' }); }
    res.send({
        data: run
    });

});

runRouter.get('/plan-run/position', async (req, res) => {
    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const position = req.query.projectId(req.query.pos);

    const runs = await PlanRunModel.find({ project: projectId.toHexString()}).populate('planProperties').populate('explanationRuns');
    if (!runs) { return res.status(404).send({ message: 'no run found' }); }

    let returnRun: PlanRun;

    // first: run has no previous run
    if (position === 'first') {
        for (const run of runs) {
            const planRun: PlanRun = run.toJSON() as PlanRun;
            if (planRun.previousRun == null) {
                returnRun = planRun;
                break;
            }
        }

    }
    if (position === 'last') {
        for (const run of runs) {
            const planRun: PlanRun = run.toJSON() as PlanRun;
            if (planRun.previousRun == null) {
                returnRun = planRun;
                break;
            }
        }
    }

    res.send({
        data: runs
    });

});

runRouter.delete('/plan-run/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);

    const planRun: PlanRun | null = await PlanRunModel.findOneAndDelete({ _id: id });
    if (!planRun) { return res.status(404).send({ message: 'No plan-run found.' }); }

    // delete corresponding log files
    if (planRun.log) {
        deleteResultFile(planRun.log);
    }

    res.send({
        data: planRun
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

runRouter.delete('/explanation/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);

    ExplanationRunModel.findOneAndDelete({ _id: id }, async (err, expRun) => {

        if (!expRun) { return res.status(404).send({ message: 'no run found' }); }

        // delete corresponding log files
        deleteResultFile(expRun.result);
        deleteResultFile(expRun.log);

        const updatedPlanRun = await PlanRunModel.findById(expRun.planRun).populate('explanationRuns').populate('planProperties');

        res.send({
            data: updatedPlanRun
        });
    });
});


