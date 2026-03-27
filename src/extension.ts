import * as vscode from "vscode";
import { registerDiagnosticSounds } from "./events/diagnostics";
import { registerNotificationSounds } from "./events/notifications";
import { registerTaskSounds } from "./events/tasks";
import { registerTerminalSounds } from "./events/terminal";
import { getSoundPath, isVsSoundEnabled } from "./config";
import { logPlaySoundInfo, registerVsSoundLog, revealVsSoundLog } from "./logger";
import { requestSound } from "./requestSound";

export function activate(context: vscode.ExtensionContext): void {
    registerVsSoundLog(context);
    logPlaySoundInfo("Activated.");

    context.subscriptions.push(
        vscode.commands.registerCommand("vssound.playTest", () => {
            revealVsSoundLog(true);
            if (!isVsSoundEnabled()) {
                void vscode.window.showWarningMessage("VS Sound is disabled in settings.");
                return;
            }
            const path = getSoundPath("test");
            if (!path) {
                void vscode.window.showWarningMessage(
                    "Set vssound.sounds.test to an audio file path in settings.",
                );
                return;
            }
            logPlaySoundInfo(`Test command: path from settings is "${path}".`);
            requestSound("test");
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
