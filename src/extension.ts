import * as vscode from "vscode";
import { registerDiagnosticSounds } from "./events/diagnostics";
import { registerNotificationSounds } from "./events/notifications";
import { registerTaskSounds } from "./events/tasks";
import { registerTerminalSounds } from "./events/terminal";
import { logPlaySoundInfo, registerVsSoundLog } from "./logger";
import { openDashboard, registerDashboardSideEffects } from "./panel/dashboard";
import { runPlayTestSound } from "./playTestAction";

export function activate(context: vscode.ExtensionContext): void {
    registerVsSoundLog(context);
    logPlaySoundInfo("Activated.");

    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    status.command = "vssound.openDashboard";
    status.text = "$(bell) VS Sound";
    status.tooltip = "Open VS Sound panel";
    status.show();
    context.subscriptions.push(status);

    registerDashboardSideEffects(context);

    context.subscriptions.push(
        vscode.commands.registerCommand("vssound.openDashboard", () => {
            openDashboard();
        }),
        vscode.commands.registerCommand("vssound.playTest", () => {
            runPlayTestSound();
        }),
    );

    context.subscriptions.push(
        registerTerminalSounds(),
        registerDiagnosticSounds(),
        registerTaskSounds(),
        registerNotificationSounds(),
    );
}

export function deactivate(): void {}
