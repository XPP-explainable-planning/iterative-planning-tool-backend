import { RunStatus } from './run';
import { Project, BaseProjectModel } from './project';
import mongoose, { Schema, Document } from 'mongoose';
import { ExecutionSettings } from './execution_settings';

export interface Demo  extends Project{
    status: RunStatus;
    definition: string;
    introduction: string;
    summaryImage?: string;
}

const DemoSchema = new Schema({
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    status: { type: Number, required: true},
    definition: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

