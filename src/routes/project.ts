import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

import { ProjectModel } from '../db_schema/project';

export const projectRouter = express.Router();


projectRouter.post('/', async (req, res) => {
    try {
        console.log('POST Project');
        console.log(req.body);
        const project = new ProjectModel({
            name: req.body.name,
            description: req.body.description,
            domainFile: req.body.domainFile,
            problemFile: req.body.problemFile,
        });
        if (!project) {
            console.log('project ERROR');
            return res.status(403).send('not found file');
        }
        const data = await project.save();
        res.send({
            status: true,
            message: 'Project is stored',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }
});

projectRouter.get('', async (req, res) => {
    const properties = await ProjectModel.find();
    if (!properties) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: properties
    });

});


projectRouter.get('/:id', async (req, res) => {
    console.log('GET project id: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('ID: ' + id);
    const project = await ProjectModel.findOne({ _id: id });
    if (!project) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: project
    });

});

projectRouter.delete('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const property = await ProjectModel.deleteOne({ _id: id });
    console.log(property);
    if (!property) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: property
    });

});

