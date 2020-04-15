import mongoose, { Schema } from 'mongoose';
import { PddlFile, PddlFileModel, PddlFileSchema } from './pddl_file';
import { PlanProperty } from './plan_property';
import { Project } from './project';

export enum Status {
    pending,
    running,
    failed,
    finished
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

export interface  ExplanationRun{
    _id: string;
    name: string;
    type: RunType;
    status: Status;
    planProperties: PlanProperty[];
    hardGoals: Goal[];
    softGoals: Goal[];
    log: string;
    result: string;
}

export interface  PlanRun{
    _id: string;
    name: string;
    type: RunType;
    status: Status;
    project: Project;
    planProperties: PlanProperty[];
    hardGoals: Goal[];
    log: string;
    plan: string;
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
    softGoals: [GoalSchema],
    log: { type: String, required: false},
    plan: { type: String, required: false},
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
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
});

export const PlanRunModel = mongoose.model('plan-run', PlanRunSchema);
export const ExplanationRunModel = mongoose.model('explanation-run', ExplanationRunSchema);
