import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;

export function registerVsSoundLog(context: vscode.ExtensionContext): void {
    channel = vscode.window.createOutputChannel("VS Sound");
    context.subscriptions.push(channel);
    channel.appendLine(
        '[VS Sound] Logging here. Command Palette → "VS Sound: Play Test Sound" to test.',
    );
    channel.show(true);
}

export function logPlaySoundFailure(message: string): void {
    const line = `[VS Sound] ${message}`;
    console.error(line);
    channel?.appendLine(line);
}

export function logPlaySoundInfo(message: string): void {
    const line = `[VS Sound] ${message}`;
    console.log(line);
    channel?.appendLine(line);
}

export function revealVsSoundLog(preserveFocus?: boolean): void {
    channel?.show(preserveFocus ?? true);
}
