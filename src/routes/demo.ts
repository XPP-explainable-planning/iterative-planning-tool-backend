import { authForward } from './../middleware/auth';
import { RunStatus } from './../db_schema/run';
import { demoGenerator, experimentsRootPath } from './../settings';
import { PlanPropertyModel, PlanProperty } from './../db_schema/plan_property';
import { DemoModel, Demo } from './../db_schema/demo';
import { Project } from './../db_schema/project';
import express from 'express';
import mongoose from 'mongoose';
import { DemoComputation, cancelDemoComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

export const demoRouter = express.Router();

demoRouter.post('/', auth, async (req, res) => {

    console.log(req.body);
    let demoDoc: mongoose.Document;
    try {
        console.log('-------------------- >  CREATE Demo');
        const demoModel = new DemoModel({
            name: req.body.name,
            user: req.user._id,
            summaryImage: req.body.summaryImage,
            project: req.body.project,
            introduction: req.body.introduction,
            status: RunStatus.pending,
            maxRuns: req.body.maxRuns,
            maxQuestionSize: req.body.maxQuestionSize,
            public: req.body.public,
        });
        if (!demoModel) {
            return res.status(403).send('create demo failed');
        }

        demoDoc = await demoModel.save();
    } catch (ex) {
        res.send(ex.message);
        return;
    }

    try {
        await demoDoc.populate('project').execPopulate();
        const demo: Demo = demoDoc.toJSON() as Demo;
        // console.log(demo);

        const planPropertiesDoc = await PlanPropertyModel.find({ project: demo.project._id, isUsed: true });
        const planProperties = planPropertiesDoc?.map(pd => pd.toJSON() as PlanProperty);

        DemoModel.updateOne({ _id: demo._id}, { $set: { status: RunStatus.running } });
        const demoGen = new DemoComputation(experimentsRootPath, demo, planProperties);
        console.log('DEMO: generate ...');
        demoGen.executeRun().then(
            async (demoFolder) => {
                console.log('DEMO: generate successful');
                const updatedDemoDoc = await DemoModel.updateOne({ _id: demo._id},
                    { $set: { definition: demoFolder, status: RunStatus.finished } });
                console.log(updatedDemoDoc);
                // demoGen.tidyUp();
            },
            async (err) => {
                console.log('DEMO: generate failed: ' + err);
                await DemoModel.updateOne({ _id: demo._id}, { $set: { status: RunStatus.failed } });
                // demoGen.tidyUp();
            }
        );

        res.send({
            status: true,
            message: 'Demo created',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demoDoc._id}, { $set: { status: RunStatus.failed } });
        res.send(ex.message);
    }
});

demoRouter.post('/cancel/:id', auth, async (req, res) => {

    console.log('Cancel id: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);

    const demo = await DemoModel.findOne({ _id: id });

    if (!demo) {
        console.log('Demo not found!');
        return res.status(404).send({ message: 'not found demo' });
    }

    cancelDemoComputation(demo._id.toString()). then(
        async (canceld) => {
            console.log('Demo cancel successful: ' + canceld);
            await DemoModel.deleteOne({ _id: id });
            res.send({
                successful: canceld,
                data: demo
    });
        },
        (error) => {
            res.send({
                successful: false,
                data: demo
            });
        });
});

demoRouter.get('', authForward, async (req, res) => {

    try {
        let demos;
        if (req.user) {
            demos = await DemoModel.find();
            // demos = await (await DemoModel.find({ user: req.user._id, public: false})).concat(await DemoModel.find({ public: true}));
        } else {
            demos = await DemoModel.find({ public: true});
        }

        if (!demos) { return res.status(404).send({ message: 'not found demo' }); }
        console.log('GET demos: #' + demos.length);

        res.send({
            data: demos
        });
    } catch (ex) {
        res.send(ex.message);
    }
});


demoRouter.get('/:id', authForward, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const demo = await DemoModel.findOne({ _id: id });
    if (!demo) { return res.status(404).send({ message: 'not found demo' }); }
    res.send({
        data: demo
    });

});

demoRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE: demo ' + id);
    const demo = await DemoModel.deleteOne({ _id: id });
    if (!demo) { return res.status(404).send({ message: 'not found demo' }); }
    res.send({
        data: demo
    });

});