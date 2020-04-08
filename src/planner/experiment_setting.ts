import { PlanProperty } from '../db_schema/plan_property';

export interface ExperimentSetting {
    plan_properties: PlanProperty[];
    hard_goals: string[];
    soft_goals: string[];
}
