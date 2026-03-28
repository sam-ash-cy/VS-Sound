import * as vscode from "vscode";
import { logPlaySoundInfo, registerVsSoundLog } from "./logger";
import { registerDiagnosticSounds } from "./listeners/diagnostics";
import { registerTaskSounds } from "./listeners/tasks";
import { registerUnsupportedFeatureStubs } from "./listeners/stubs";
import { openDashboard, registerDashboardSideEffects } from "./ui/dashboard/panel";
import { runPlayTestCommand } from "./sounds/play";

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
            runPlayTestCommand();
        }),
    );

    context.subscriptions.push(
        registerUnsupportedFeatureStubs(),
        registerDiagnosticSounds(),
        registerTaskSounds(),
    );
}

export function deactivate(): void {}
