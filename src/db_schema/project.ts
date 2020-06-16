import mongoose, { Schema, Document } from 'mongoose';
import { File, FileModel, FileSchema } from './file';
import { PlanProperty } from './plan_property';
import { DomainSchema, Domain } from './domain';
import { ExecutionSettings } from './execution_settings';

export interface Project extends Document{
    _id: string;
    name: string;
    user: string;
    domainFile: File;
    domainSpecification: File;
    problemFile: File;
    description: string;
    taskSchema: string;
    properties: PlanProperty[];
    settings: ExecutionSettings;
}

const ProjectSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domainFile: { type: FileSchema, required: true},
    domainSpecification: { type: FileSchema, required: true},
    problemFile: { type: FileSchema, required: true},
    description: { type: String, required: true},
    taskSchema: { type: String, required: false},
    settings: { type: mongoose.Schema.Types.ObjectId, ref: 'execution-settings' },
});

export const ProjectModel = mongoose.model<Project>('project', ProjectSchema);

