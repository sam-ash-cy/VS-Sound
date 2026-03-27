import * as vscode from "vscode";
import { getSoundPath, isVsSoundEnabled } from "./config";
import { logPlaySoundInfo, revealVsSoundLog } from "./logger";
import { requestSound } from "./requestSound";

export function runPlayTestSound(): void {
    revealVsSoundLog(true);
    if (!isVsSoundEnabled()) {
        void vscode.window.showWarningMessage("VS Sound is disabled.");
        return;
    }
    const path = getSoundPath("test");
    if (!path) {
        void vscode.window.showWarningMessage('Set a path for "Test" in the VS Sound panel or settings.');
        return;
    }
    logPlaySoundInfo(`Test: "${path}".`);
    requestSound("test");
}
