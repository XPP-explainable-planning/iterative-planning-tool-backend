import { ExecutionSettings, ExecutionSettingsModel } from './../db_schema/execution_settings';
import { authForward } from './../middleware/auth';
import { RunStatus } from './../db_schema/run';
import { PlanPropertyModel, PlanProperty } from './../db_schema/plan_property';
import { DemoModel, Demo } from './../db_schema/demo';
import express from 'express';
import mongoose from 'mongoose';
import { DemoComputation, cancelDemoComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

export const executionSettingsRouter = express.Router();



executionSettingsRouter.put('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const updateSettings: ExecutionSettings = req.body;

    const settings: ExecutionSettings | null = await ExecutionSettingsModel.findOne({ _id: id });
    if (!settings) { return res.status(404).send({ message: 'not found settings' }); }

    settings.maxRuns = updateSettings.maxRuns;
    settings.allowQuestions = updateSettings.allowQuestions;
    settings.maxQuestionSize = updateSettings.maxQuestionSize;
    settings.public = updateSettings.public;
    settings.usePlanPropertyValues = updateSettings.usePlanPropertyValues;
    settings.measureTime = updateSettings.measureTime;
    settings.useTimer = updateSettings.useTimer;
    settings.maxTime = updateSettings.maxTime;
    settings.showAnimation = updateSettings.showAnimation;

    // console.log(settings);

    const saveResult = await settings.save();
    if (!saveResult) { return res.status(404).send({ message: 'update failed' }); }

    console.log('settings updated');
    res.send({
        data: settings
    });

});


executionSettingsRouter.get('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('Get settings: ' + id);
    const settings = await ExecutionSettingsModel.findOne({ _id: id });
    if (!settings) {
        return res.status(404).send({ message: 'not found settings' });
    }
    // settings.showAnimation = false;
    // await settings.save();
    res.send({
        data: settings
    });

});

executionSettingsRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const settings = await ExecutionSettingsModel.deleteOne({ _id: id });
    if (!settings) { return res.status(404).send({ message: 'not found demo' }); }
    res.send({
        data: settings
    });

});