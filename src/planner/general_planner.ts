import 'process';
import path from 'path';
import * as child from 'child_process';
import 'fs';

import { Project } from '../db_schema/project';
import { PlanRun, ExplanationRun, Goal } from '../db_schema/run';
import { PlanProperty } from '../db_schema/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { planner, uploadsPath, spot, ltlkit, resultsPath, serverResultsPath } from '../settings';
import { writeFileSync } from 'fs';
import { PythonShell } from 'python-shell';

// const plannerSetting = '--heuristic "h=hc(nogoods=false, cache_estimates=false)" --heuristic "mugs_h=mugs_hc(hc=h, all_softgoals=false)"
// --search "dfs(u_eval=mugs_h)"';
const plannerSetting = ['--heuristic', 'h=hc(nogoods=false, cache_estimates=false)', '--heuristic',
   'mugs_h=mugs_hc(hc=h, all_softgoals=false)', '--search', 'dfs(u_eval=mugs_h)'];

export class PlannerCall {

    runFolder: string;

    constructor(
        protected root: string,
        protected runId: string,
        protected domainFile: string,
        protected problemFile: string,
        protected planProperties: PlanProperty[],
        protected hardGoals: Goal[],
        protected softGoals: Goal[]) {
        this.runFolder = path.join(root, String(this.runId));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        const out = child.execSync(`mkdir ${this.runFolder}`);
        const domainFileName = path.basename(this.domainFile);
        const problemFileName = path.basename(this.problemFile);

        child.execSync(`cp ${path.join(uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        // child.execSync(`ln -s ${planner} ${this.runFolder}`);
        child.execSync(`cp -r ${planner} ${this.runFolder}/fast-downward`);
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = this.hardGoals.map(value => value.name);
        const softGoals: string[] = this.softGoals.map(value => value.name);
        const properties: PlanProperty[] = this.planProperties;

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals};
    }

    async run_planner_python_shell(): Promise<void> {

        const addArgs = [this.runFolder, '--build', 'release64', `${this.runFolder}/domain.pddl`,
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
        writeFileSync(path.join(resultsPath, `out_${this.runId}.log`), results.join('\n'), 'utf8');

        this.copy_experiment_results();
    }

    pythonShellCall(options: any): Promise<string[]> {
        const p: Promise<string[]> = new Promise((resolve, reject) => {
            // @ts-ignore
            PythonShell.run('run_FD.py', options,  (err: any, results: any) => {
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
        // implement in subclass
    }
}

export class PlanCall extends PlannerCall{

    constructor(root: string, private run: PlanRun) {
        super(root, run._id, run.project.domainFile.path, run.project.problemFile.path, run.planProperties, run.hardGoals, []);
    }

    copy_experiment_results(): void {
        child.spawnSync('cp', [path.join(this.runFolder, 'sas_plan'),
            path.join(resultsPath, `plan_${this.runId}.sas`)]);

        this.run.log = serverResultsPath + `/out_${this.runId}.log`;
        this.run.plan = serverResultsPath + `/plan_${this.runId}.sas`;
    }
}

export class ExplanationCall extends PlannerCall{

    constructor(root: string, project: Project, private run: ExplanationRun) {
        super(root, run._id, project.domainFile.path, project.problemFile.path, run.planProperties, run.hardGoals, run.softGoals);
    }

    copy_experiment_results(): void {
        child.spawnSync('cp', [path.join(this.runFolder, 'mugs.json'),
            path.join(resultsPath, `mugs_${this.runId}.json`)]);

        this.run.result = serverResultsPath + `/mugs_${this.runId}.json`;
        this.run.log = serverResultsPath + `/out_${this.runId}.log`;
    }
}
