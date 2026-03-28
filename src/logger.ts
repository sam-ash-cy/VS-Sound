import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;

export function registerVsSoundLog(context: vscode.ExtensionContext): void {
    channel = vscode.window.createOutputChannel("VS Sound");
    context.subscriptions.push(channel);
}

export function logPlaySoundFailure(message: string): void {
    const line = `[VS Sound] ${message}`;
    console.error(line);
    channel?.appendLine(line);
}
