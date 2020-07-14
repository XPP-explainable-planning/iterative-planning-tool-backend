import mongoose, { Document, Schema } from 'mongoose';

export interface ExecutionSettings  extends Document{
    maxRuns: number;
    maxQuestionSize: number;
    public: boolean;
    allowQuestions: boolean;
    usePlanPropertyValues: boolean;
    useTimer: boolean;
    measureTime: boolean;
    maxTime: number;
    showAnimation: boolean;
}

const ExecutionSettingsSchema = new Schema({
    maxRuns: { type: Number, required: true},
    maxQuestionSize: { type: Number, required: true},
    public: { type: Boolean, required: true},
    allowQuestions: { type: Boolean, required: false},
    usePlanPropertyValues: { type: Boolean, required: false},
    useTimer: { type: Boolean, required: false},
    measureTime: { type: Boolean, required: false},
    maxTime: { type: Number, required: false},
    showAnimation: { type: Boolean, required: false},
});


ExecutionSettingsSchema.statics.createProjectDefaultSettings = async (): Promise<string> => {

    const settings = new ExecutionSettingsModel({
        maxRuns: 100,
        maxQuestionSize: 3,
        public: false,
        allowQuestions: true
    });

    const result = await settings.save();

    if (! result) {
         throw new Error('Create settings failed');
    }

    return result._id;
};


ExecutionSettingsSchema.statics.createDemoDefaultSettings = async (): Promise<string> => {

    const settings = new ExecutionSettingsModel({
        maxRuns: 10,
        maxQuestionSize: 1,
        public: false,
        allowQuestions: true
    });

    const result = await settings.save();

    if (! result) {
         throw new Error('Create settings failed');
    }

    return result._id;
};

export const ExecutionSettingsModel = mongoose.model<ExecutionSettings>('execution-settings', ExecutionSettingsSchema);
