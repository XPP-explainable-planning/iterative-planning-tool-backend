import { ProjectModel, Project } from './../db_schema/project';
import { ExecutionSettingsModel } from './../db_schema/execution_settings';
import { authForward } from './../middleware/auth';
import { RunStatus } from './../db_schema/run';
import { PlanPropertyModel, PlanProperty } from './../db_schema/plan_property';
import { DemoModel, Demo } from './../db_schema/demo';
import express from 'express';
import mongoose from 'mongoose';
import { DemoComputation, cancelDemoComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';

export const demoRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Storage file:');
        console.log(file);
        cb(null, path.join(path.resolve(__dirname, '..'), 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    console.log('File Filter');
    console.log(file);
    cb(null, true);
    // if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    //     cb(null, true);
    // } else {
    //     cb(null, false);
    // }
};

const upload = multer({
    storage,
    fileFilter
});

demoRouter.post('/', auth, upload.single('summaryImage'), async (req, res) => {

    let demoDoc: mongoose.Document;
    try {
        console.log('-------------------- >  CREATE Demo');
        console.log(req.body);
        console.log(req.file);

        const settingsId = await ExecutionSettingsModel.createDemoDefaultSettings();

        const project = await ProjectModel.findById(req.body.project);

        let imageFilePath = '';
        if (req.file) {
            imageFilePath = imgPort + '/uploads/' + req.file.filename;
        }

        const demoModel = new DemoModel({
            name: req.body.name,
            user: req.user._id,
            summaryImage: imageFilePath,
            project: req.body.project,
            introduction: req.body.introduction,
            status: RunStatus.pending,
            settings: settingsId,
            animationSettings: project?.animationSettings
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

        // for (const demo of demos) {
        //     const project: Project | null = await ProjectModel.findById(demo.project);

        //     console.log(project);
        //     demo.animationSettings = project?.animationSettings;

        //     await demo.save();
        // }


        if (!demos) { return res.status(404).send({ message: 'not found demo' }); }
        console.log('GET demos: #' + demos.length);
        console.log(demos);

        res.send({
            data: demos
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

demoRouter.put('/:id', authForward, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const updateDemo: Demo = req.body;

    const demo: Demo | null = await DemoModel.findOne({ _id: id });
    if (!demo) { return res.status(404).send({ message: 'not found demo' }); }

    demo.maxRuns = updateDemo.maxRuns;
    demo.allowQuestions = updateDemo.allowQuestions;
    demo.maxQuestionSize = updateDemo.maxQuestionSize;
    demo.public = updateDemo.public;

    const saverResult = await demo.save();
    if (!saverResult) { return res.status(404).send({ message: 'update failed' }); }

    console.log('DEMO updated');
    res.send({
        data: demo
    });

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