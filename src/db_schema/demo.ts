import { RunStatus } from './run';
import { Project } from './project';
import mongoose, { Schema, Document } from 'mongoose';
import { ExecutionSettings } from './execution_settings';

export interface Demo  extends Document{
    _id: string;
    name: string;
    user: string;
    summaryImage?: string;
    project: Project;
    introduction: string;
    status: RunStatus;
    definition: string;
    settings: ExecutionSettings;
}

const DemoSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    summaryImage: { type: String, required: false},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    introduction: { type: String, required: false},
    status: { type: Number, required: true},
    definition: { type: String, required: false},
    settings: { type: mongoose.Schema.Types.ObjectId, ref: 'execution-settings' },
});

export const DemoModel = mongoose.model<Demo>('demo', DemoSchema);
