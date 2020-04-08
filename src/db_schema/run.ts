import mongoose, { Schema } from 'mongoose';
import { PddlFile, PddlFileModel, PddlFileSchema } from './pddl_file';
import { PlanProperty } from './plan_property';
import { Project } from './project';

export enum Status {
    pending,
    running,
    failed,
    finished
}

export interface  Run{
    _id: string;
    name: string;
    status: Status;
    project: Project;
    hard_properties: PlanProperty[];
    soft_properties: PlanProperty[];
    log: string;
    result: string;
}

const RunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    hard_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    soft_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
});

export const RunModel = mongoose.model('run', RunSchema);
