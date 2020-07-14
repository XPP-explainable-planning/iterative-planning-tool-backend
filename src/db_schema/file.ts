import mongoose, { Schema, Document } from 'mongoose';

export interface File extends Document{
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

export const FileModel = mongoose.model<File>('file', FileSchema);

