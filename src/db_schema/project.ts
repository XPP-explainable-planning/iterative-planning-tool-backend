import mongoose, { Schema } from 'mongoose';
import { File, FileModel, FileSchema } from './file';
import { PlanProperty } from './plan_property';
import { DomainSchema, Domain } from './domain';

export interface Project {
    _id: string;
    name: string;
    domainFile: File;
    domainSpecification: File;
    problemFile: File;
    description: string;
    taskSchema: string;
    properties: PlanProperty[];
}

const ProjectSchema = new Schema({
    name: { type: String, required: true},
    domainFile: { type: FileSchema, required: true},
    domainSpecification: { type: FileSchema, required: true},
    problemFile: { type: FileSchema, required: true},
    description: { type: String, required: true},
    taskSchema: { type: String, required: false},
    // properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
});

export const ProjectModel = mongoose.model('project', ProjectSchema);

