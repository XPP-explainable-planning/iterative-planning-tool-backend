import mongoose, { Schema, Document } from 'mongoose';


export interface  USExplanationRun extends Document{
    _id: string;
    user: string;
    explanationRun: string;
}

export interface  USPlanRun extends Document{
    _id: string;
    user: string;
    planRun: string;
}

const USPlanRunSchema = new Schema({
    user: { type: String, required: true},
    explanationRun: { type: mongoose.Schema.Types.ObjectId, ref: 'explanation-run' },
}, { timestamps: true});

const USExplanationRunSchema = new Schema({
    user: { type: String, required: true},
    plaRun: { type: mongoose.Schema.Types.ObjectId, ref: 'plan-run' },
}, { timestamps: true});

export const USPlanRunModel = mongoose.model<USPlanRun>('us-plan-run', USPlanRunSchema);
export const USExplanationRunModel = mongoose.model<USExplanationRun>('us-explanation-run', USExplanationRunSchema);
