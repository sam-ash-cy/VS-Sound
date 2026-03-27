import * as vscode from "vscode";

// No public API for workbench toasts; extend when you own the notification path.
export function registerNotificationSounds(): vscode.Disposable {
    return new vscode.Disposable(() => {});
}
