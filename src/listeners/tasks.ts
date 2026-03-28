/** Task process exit code → `buildSuccess` (0) or `buildFailure` (non-zero with defined code). */
import * as vscode from "vscode";
import { requestSound } from "../sounds/play";

/** Fires for each task process end; `exitCode` undefined is ignored (still running / unknown). */
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
