/** Webview panel singleton: create/reveal VS Sound dashboard and refresh on `vssound` config changes. */
import * as vscode from "vscode";
import { buildDashboardHtml } from "./html";
import { handleDashboardMessage, postDashboardState } from "./messages";

let panel: vscode.WebviewPanel | undefined;

/**
 * Reuse one panel instance; `retainContextWhenHidden` avoids resetting form state when hidden.
 * `localResourceRoots` is limited to the extension folder so the webview cannot read arbitrary workspace URIs as resources.
 */
export function openDashboard(extensionUri: vscode.Uri): void {
    if (panel) {
        panel.reveal(vscode.ViewColumn.One);
        postDashboardState(panel.webview);
        return;
    }

    panel = vscode.window.createWebviewPanel(
        "vssound.dashboard",
        "VS Sound",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [extensionUri],
        },
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

/** Keep the open panel in sync when the user edits settings in the Settings UI. */
export function registerDashboardSideEffects(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("vssound")) {
                refreshDashboardIfOpen();
            }
        }),
    );
}
