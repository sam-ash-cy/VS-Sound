import * as vscode from "vscode";
import { requestSound } from "../requestSound";

export function registerTaskSounds(): vscode.Disposable {
    return vscode.tasks.onDidEndTaskProcess((e) => {
        const code = e.exitCode;
        if (code === 0) {
            requestSound("buildSuccess");
        } else if (code !== undefined) {
            requestSound("buildFailure");
        }
    });
}
