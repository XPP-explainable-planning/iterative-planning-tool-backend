import 'process';
import path from 'path';
import * as child from 'child_process';
import 'fs';

import { Project } from '../db_schema/project';
import { Run } from '../db_schema/run';
import { PlanProperty } from '../db_schema/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { planner, uploadsPath, spot, ltlkit, resultsPath } from '../settings';
import { writeFileSync } from 'fs';
import { PythonShell } from 'python-shell';

// const plannerSetting = '--heuristic "h=hc(nogoods=false, cache_estimates=false)" --heuristic "mugs_h=mugs_hc(hc=h, all_softgoals=false)"
// --search "dfs(u_eval=mugs_h)"';
const plannerSetting = ['--heuristic', 'h=hc(nogoods=false, cache_estimates=false)', '--heuristic',
   'mugs_h=mugs_hc(hc=h, all_softgoals=false)', '--search', 'dfs(u_eval=mugs_h)'];

export class PlannerCall {

    runFolder: string;
    project: Project;
    run: Run;

    runid: string;

    constructor(root: string, run: Run) {
        this.runid = run._id;
        this.runFolder = path.join(root, String(this.runid));
        this.project = run.project;
        this.run = run;
        // console.log(this.run);

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        const out = child.execSync(`mkdir ${this.runFolder}`);
        const domainFileName = path.basename(this.project.domain_file.path);
        const problemFileName = path.basename(this.project.problem_file.path);

        child.execSync(`cp ${path.join(uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        // child.execSync(`ln -s ${planner} ${this.runFolder}`);
        child.execSync(`cp -r ${planner} ${this.runFolder}/fast-downward`);
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = [];
        const softGoals: string[] = [];
        const properties: PlanProperty[] = [];

        for (const g of this.run.hard_properties) {
            properties.push(g);
            hardGoals.push(g.name);
        }

        for (const g of this.run.soft_properties) {
            properties.push(g);
            softGoals.push(g.name);
        }

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals};
    }

    async run_planner_python_shell(): Promise<void> {

        const addArgs = ['--build', 'release64', `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`, `${this.runFolder}/exp_setting.json`, ...plannerSetting];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: `${this.runFolder}/fast-downward/`,
            args: addArgs,
            env: { SPOT_BIN_PATH: spot, LTL2HAO_PATH: ltlkit},
        };

        const results = await this.pythonShellCall(options);
        console.log('planner finished');
        // console.log(results.join('\n'));
        writeFileSync(path.join(resultsPath, `out_${this.runid}.log`), results.join('\n'), 'utf8');

        this.copy_experiment_results();
    }

    pythonShellCall(options: any): Promise<string[]> {
        const p: Promise<string[]> = new Promise((resolve, reject) => {
            // @ts-ignore
            PythonShell.run('fast-downward.py', options,  (err: any, results: any) => {
                if (err) {
                    console.warn(err);
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
        return p;
    }

    copy_experiment_results(): void {
        child.spawnSync('cp', [path.join(this.runFolder + '/fast-downward/', 'mugs.json'),
            path.join(resultsPath, `mugs_${this.runid}.json`)]);

        this.run.result = path.join(uploadsPath, `mugs_${this.runid}.json`);
        this.run.log = path.join(uploadsPath, `out_${this.runid}.log`);
    }
}
