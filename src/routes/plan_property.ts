import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

import { PlanPropertyModel } from '../db_schema/plan_property';
import { ActionSetModel } from '../db_schema/action_set';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', async (req, res) => {
    try {
        console.log('POST PLAN PROPERTY');
        console.log(req.body);
        console.log(req.body.actionSets);
        const planProperty = new PlanPropertyModel({
            name: req.body.name,
            type: req.body.type,
            domain: req.body.domain,
            formula: req.body.formula,
            actionSets: req.body.actionSets
        });
        if (!planProperty) {
            console.log('Plan Property ERROR');
            return res.status(403).send('not found file');
        }
        const data = await planProperty.save();
        console.log(data);
        res.send({
            status: true,
            message: 'File is uploaded',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }
});

planPropertyRouter.get('/', async (req, res) => {
    const properties = await  PlanPropertyModel.find();
    console.log('GET properties: #' + properties.length);
    if (!properties) { return res.status(404).send({ message: 'not found properties' }); }
    res.send({
        data: properties
    });

});

planPropertyRouter.get('/domain/:domain', async (req, res) => {
    const propertyDomain = req.params.domain;
    console.log('GET plan property domain: ' + propertyDomain);
    const properties = await  PlanPropertyModel.find({ domain: propertyDomain });
    console.log('GET properties FILES: ' + properties);
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

