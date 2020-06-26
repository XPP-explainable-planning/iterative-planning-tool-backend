import mongoose, { Schema, Document } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';
import { Project } from './project';

export interface PlanProperty extends Document {
    name: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
    naturalLanguageDescription: string;
    project: string;
    isUsed: boolean;
    globalHardGoal: boolean;
    value: number;
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    type: { type: String, required: true},
    formula: { type: String, required: true},
    actionSets: [ActionSetSchema],
    naturalLanguageDescription: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    isUsed: { type: Boolean, required: true},
    globalHardGoal: { type: Boolean, required: true},
    value: { type: Number, required: true}
});

export const PlanPropertyModel = mongoose.model<PlanProperty>('plan-property', PlanPropertySchema);

