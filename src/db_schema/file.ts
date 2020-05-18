import mongoose, { Schema } from 'mongoose';

export interface File {
    name: string;
    domain: string;
    type: string;
    path: string;
}

export const FileSchema = new Schema({
    name: { type: String, required: true},
    domain: { type: String, required: true},
    type: { type: String, required: true},
    path: { type: String, required: true},
});

export const FileModel = mongoose.model('file', FileSchema);

