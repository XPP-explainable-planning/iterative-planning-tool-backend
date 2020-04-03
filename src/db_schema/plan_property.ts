import mongoose, { Schema } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';

export interface PlanProperty {
    name: string;
    domain: string;
    type: string;
    formula: string;
    action_sets: [ActionSet];
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    domain: { type: String, required: true},
    type: { type: String, required: true},
    formula: { type: String, required: true},
    action_sets: [ActionSetSchema]
});

export const PlanPropertyModel = mongoose.model('plan-property', PlanPropertySchema);


