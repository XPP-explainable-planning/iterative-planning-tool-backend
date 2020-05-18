import mongoose, { Schema } from 'mongoose';

export interface Domain {
    _id: string;
    name: string;
    definition: string;
}

export const DomainSchema = new Schema({
    name: { type: String, required: true},
    definition: { type: String, required: true},
});

export const DomainModel = mongoose.model('domain', DomainSchema);