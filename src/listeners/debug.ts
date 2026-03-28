/** Maps debug adapter session lifecycle to `debugStart` / `debugEnd` sound kinds. */
import * as vscode from "vscode";
import { requestSound } from "../sounds/play";


export function registerDebugSounds(): vscode.Disposable {
    const a = vscode.debug.onDidStartDebugSession(() => {
        requestSound("debugStart");
    });
    const b = vscode.debug.onDidTerminateDebugSession(() => {
        requestSound("debugEnd");
    });
    return vscode.Disposable.from(a, b);
}
