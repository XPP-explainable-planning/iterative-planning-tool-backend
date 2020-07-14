import { Project } from './../db_schema/project';
import path from 'path';
import { PlanRun } from '../db_schema/run';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import * as child from 'child_process';
import { writeFileSync } from 'fs';
import { propertyChekcer, resultsPath, uploadsPath } from '../settings';
import { pythonShellCallSimple } from './python-call';

export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root: string,
        private planProperties: PlanProperty[],
        private planRun: PlanRun)
    {
        this.runFolder = path.join(root, String((this.planRun.project as Project)._id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        const project: Project = this.planRun.project as Project;

        const domainFileName = path.basename(project.domainFile.path);
        const problemFileName = path.basename(project.problemFile.path);
        const taskSchemaFileName = path.basename(project.taskSchema);

        child.execSync(`cp ${path.join(uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);
        child.execSync(`cp ${path.join(resultsPath, taskSchemaFileName)} ${path.join(this.runFolder, 'schema.json')}`);

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        writeFileSync(path.join(this.runFolder, 'plan.sas'),
            this.planRun.planString,
            'utf8');
    }

    generate_experiment_setting(): ExperimentSetting {
        return { hard_goals: [], plan_properties: this.planProperties, soft_goals: []};
    }

    async executeRun(): Promise<string[]> {

        const addArgs = [
            path.join(this.runFolder, 'domain.pddl'),
            path.join(this.runFolder, 'problem.pddl'),
            path.join(this.runFolder, 'exp_setting.json'),
            path.join(this.runFolder, 'schema.json'),
            path.join(this.runFolder, 'plan.sas')
        ];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: propertyChekcer,
            args: addArgs
        };

        return await pythonShellCallSimple('main.py', options);
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}
