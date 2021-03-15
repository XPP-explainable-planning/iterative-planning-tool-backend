import { PythonShell, PythonShellError } from 'python-shell';

export interface CallResult{
    planFound: boolean;
    log: string[];
}


export function pythonShellCallSimple(scriptPath: string, options: any): Promise<string[]> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        PythonShell.run(scriptPath, options,  (err: any, results: any) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(results);
            }
        });
    });
}

export function pythonShellCallFD(options: any): Promise<CallResult> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        PythonShell.run('run_FD.py', options,  (err: PythonShellError, results: any) => {
            if (err) {
                if (err.exitCode === 12 || err.exitCode === 22 || err.exitCode === 23) {
                    resolve({ planFound: false, log: []});
                    return;
                }
                console.log(err);
                reject(err);
            }
            else {
                resolve({ planFound: true, log: results});
            }
        });
    });

}
