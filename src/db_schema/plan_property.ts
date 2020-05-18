import mongoose, { Schema } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';
import { Project } from './project';

export interface PlanProperty {
    name: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
    naturalLanguageDescription: string;
    project: string;
    isUsed: boolean;
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    type: { type: String, required: true},
    formula: { type: String, required: true},
    actionSets: [ActionSetSchema],
    naturalLanguageDescription: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    isUsed: {type: Boolean, required: true}
});

export const PlanPropertyModel = mongoose.model('plan-property', PlanPropertySchema);

