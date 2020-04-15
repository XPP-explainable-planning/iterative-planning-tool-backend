import { PddlFile } from '../db_schema/pddl_file';

import { readFileSync } from 'fs';
import 'assert';
import { uploadsPath } from '../settings';
import path from 'path';

export function get_goal_facts(pddFile: PddlFile): string[] {
    console.assert(pddFile.type === 'problem');
    const localPath = path.join(uploadsPath, path.basename(pddFile.path));
    const content: string = readFileSync(localPath).toString('utf8');
    const lines = content.split('\n');
    const goalsStrings: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes(':goal')) {
            i++; // line with opening bracket
            line = lines[++i];
            while ( ! line.startsWith(')')) {
                goalsStrings.push(line);
                line = lines[++i];
            }
        }
    }
    const goals: string[] = goalsStrings.map((value, index) => {
        const noBrackets = value.replace('(', '').replace(')', '');
       const [op, ...args] = noBrackets.split(' ');
       return op + '(' + args.join(',') + ')';
    });
    // console.log('Goal facts');
    // console.log(goals);
    return goals;
}
