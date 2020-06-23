import mongoose, { Schema, Document } from 'mongoose';
import { File, FileModel, FileSchema } from './file';
import { PlanProperty } from './plan_property';
import { Project } from './project';

export enum RunStatus {
    pending,
    running,
    failed,
    finished,
    noSolution,
}

export enum GoalType {
    planProperty = 'P',
    goalFact = 'G'
}

export enum RunType {
    plan = 'PLAN',
    mugs = 'MUGS',
}

export interface Goal {
    name: string;
    goalType: GoalType;
}

export interface  ExplanationRun extends Document{
    _id: string;
    name: string;
    type: RunType;
    status: RunStatus;
    planProperties: PlanProperty[];
    hardGoals: Goal[];
    softGoals: Goal[];
    log: string;
    result: string;
    planRun: string;
}

export interface  PlanRun extends Document{
    _id: string;
    name: string;
    type: RunType;
    status: RunStatus;
    project: Project;
    planProperties: PlanProperty[];
    hardGoals: Goal[];
    log: string;
    planString: string;
    satPlanProperties: string[];
    explanationRuns: ExplanationRun[];
    previousRun: string;
}

const GoalSchema = new Schema({
    name: { type: String, required: true},
    goalType: { type: String, required: true},
});

const PlanRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    type: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    planProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    hardGoals: [GoalSchema],
    log: { type: String, required: false},
    planString: { type: String, required: false},
    satPlanProperties: [{ type: String, required: false}],
    explanationRuns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'explanation-run' }],
    previousRun: { type: mongoose.Schema.Types.ObjectId, ref: 'plan-run' },
});

const ExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    type: { type: String, required: true},
    planProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    hardGoals: [GoalSchema],
    softGoals: [GoalSchema],
    log: { type: String, required: false},
    result: { type: String, required: false},
    planRun: { type: mongoose.Schema.Types.ObjectId, ref: 'plan-run' },
});

export const PlanRunModel = mongoose.model<PlanRun>('plan-run', PlanRunSchema);
export const ExplanationRunModel = mongoose.model<ExplanationRun>('explanation-run', ExplanationRunSchema);
