import { settings } from 'cluster';
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
import { experimentsRootPath } from '../settings';
import { deleteUploadFile, deleteResultFile } from '../planner/pddl_file_utils';

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

    let demo: Demo | null = null;
    try {
        console.log('-------------------- >  CREATE Demo');

        const settingsId = await ExecutionSettingsModel.createDemoDefaultSettings();
        const project = await ProjectModel.findById(req.body.projectId);


        let imageFilePath = '';
        if (req.file) {
            imageFilePath = imgPort + '/uploads/' + req.file.filename;
        }

        const projectData = project?.toJSON();
        delete projectData?._id;
        delete projectData?.itemType;
        delete projectData?.settings;

        demo = new DemoModel(projectData);
        demo.isNew = true;

        demo.name = req.body.name;
        demo.summaryImage = imageFilePath;
        demo.status = RunStatus.pending;
        demo.settings = settingsId;
        demo.description = req.body.description;

        if (!demo) {
            return res.status(403).send('create demo failed');
        }

        await demo.save((reason) => { console.log('Reason fail demo: ' + reason); });

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        console.log('Copy Plan Properties #' + planProperties.length);
        for (const pp of planProperties) {
            const newPP = new PlanPropertyModel(pp);
            newPP._id = undefined;
            newPP.project = demo._id;
            newPP.isNew = true;
            newPP.save((reason) => { console.log('Reason fail property: ' + reason); });
        }


    } catch (ex) {
        res.send(ex.message);
        return;
    }

    try {

        const planProperties = await PlanPropertyModel.find({ project: demo._id, isUsed: true });

        DemoModel.updateOne({ _id: demo._id}, { $set: { status: RunStatus.running } });
        const demoGen = new DemoComputation(experimentsRootPath, demo, planProperties);
        console.log('DEMO: generate ...');
        demoGen.executeRun().then(
            async (demoFolder) => {
                console.log('DEMO: generate successful');
                const updatedDemoDoc = await DemoModel.updateOne({ _id: demo?._id},
                    { $set: { definition: demoFolder, status: RunStatus.finished } });
                demoGen.tidyUp();
            },
            async (err) => {
                console.log('DEMO: generate failed: ' + err);
                await DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
                 demoGen.tidyUp();
            }
        );

        res.send({
            status: true,
            message: 'Demo created',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
        res.send(ex.message);
    }
});


demoRouter.put('/', auth, async (req, res) => {

    try {
        console.log('-------------------- >  UPDATE Demo');
        console.log(req.body);
        const demo: Demo | null = await DemoModel.findById(req.body._id);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        demo.name = req.body.name;
        demo.description = req.body.description;

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
    } catch (ex) {
        res.send(ex.message);
        return;
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
            const allDemos: Demo[] = await DemoModel.find().populate('settings');
            demos = allDemos.filter(d => {
                const p = d.settings.public;
                d.settings = d.settings._id;
                return p;
            });
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

    const demo: Demo | null = await DemoModel.findById(id);
    if (!demo) { return res.status(404).send({ message: 'not found demo' }); }

    if (demo.summaryImage) {
        deleteUploadFile(demo.summaryImage);
    }

    deleteResultFile('demo_' + demo._id);

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id.toHexString() });
    if (!propertyDeleteResult) { return res.status(404).send({ message: 'Problem during project deletion occurred' }); }

    await ExecutionSettingsModel.deleteOne({ _id: demo.settings });

    const result = await DemoModel.deleteOne({ _id: id });
    if (!result) { return res.status(404).send({ message: 'not found demo' }); }



    res.send({
        data: result
    });

});