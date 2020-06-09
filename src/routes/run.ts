import express from 'express';
import mongoose from 'mongoose';

import { PlanRun, PlanRunModel, ExplanationRun, ExplanationRunModel, RunStatus } from '../db_schema/run';
import { deleteResultFile } from '../planner/pddl_file_utils';


export const runRouter = express.Router();

runRouter.get('/plan-run', async (req, res) => {
    // await PlanRunModel.deleteMany({});
    // console.log(req.query);
    // console.log('Run id: ' + req.query.projectId);
    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const runs = await PlanRunModel.find({ project: projectId}).populate('planProperties').populate('explanationRuns');
    // console.log('#runs: ' + runs.length);
    // console.log(runs);
    if (!runs) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: runs
    });

});

runRouter.get('/plan-run/:id', async (req, res) => {
    const id =  mongoose.Types.ObjectId(req.params.id);
    const run = await PlanRunModel.findOne({ _id: id}).populate('planProperties').populate('explanationRuns');
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });

});

runRouter.get('/plan-run/position', async (req, res) => {
    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const position = req.query.projectId(req.query.pos);

    const runs = await PlanRunModel.find({ project: projectId}).populate('planProperties').populate('explanationRuns');
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
    console.log('Delete Run: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);

    const run = await PlanRunModel.findOneAndDelete({ _id: id });
    if (!run) { return res.status(404).send({ message: 'no run found' }); }

    const planRun: PlanRun = run?.toJSON() as PlanRun;
    // delete corresponding log files
    deleteResultFile(planRun.planPath);
    deleteResultFile(planRun.log);

    res.send({
        data: run
    });

});


runRouter.get('/explanation-run/:id', async (req, res) => {
    const id =  mongoose.Types.ObjectId(req.params.id);
    const run = await ExplanationRunModel.findOne({ _id: id}).populate('planProperties');
    if (!run) { return res.status(404).send({ message: 'no run found' }); }
    res.send({
        data: run
    });
});

runRouter.delete('/explanation-run/:id', async (req, res) => {

    console.log('Delete Run: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);

    const allRuns = await ExplanationRunModel.find();
    // console.log('---------- ONE RUNS ---------------');
    // console.log(allRuns);

    ExplanationRunModel.findOneAndDelete({ _id: id }, async (err, doc) => {
        // console.log('Explanation run: ');
        // console.log(doc);
        if (!doc) { return res.status(404).send({ message: 'no run found' }); }
        const expRun: ExplanationRun = doc.toJSON() as ExplanationRun;

        // delete corresponding log files
        deleteResultFile(expRun.result);
        deleteResultFile(expRun.log);

        console.log('Plan run id: ' + expRun.planRun);
        const updatedPlanRun = await PlanRunModel.findById(expRun.planRun).populate('explanationRuns').populate('planProperties');
        // console.log('---------- RETURN ---------------');
        // console.log(updatedPlanRun);

        res.send({
            data: updatedPlanRun
        });
    });
});


