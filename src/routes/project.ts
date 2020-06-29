import { PlanRunModel, PlanRun, ExplanationRunModel } from './../db_schema/run';
import { PlanPropertyModel } from './../db_schema/plan_property';
import { Project } from './../db_schema/project';
import express from 'express';
import mongoose from 'mongoose';

import { ProjectModel } from '../db_schema/project';
import { TranslatorCall } from '../planner/general_planner';
import { experimentsRootPath } from '../settings';
import { deleteUploadFile } from '../planner/pddl_file_utils';
import { ExecutionSettingsModel } from '../db_schema/execution_settings';
import { settings } from 'cluster';

export const projectRouter = express.Router();


async function computeAndStoreSchema(project: Project): Promise<Project | null> {
    try {
        console.log('Compute and store schema');
        const planner = new TranslatorCall(experimentsRootPath, project);
        await planner.executeRun();
        // console.log('Schema translated: ' + project.taskSchema);

        const data = await ProjectModel.updateOne({ _id: project._id},
            { $set: { taskSchema: project.taskSchema} });
        // console.log(data);

        const resProject: Project | null = await ProjectModel.findOne({ _id: project._id }).lean();
        // console.log(resProject);
        return resProject;
    } catch {
        await ProjectModel.deleteOne({ _id: project._id});
        return null;
    }
}


projectRouter.post('/', async (req, res) => {
    try {
        console.log('POST Project');

        const settingsId = await ExecutionSettingsModel.createProjectDefaultSettings();

        const projectModel = new ProjectModel({
            name: req.body.name,
            user: req.user._id,
            description: req.body.description,
            domainFile: req.body.domainFile,
            problemFile: req.body.problemFile,
            domainSpecification: req.body.domainSpecification,
            settings: settingsId
        });
        if (!projectModel) {
            console.log('project ERROR');
            return res.status(403).send('create project failed');
        }
        await projectModel.save();

        // compute and store schema
        const project: Project = projectModel.toJSON() as Project;
        const resProject: Project | null = await computeAndStoreSchema(project);

        res.send({
            status: true,
            message: 'Project is stored',
            data: resProject
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


projectRouter.put('/:id', async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        await ProjectModel.replaceOne({_id: refId}, req.body);

        const project: Project | null = await ProjectModel.findOne({_id: refId}).lean();

        if (!project) {
            return res.status(403).send('update project failed');
        }

        res.send({
            status: true,
            message: 'Project is stored',
            data: project
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


projectRouter.post('/:id', async (req, res) => {
    // TODO implement settings copy
    try {
        console.log('POST copy project id: ' + req.params.id);
        const refId = mongoose.Types.ObjectId(req.params.id);
        const refProject: Project | null = await ProjectModel.findOne({ _id: refId }).lean();
        if (!refProject) { return res.status(404).send({ message: 'not found project' }); }

        // console.log(refProject);
        delete refProject._id; // reset the id to create a new Object
        refProject.name = refProject.name + '(copy)';
        const newProjectModel = new ProjectModel(refProject);
        await newProjectModel.save();

        // compute and store schema
        const project: Project = newProjectModel.toJSON() as Project;
        const resProject: Project | null = await computeAndStoreSchema(project);

        // console.log(resProject);

        res.send({
            status: true,
            message: 'Project is copied',
            data: resProject
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

projectRouter.get('', async (req, res) => {
    console.log('GET project');
    const projects = await ProjectModel.find({ user: req.user._id});
    // const projects = await ProjectModel.find();
    // const projects = await ProjectModel.find();

    // for (const p of projects) {
    //     // console.log('update global hard goals in project');
    //     // p.globalHardGoals = [];
    //     // await p.save();
    // }

    if (!projects) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: projects
    });

});





projectRouter.get('/:id', async (req, res) => {
    console.log('GET project id: ' + req.params.id);
    const id = mongoose.Types.ObjectId(req.params.id);
    const project = await ProjectModel.findOne({ _id: id });
    if (!project) { return res.status(404).send({ message: 'not found project' }); }
    res.send({
        data: project
    });

});

projectRouter.delete('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE Project ID: ' + id);

    // delete project
    const projectDoc = await ProjectModel.findOne({ _id: id });
    if (!projectDoc) { return res.status(404).send({ message: 'not found project' }); }

    const project: Project = projectDoc?.toJSON() as Project;

    // delete corresponding files
    deleteUploadFile(project.domainFile.path);
    deleteUploadFile(project.problemFile.path);
    deleteUploadFile(project.domainSpecification.path);

    // Delete runs
    const planRunsDocs = await PlanRunModel.find({ projetc: id});

    for (const planRunDoc of planRunsDocs) {
        const planRun: PlanRun = planRunDoc.toJSON() as PlanRun;
        await ExplanationRunModel.deleteMany({planRun: planRun._id});
        await PlanRunModel.deleteOne({_id: planRun._id});
    }

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id });
    if (!propertyDeleteResult) { return res.status(404).send({ message: 'Problem during project deletion occurred' }); }

    // delete Project
    const projectDeletResult = await ProjectModel.deleteOne({ _id: id });
    if (!projectDeletResult) { return res.status(404).send({ message: 'not found project' }); }

    res.send({
        data: projectDeletResult
    });

});

