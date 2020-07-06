import { Demo } from './demo';
import mongoose, { Schema, Document } from 'mongoose';

export enum UserStudyStepType {
    description = 'description',
    form = 'form',
    demo = 'demo',
  }

export interface UserStudyStep extends Document{
    type: UserStudyStepType;
    content: string;
  }

export interface UserStudy extends Document{
    name: string;
    user: string;
    description: string;
    startDate: string;
    endDate: string;
    steps: UserStudyStep[];
    available: boolean;
    redirectUrl?: string;
}

const UserStudyStepSchema = new Schema({
    type: { type: String, required: true},
    content: { type: String, required: true}
});

const UserStudySchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true},
    startDate: { type: String, required: true},
    endDate: { type: String, required: true},
    steps: [{ type: UserStudyStepSchema, required: false}],
    available: { type: Boolean, required: true},
    redirectUrl: { type: String, required: false},
});

export const UserStudyModel = mongoose.model('user-study', UserStudySchema);