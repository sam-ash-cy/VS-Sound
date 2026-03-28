import * as vscode from "vscode";
import { buildDashboardHtml } from "./html";
import { handleDashboardMessage, postDashboardState } from "./messages";

let panel: vscode.WebviewPanel | undefined;

export function openDashboard(): void {
    if (panel) {
        panel.reveal(vscode.ViewColumn.One);
        postDashboardState(panel.webview);
        return;
    }

    panel = vscode.window.createWebviewPanel(
        "vssound.dashboard",
        "VS Sound",
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true },
    );

    panel.webview.html = buildDashboardHtml(panel.webview);

    panel.webview.onDidReceiveMessage((msg) => {
        void handleDashboardMessage(msg, panel!.webview);
    });

    panel.onDidDispose(() => {
        panel = undefined;
    });
}

export function refreshDashboardIfOpen(): void {
    if (panel) {
        postDashboardState(panel.webview);
    }
}

export function registerDashboardSideEffects(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("vssound")) {
                refreshDashboardIfOpen();
            }
        }),
    );
}
