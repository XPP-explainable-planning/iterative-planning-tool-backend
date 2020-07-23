import { settings } from 'cluster';
import { ProjectModel } from './../db_schema/project';
import { ExecutionSettingsModel } from './../db_schema/execution_settings';
import { authForward } from './../middleware/auth';
import { RunStatus } from './../db_schema/run';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel } from './../db_schema/demo';
import express from 'express';
import mongoose from 'mongoose';
import { cancelDemoComputation, DemoComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import { deleteResultFile, deleteUploadFile } from '../planner/pddl_file_utils';
import { User } from '../db_schema/user';
import { environment } from '../app';

export const demoRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(path.resolve(__dirname, '..'), 'data/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
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

        const settingsId = await (ExecutionSettingsModel as any).createDemoDefaultSettings();
        const project = await ProjectModel.findById(req.body.projectId);


        let imageFilePath = '';
        if (req.file) {
            imageFilePath = '/uploads/' + req.file.filename;
        }

        // Copy Project Data:
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
        demo.taskInfo = req.body.taskInfo;

        if (!demo) {
            return res.status(403).send('create demo failed');
        }

        await demo.save();

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        for (const pp of planProperties) {
            const newPP = new PlanPropertyModel(pp);
            newPP._id = undefined;
            newPP.project = demo._id;
            newPP.isNew = true;
            await newPP.save();
        }

    } catch (ex) {
        res.send(ex.message);
        return;
    }

    // Precompute Demo data
    try {
        const planProperties = await PlanPropertyModel.find({ project: demo._id});

        DemoModel.updateOne({ _id: demo._id}, { $set: { status: RunStatus.running } });
        const demoGen = new DemoComputation(environment.experimentsRootPath, demo, planProperties);
        demoGen.executeRun().then(
            async (demoFolder) => {
                const updatedDemoDoc = await DemoModel.updateOne({ _id: demo?._id},
                    { $set: { definition: demoFolder, status: RunStatus.finished } });
                demoGen.tidyUp();
            },
            async (err) => {
                console.log(err);
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
        const demo: Demo | null = await DemoModel.findById(req.body._id);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        demo.name = req.body.name;
        demo.description = req.body.description;
        demo.taskInfo = req.body.taskInfo;

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

    const id = mongoose.Types.ObjectId(req.params.id);

    const demo = await DemoModel.findOne({ _id: id });

    if (!demo) {
        return res.status(404).send({ message: 'not found demo' });
    }

    cancelDemoComputation(demo._id.toString()). then(
        async (canceled) => {
            await DemoModel.deleteOne({ _id: id });
            res.send({
                successful: canceled,
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


demoRouter.get('', authForward, async (req: any, res) => {

    try {
        const allDemos: Demo[] = await DemoModel.find().populate('settings');
        const demos = allDemos.filter(d => {
            const p = d.settings.public;
            d.settings = d.settings._id;
            return p || (req.user && (d.user as any)._id.toHexString() === req.user._id.toHexString());
        });
        if (!demos) { return res.status(404).send({ message: 'No demos found' }); }

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
    if (!demo) { return res.status(404).send({ message: 'Demo not found.' }); }
    res.send({
        data: demo
    });

});

demoRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);

    const demo: Demo | null = await DemoModel.findById(id);
    if (!demo) { return res.status(404).send({ message: 'Demo not found.' }); }

    if (demo.summaryImage) {
        deleteUploadFile(demo.summaryImage);
    }

    deleteResultFile('demo_' + demo._id);

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id.toHexString() });
    if (!propertyDeleteResult) { return res.status(404).send({ message: 'Problem during demo deletion occurred' }); }

    await ExecutionSettingsModel.deleteOne({ _id: demo.settings });

    const result = await DemoModel.deleteOne({ _id: id });
    if (!result) { return res.status(404).send({ message: 'Demo deletion failed.' }); }

    res.send({
        data: result
    });

});
