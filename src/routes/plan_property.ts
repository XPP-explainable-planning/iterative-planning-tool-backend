import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

import { PlanPropertyModel, PlanProperty } from '../db_schema/plan_property';
import { ActionSetModel } from '../db_schema/action_set';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', async (req, res) => {
    try {
        console.log('POST PLAN PROPERTY');
        console.log(req.body);
        const planProperty = new PlanPropertyModel({
            name: req.body.name,
            type: req.body.type,
            domain: req.body.domain,
            formula: req.body.formula,
            actionSets: req.body.actionSets,
            naturalLanguageDescription: req.body.naturalLanguageDescription,
            project: req.body.project,
            isUsed: req.body.isUsed
        });
        if (!planProperty) {
            console.log('Plan Property ERROR');
            return res.status(403).send('not found file');
        }
        const data = await planProperty.save();
        console.log(data);
        res.send({
            status: true,
            message: 'Plan Property is stored',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }
});


planPropertyRouter.put('/:id', async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        await PlanPropertyModel.replaceOne({_id: refId}, req.body);

        const planProeprty: PlanProperty | null = await PlanPropertyModel.findOne({_id: refId}).lean();

        if (!planProeprty) {
            return res.status(403).send('update property failed');
        }

        res.send({
            status: true,
            message: 'property updated',
            data: planProeprty
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

planPropertyRouter.get('/', async (req, res) => {
    const projectId =  mongoose.Types.ObjectId(req.query.projectId);
    const properties = await  PlanPropertyModel.find({ project: projectId});
    // console.log(properties.toString());
    console.log('GET properties: #' + properties.length);
    if (!properties) { return res.status(404).send({ message: 'not found properties' }); }
    res.send({
        data: properties
    });

});

planPropertyRouter.get('/domain/:domain', async (req, res) => {
    const propertyDomain = req.params.domain;
    // console.log('GET plan property domain: ' + propertyDomain);
    const properties = await  PlanPropertyModel.find({ domain: propertyDomain });
    // console.log('GET properties FILES: ' + properties);
    if (!properties) { return res.status(404).send({ message: 'not found properties' }); }
    res.send({
        data: properties
    });

});

planPropertyRouter.get('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('ID: ' + id);
    const property = await PlanPropertyModel.findOne({ _id: id });
    if (!property) { return res.status(404).send({ message: 'not found property' }); }
    res.send({
        data: property
    });

});

planPropertyRouter.delete('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const property = await PlanPropertyModel.deleteOne({ _id: id });
    console.log(property);
    if (!property) { return res.status(404).send({ message: 'not found property' }); }
    res.send({
        data: property
    });

});

