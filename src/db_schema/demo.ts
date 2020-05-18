import { Project } from './project';
import { Domain, DomainSchema } from './domain';
import mongoose, { Schema } from 'mongoose';
import { File, FileSchema } from './file';

interface Explanation {
    question: string[];
    answer: string[];
}

interface Plan {
    goals: string[];
    planFile: string;
}

export interface Demo {
    name: string;
    summaryImage: string;
    project: Project;
    introduction: string;
    explanations: Explanation[];
    plans: Plan[];
    trackRuns: boolean;
    allowNewProperties: boolean; // TODO macht das Sinn?
    maxRuns: number;
    maxQuestionSize: number;
    allowQuestions: boolean;
}


const ExplanationSchema = new Schema ({
    question: [{ type: String}],
    answer: [{ type: String}],
});

const PlanSchema = new Schema ({
    goals: [{ type: String}],
    planFile: { type: String },
});

const DemoSchema = new Schema({
    name: { type: String, required: true},
    summaryImage: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    introduction: { type: String, required: false},
    explanations: [{ type: ExplanationSchema }],
    plans: [{ type: PlanSchema }],
    allowNewProperties: { type: Boolean, required: false},
    maxRuns: { type: Number, required: true},
    maxQuestionSize: { type: Number, required: true},
    allowQuestions: { type: Boolean, required: false}, // last two for survey
    trackRuns: { type: Boolean, required: false },
});

export const DemoModel = mongoose.model('demo', DemoSchema);
