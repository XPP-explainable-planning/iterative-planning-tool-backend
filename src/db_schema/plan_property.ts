import mongoose, { Schema } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';

export interface PlanProperty {
    name: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    type: { type: String, required: true},
    formula: { type: String, required: true},
    actionSets: [ActionSetSchema]
});

export const PlanPropertyModel = mongoose.model('plan-property', PlanPropertySchema);


