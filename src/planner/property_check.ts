import { Project } from '../db_schema/project';
import path from 'path';
import { PlanRun } from '../db_schema/run';
import { PlanProperty } from '../db_schema/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { PythonShell } from 'python-shell';

import * as child from 'child_process';
import { writeFileSync } from 'fs';
import { propertyChekcer, resultsPath, uploadsPath } from '../settings';

export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root: string,
        private planProperties: PlanProperty[],
        private planRun: PlanRun
    )
    {
        this.runFolder = path.join(root, String(this.planRun.project._id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        const domainFileName = path.basename(this.planRun.project.domainFile.path);
        const problemFileName = path.basename(this.planRun.project.problemFile.path);
        const taskSchemaFileName = path.basename(this.planRun.project.taskSchema);
        const planFileName = path.basename(this.planRun.planPath);

        child.execSync(`cp ${path.join(uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);
        child.execSync(`cp ${path.join(resultsPath, taskSchemaFileName)} ${path.join(this.runFolder, 'schema.json')}`);
        child.execSync(`cp ${path.join(resultsPath, planFileName)} ${path.join(this.runFolder, 'plan.sas')}`);


        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        console.log('plan property checker initialized');
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
            path.join(this.runFolder, 'plan.sas')];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: propertyChekcer,
            args: addArgs
        };

        const results = await this.pythonShellCall(options);

        // console.log(results);

        // TODO parse results
        return results;

    }

    pythonShellCall(options: any): Promise<string[]> {
        console.log('python call');
        const p: Promise<string[]> = new Promise((resolve, reject) => {
            console.log(options);
            // @ts-ignore
            PythonShell.run('main.py', options,  (err: any, results: any) => {
                if (err) {
                    // console.log(err);
                    reject(err);
                }
                else {
                    // console.log(results);
                    resolve(results);
                }
            });
        });
        return p;
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}