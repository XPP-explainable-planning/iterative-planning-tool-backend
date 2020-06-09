import { Demo } from './demo';
import mongoose, { Schema } from 'mongoose';

export interface Survey {
    name: string;
    summaryImage: string;
    demo: Demo;
    introduction: string;
    trackRuns: boolean;
    maxRuns: number;
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
