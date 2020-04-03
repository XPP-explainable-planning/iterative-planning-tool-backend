import mongoose, { Schema } from 'mongoose';

export interface ActionSet {
    _id: string;
    name: string;
    actions: [string];
}

export const ActionSetSchema = new Schema({
    name: { type: String, required: true},
    actions: [{ type: String, required: true}],
});

export const ActionSetModel = mongoose.model('action_set', ActionSetSchema);

