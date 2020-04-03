import mongoose, { Schema } from 'mongoose';

export interface PddlFile {
    name: string;
    domain: string;
    type: string;
    path: string;
}

export const PddlFileSchema = new Schema({
    name: { type: String, required: true},
    domain: { type: String, required: true},
    type: { type: String, required: true},
    path: { type: String, required: true},
});

export const PddlFileModel = mongoose.model('pddl-file', PddlFileSchema);

