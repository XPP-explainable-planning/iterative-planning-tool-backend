import mongoose, { Schema } from 'mongoose';

export interface Action {
    name: string;
    params: string[];
}

export interface ActionSet {
    _id: string;
    name: string;
    actions: Action[];
}

export const ActionSchema = new Schema({
    name: { type: String, required: true},
    params: [{ type: String, required: true}],
});

export const ActionSetSchema = new Schema({
    name: { type: String, required: true},
    actions: [{ type: ActionSchema, required: true}],
});

export const ActionSetModel = mongoose.model('action_set', ActionSetSchema);
export const ActionModel = mongoose.model('action', ActionSchema);

