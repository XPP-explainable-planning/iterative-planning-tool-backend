import mongoose, { Schema } from 'mongoose';
import { PddlFile, PddlFileModel, PddlFileSchema } from './pddl_file';
import { PlanProperty } from './plan_property';

export interface Project {
    _id: string;
    name: string;
    domainFile: PddlFile;
    problemFile: PddlFile;
    description: string;
    properties: PlanProperty[];
}

const ProjectSchema = new Schema({
    name: { type: String, required: true},
    domainFile: { type: PddlFileSchema, required: true},
    problemFile: { type: PddlFileSchema, required: true},
    description: { type: String, required: true},
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
});

export const ProjectModel = mongoose.model('project', ProjectSchema);
