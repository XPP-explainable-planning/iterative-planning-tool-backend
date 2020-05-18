import { File } from '../db_schema/file';

import { readFile } from 'fs';
import 'assert';
import path from 'path';
import * as child from 'child_process';
import { uploadsPath, resultsPath } from '../settings';


export async function getGoalFacts(pddFile: File): Promise<string[]> {
    console.assert(pddFile.type === 'problem');
    const localPath = path.join(uploadsPath, path.basename(pddFile.path));

    const fileContentPromise = new Promise<string>((resolve, reject) => {

        readFile(localPath, (err, buffer) => {

            if (err) {
                reject(err);
                return;
            }

            const content = buffer.toString('utf8');
            resolve(content);
        });
    });

    const fileContent = await fileContentPromise;

    const goals: string[] = parseGoalFacts(fileContent);

    return goals;
}

function parseGoalFacts(content: string) {
    const lines = content.split('\n');
    const goalsStrings: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes(':goal')) {
            i++; // line with opening bracket
            line = lines[++i];
            while (!line.startsWith(')')) {
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
    return goals;
}

function deleteFile(filepath: string): void {
    child.spawnSync('rm ', [filepath]);
}

export function deleteResultFile(filepath: string): void {
    const filename = path.basename(filepath);
    deleteFile(path.join(resultsPath, filename));
}

export function deleteUploadFile(filepath: string): void {
    const filename = path.basename(filepath);
    deleteFile(path.join(uploadsPath, filename));
}

