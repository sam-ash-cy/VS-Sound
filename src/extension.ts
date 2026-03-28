/** Extension entry: status bar, commands, output channel, and all sound listeners. */
import * as vscode from "vscode";
import { registerVsSoundLog } from "./logger";
import { registerDebugSounds } from "./listeners/debug";
import { registerDiagnosticSounds } from "./listeners/diagnostics";
import { registerGitWorkspaceSounds } from "./listeners/gitSounds";
import { registerSaveSounds } from "./listeners/save";
import { registerTaskSounds } from "./listeners/tasks";
import { registerTerminalLifecycleSounds } from "./listeners/terminalLifecycle";
import { openDashboard, registerDashboardSideEffects } from "./ui/dashboard/panel";
import { runPlayTestCommand } from "./sounds/play";

/** Registers UI, configuration side effects, and every `register*Sounds` listener on the context. */
export function activate(context: vscode.ExtensionContext): void {
    registerVsSoundLog(context);

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
        registerDiagnosticSounds(),
        registerTaskSounds(),
        registerSaveSounds(),
        registerDebugSounds(),
        registerTerminalLifecycleSounds(),
        registerGitWorkspaceSounds(),
    );
}

export function deactivate(): void {}
