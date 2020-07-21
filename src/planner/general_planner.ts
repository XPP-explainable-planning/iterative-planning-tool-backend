import { Project } from './../db_schema/project';
import 'process';
import path from 'path';
import * as child from 'child_process';
import 'fs';

import { ExplanationRun, PlanRun } from '../db_schema/run';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { readFileSync, writeFileSync } from 'fs';
import { CallResult, pythonShellCallFD, pythonShellCallSimple } from './python-call';
import { environment } from '../app';


export class TranslatorCall{

    runFolder: string;

    constructor(
        protected root: string,
        private project: Project) {
        this.runFolder = path.join(root, String(this.project._id));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}`);
        const domainFileName = path.basename(this.project.domainFile.path);
        const problemFileName = path.basename(this.project.problemFile.path);

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    async executeRun(): Promise<void> {

        const addArgs = [this.runFolder, '--build', 'release64', '--translate' , `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: `${this.runFolder}/fast-downward/`,
            args: addArgs,
            env: { SPOT_BIN_PATH: environment.spot, LTL2HAO_PATH: environment.ltltkit},
        };

        const results = await pythonShellCallSimple('run_FD.py', options);
        writeFileSync(path.join(environment.resultsPath, `out_${this.project._id}.log`), results.join('\n'), 'utf8');

        this.copy_experiment_results();
    }

    copy_experiment_results(): void {
        child.spawnSync('cp', [path.join(this.runFolder, 'fdr.json'),
            path.join(environment.resultsPath, `task_schema_${this.project._id}.json`)]);

        this.project.taskSchema = environment.serverResultsPath + `/task_schema_${this.project._id}.json`;
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}



export class PlannerCall {

    runFolder: string;

    constructor(
        protected plannerSetting: string[],
        protected root: string,
        protected runId: string,
        protected domainFile: string,
        protected problemFile: string,
        protected planProperties: PlanProperty[],
        protected hardGoals: string[],
        protected softGoals: string[]) {
        this.runFolder = path.join(root, String(this.runId));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}`);
        const domainFileName = path.basename(this.domainFile);
        const problemFileName = path.basename(this.problemFile);
        console.log(domainFileName);
        console.log(path.join(environment.uploadsPath, domainFileName));

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = this.hardGoals;
        const softGoals: string[] = this.softGoals;
        const properties: PlanProperty[] = this.planProperties;

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals};
    }

    async executeRun(): Promise<boolean> {

        const addArgs = [this.runFolder, '--build', 'release64', `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`, `${this.runFolder}/exp_setting.json`, ...this.plannerSetting];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: `${this.runFolder}/fast-downward/`,
            args: addArgs,
            env: { SPOT_BIN_PATH: environment.spot, LTL2HAO_PATH: environment.ltltkit},
        };

        const plannerResults : CallResult = await pythonShellCallFD(options);

        if (plannerResults.planFound) {
            writeFileSync(path.join(environment.resultsPath, `out_${this.runId}.log`), plannerResults.log.join('\n'), 'utf8');
            this.copy_experiment_results();
        }

        return plannerResults.planFound;
    }

    copy_experiment_results(): void {
        // implement in subclass
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}



const plannerSettingOptPlan = ['--search', 'astar(lmcut())'];
export class PlanCall extends PlannerCall{

    constructor(root: string, private run: PlanRun) {
        super(plannerSettingOptPlan, root, run._id, (run.project as Project).domainFile.path,
            (run.project as Project).problemFile.path, run.planProperties, run.hardGoals, []);
    }

    copy_experiment_results(): void {
        const buffer: Buffer = readFileSync(path.join(this.runFolder, 'sas_plan'));
        this.run.planString = buffer.toString('utf8');

        this.run.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}



const plannerSettingMUGS = ['--heuristic', 'h=hc(nogoods=false, cache_estimates=false)', '--heuristic',
   'mugs_h=mugs_hc(hc=h, all_softgoals=false)', '--search', 'dfs(u_eval=mugs_h)'];
export class ExplanationCall extends PlannerCall{

    constructor(root: string, project: Project, private run: ExplanationRun) {
        super(plannerSettingMUGS, root, run._id, project.domainFile.path,
            project.problemFile.path, run.planProperties, run.hardGoals, run.softGoals);
    }

    copy_experiment_results(): void {
        const buffer: Buffer = readFileSync(path.join(this.runFolder, 'mugs.json'));
        this.run.result = buffer.toString('utf8');

        this.run.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}



