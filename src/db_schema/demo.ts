import { RunStatus } from './run';
import { BaseProjectModel, Project } from './project';
import { Schema } from 'mongoose';

export interface Demo  extends Project{
    status: RunStatus;
    definition: string;
    introduction: string;
    summaryImage?: string;
    taskInfo?: string;
}

const DemoSchema = new Schema({
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    status: { type: Number, required: true},
    definition: { type: String, required: false},
    taskInfo: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

