/**
 * Terminal open → `terminalOpen`; close → success vs failure sound from `exitStatus.code` (may be missing).
 */
import * as vscode from "vscode";
import { requestSound } from "../sounds/play";

/** Open/close terminal hooks; close handler no-ops when `exitStatus` is unavailable. */
export function registerTerminalLifecycleSounds(): vscode.Disposable {
    const a = vscode.window.onDidOpenTerminal(() => {
        requestSound("terminalOpen");
    });
    const b = vscode.window.onDidCloseTerminal((terminal) => {
        const st = terminal.exitStatus;
        if (st === undefined) {
            return;
        }
        const code = st.code;
        if (code === undefined || code === 0) {
            requestSound("terminalExitSuccess");
        } else {
            requestSound("terminalExitFailure");
        }
    });
    return vscode.Disposable.from(a, b);
}
