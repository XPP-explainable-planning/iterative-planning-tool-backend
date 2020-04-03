import mongoose, { Schema } from 'mongoose';
import { PddlFile, PddlFileModel, PddlFileSchema } from './pddl_file';
import { PlanProperty } from './plan_property';

export interface Project {
    _id: string;
    name: string;
    domain_file: string;
    problem_file: PddlFile;
    description: PddlFile;
    properties: PlanProperty[];
    hard_properties: PlanProperty[];
    soft_properties: PlanProperty[];
}

const ProjectSchema = new Schema({
    name: { type: String, required: true},
    domain_file: { type: PddlFileSchema, required: true},
    problem_file: { type: PddlFileSchema, required: true},
    description: { type: String, required: true},
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    hard_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    soft_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
});

export const ProjectModel = mongoose.model('project', ProjectSchema);
