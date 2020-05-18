import { DemoModel } from './../db_schema/demo';
import { Project } from './../db_schema/project';
import express from 'express';
import mongoose from 'mongoose';

export const demoRouter = express.Router();

demoRouter.post('/', async (req, res) => {
    try {
        console.log('-------------------- >  POST Project');
        console.log(req.body);
        const demoModel = new DemoModel({
            name: req.body.name,
            summaryImage: req.body.summaryImage,
            project: req.body.project,
            intruction: req.body.intruction,
            maxRuns: req.body.maxRuns,
            maxQuestionSize: req.body.maxQuestionSize,
        });
        if (!demoModel) {
            console.log('project ERROR');
            return res.status(403).send('create project failed');
        }
        await demoModel.save();

        res.send({
            status: true,
            message: 'Project is stored',
            data: demoModel
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


demoRouter.get('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const demo = await DemoModel.findOne({ _id: id });
    if (!demo) { return res.status(404).send({ message: 'not found demo' }); }
    res.send({
        data: demo
    });

});

demoRouter.delete('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const demo = await DemoModel.deleteOne({ _id: id });
    if (!demo) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: demo
    });

});