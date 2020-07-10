import { demoGenerator, resultsPath, serverResultsPath } from './../settings';
import { Demo } from './../db_schema/demo';
import { uploadsPath } from '../settings';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';

import path from 'path';
import { writeFileSync } from 'fs';
import * as child from 'child_process';
import { ExperimentSetting } from './experiment_setting';
import { PythonShell } from 'python-shell';

const runningPythonShells = new Map<string, PythonShell>();

export function cancelDemoComputation(demoId: string): Promise<boolean> {
    console.log('Cancel demo computation run!: ' + demoId);
    const p: Promise<boolean> = new Promise((resolve, reject) => {
        if (! runningPythonShells.has(demoId)) {
            console.log('Cancel demo computation run: run does not exist!');
            resolve(false);
            return;
        }
        console.log('Cancel demo computation run: run shell found: ' + runningPythonShells.size);
        runningPythonShells.get(demoId)?.end((err, exitCode, exitSignal) => {
            console.log('ExitCode: ' + exitCode);
            if (err) {
                reject(true);
                return;
            }
            if (exitCode === 0) {
                resolve(true);
                return;
            }
            if (exitCode === 1) {
                resolve(false);
                return;
            }
        });
    });
    return p;
}

export class DemoComputation {

    runFolder: string;

    constructor(
        private root: string,
        private demo: Demo,
        private planProperties: PlanProperty[]) {
        this.runFolder = path.join(root, String(this.demo._id));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}/results`);
        child.execSync(`mkdir -p ${this.runFolder}/runs`);
        const domainFileName = path.basename(this.demo.domainFile.path);
        const problemFileName = path.basename(this.demo.problemFile.path);
        const taskSchemaFileName = path.basename(this.demo.taskSchema);

        child.execSync(`cp ${path.join(uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);
        child.execSync(`cp ${path.join(resultsPath, taskSchemaFileName)} ${path.join(this.runFolder, 'task-schema.json')}`);

        writeFileSync(path.join(this.runFolder, 'plan-properties.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

    }

    generate_experiment_setting(): ExperimentSetting {
        console.log('#PlanProperties: ' + this.planProperties.length);
        return {
            hard_goals: this.planProperties.filter(p => p.globalHardGoal).map(p => p.name),
            plan_properties: this.planProperties,
            soft_goals: []
        };
    }

    async executeRun(): Promise<string> {

        const addArgs = [
            `${this.runFolder}/runs`,
            `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`,
            `${this.runFolder}/task-schema.json`,
            `${this.runFolder}/plan-properties.json`,
            `${this.runFolder}/results`
        ];

        console.log(addArgs);

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: demoGenerator,
            args: addArgs,
        };

        const returnPromise = new Promise<string>(
            async (resolve, reject) => {
                this.pythonShellCall(options).then((results) => {
                    const resultsFolder = `${this.runFolder}/results/demo.json`;
                    writeFileSync(resultsFolder, results.join('\n'), 'utf8');

                    this.copy_experiment_results();
                    resolve(`${serverResultsPath}/demo_${this.demo._id}`);
                },
                (err) => {
                    reject(err);
                });
        });

        return returnPromise;

    }

    pythonShellCall(options: any): Promise<string[]> {
        const p: Promise<string[]> = new Promise((resolve, reject) => {
            // @ts-ignore
            const shell: PythonShell = PythonShell.run('main.py', options,  (err: any, results: any) => {
                if (err) {
                    // console.warn(err);
                    reject(err);
                }
                else {
                    // console.log(results);
                    resolve(results);
                }
            });
            runningPythonShells.set(this.demo._id.toString(), shell);
        });
        return p;
    }

    copy_experiment_results(): void {
        child.execSync(`cp -r ${this.runFolder}/results/ ${resultsPath}/demo_${this.demo._id}`);
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
        runningPythonShells.delete(this.demo._id);
    }
}
