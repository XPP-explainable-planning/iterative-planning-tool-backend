import mongoose, { Schema, Document } from 'mongoose';
import { } from 'validate-typescript';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface USUser extends Document{
    prolificId: string;
    userStudyId: string;
    token?: string;
    finished?: string;
}

const USUserSchema =  new Schema<USUser>({
    prolificId: {
        type: String,
        required: true,
        trim: true
    },
    userStudyId: {
        type: String,
        required: true,
        trim: true
    },
    token: {
        type: String,
        required: false
    },
    finished: {
        type: String,
        required: false
    }
}, { timestamps: true});


USUserSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this;
    const token = jwt.sign({ _id: user._id}, process.env.JWT_KEY || '0' );
    user.token = token;
    await user.save();
    return token;
};

USUserSchema.statics.findByCredentials = async (prolificId: string) => {

    const user = await USUserModel.findOne({ prolificId} );
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    return user;
};

export const USUserModel = mongoose.model<USUser>('us-user', USUserSchema);

