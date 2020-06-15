import { RunStatus } from './run';
import { Project } from './project';
import mongoose, { Schema, Document } from 'mongoose';

export interface Demo  extends Document{
    _id: string;
    name: string;
    user: string;
    summaryImage?: string;
    project: Project;
    introduction: string;
    status: RunStatus;
    definition: string;
    maxRuns: number;
    maxQuestionSize: number;
    public: boolean;
}

const DemoSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    summaryImage: { type: String, required: false},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    introduction: { type: String, required: false},
    status: { type: Number, required: true},
    definition: { type: String, required: false},
    maxRuns: { type: Number, required: true},
    maxQuestionSize: { type: Number, required: true},
    public: { type: Boolean, required: true},
});

export const DemoModel = mongoose.model('demo', DemoSchema);
