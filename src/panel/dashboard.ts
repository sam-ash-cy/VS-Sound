import { randomBytes } from "crypto";
import * as vscode from "vscode";
import {
    getDashboardState,
    setFeatureDiagnostics,
    setFeatureTasks,
    setSoundPaths,
    setVsSoundEnabled,
} from "../config";
import { runPlayTestSound } from "../playTestAction";

let dashboardPanel: vscode.WebviewPanel | undefined;

function postState(webview: vscode.Webview): void {
    webview.postMessage({ type: "state", ...getDashboardState() });
}

function dashboardHtml(webview: vscode.Webview): string {
    const nonce = randomBytes(16).toString("base64");
    const csp = [
        "default-src 'none'",
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `script-src 'nonce-${nonce}'`,
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VS Sound</title>
  <style>
    body {
      padding: 16px 20px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.45;
      max-width: 520px;
    }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 16px; }
    h2 { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; margin: 20px 0 10px; }
    .row { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
    label { flex: 1; cursor: pointer; }
    input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid var(--vscode-input-border, rgba(127,127,127,.35));
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 2px;
    }
    button {
      padding: 8px 14px;
      margin: 6px 8px 0 0;
      cursor: pointer;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      font-size: var(--vscode-font-size);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button:hover { opacity: 0.92; }
    .hint { font-size: 0.85rem; opacity: 0.75; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>VS Sound</h1>

  <div class="row">
    <input type="checkbox" id="toggle-enabled" />
    <label for="toggle-enabled">Enable VS Sound</label>
  </div>

  <h2>Features</h2>
  <div class="row">
    <input type="checkbox" id="toggle-diagnostics" />
    <label for="toggle-diagnostics">Sounds on errors (diagnostics)</label>
  </div>
  <div class="row">
    <input type="checkbox" id="toggle-tasks" />
    <label for="toggle-tasks">Sounds on task finish (build success / failure)</label>
  </div>

  <h2>Sound file paths</h2>
  <div class="row"><label for="sound-test">Test</label></div>
  <input type="text" id="sound-test" placeholder="/path/to/sound.m4a" />
  <div class="row"><label for="sound-terminal">Terminal (reserved)</label></div>
  <input type="text" id="sound-terminal" placeholder="not available without proposed API" />
  <div class="row"><label for="sound-error">Errors</label></div>
  <input type="text" id="sound-error" />
  <div class="row"><label for="sound-buildFailure">Build failure</label></div>
  <input type="text" id="sound-buildFailure" />
  <div class="row"><label for="sound-buildSuccess">Build success</label></div>
  <input type="text" id="sound-buildSuccess" />

  <div style="margin-top: 16px;">
    <button type="button" id="btn-apply">Save paths</button>
    <button type="button" id="btn-play">Play test sound</button>
    <button type="button" id="btn-settings" class="secondary">Open Settings (UI)</button>
  </div>
  <p class="hint">Use the <strong>VS Sound</strong> item in the status bar (right) to reopen this panel. Paths are saved to your user settings.</p>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    window.addEventListener('message', (event) => {
      const m = event.data;
      if (m.type !== 'state') return;
      document.getElementById('toggle-enabled').checked = !!m.enabled;
      document.getElementById('toggle-diagnostics').checked = !!m.features.diagnostics;
      document.getElementById('toggle-tasks').checked = !!m.features.tasks;
      const s = m.sounds || {};
      ['test','terminal','error','buildFailure','buildSuccess'].forEach((k) => {
        const el = document.getElementById('sound-' + k);
        if (el) el.value = s[k] || '';
      });
    });

    document.getElementById('toggle-enabled').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setEnabled', value: e.target.checked });
    });
    document.getElementById('toggle-diagnostics').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureDiagnostics', value: e.target.checked });
    });
    document.getElementById('toggle-tasks').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureTasks', value: e.target.checked });
    });

    document.getElementById('btn-apply').addEventListener('click', () => {
      const paths = {};
      ['test','terminal','error','buildFailure','buildSuccess'].forEach((k) => {
        paths[k] = document.getElementById('sound-' + k).value;
      });
      vscode.postMessage({ type: 'applyPaths', paths });
    });
    document.getElementById('btn-play').addEventListener('click', () => {
      vscode.postMessage({ type: 'playTest' });
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      vscode.postMessage({ type: 'openSettings' });
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

async function handleMessage(
    message: {
        type: string;
        value?: boolean;
        paths?: Record<string, string>;
    },
    webview: vscode.Webview,
): Promise<void> {
    switch (message.type) {
        case "ready":
            postState(webview);
            break;
        case "playTest":
            runPlayTestSound();
            break;
        case "setEnabled":
            if (typeof message.value === "boolean") {
                await setVsSoundEnabled(message.value);
            }
            break;
        case "setFeatureDiagnostics":
            if (typeof message.value === "boolean") {
                await setFeatureDiagnostics(message.value);
            }
            break;
        case "setFeatureTasks":
            if (typeof message.value === "boolean") {
                await setFeatureTasks(message.value);
            }
            break;
        case "applyPaths":
            if (message.paths && typeof message.paths === "object") {
                await setSoundPaths(message.paths);
                void vscode.window.showInformationMessage("VS Sound paths saved.");
            }
            break;
        case "openSettings":
            await vscode.commands.executeCommand("workbench.action.openSettings", "vssound");
            break;
        default:
            break;
    }
}

export function openDashboard(): void {
    if (dashboardPanel) {
        dashboardPanel.reveal(vscode.ViewColumn.One);
        postState(dashboardPanel.webview);
        return;
    }

    dashboardPanel = vscode.window.createWebviewPanel(
        "vssound.dashboard",
        "VS Sound",
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true },
    );

    dashboardPanel.webview.html = dashboardHtml(dashboardPanel.webview);

    dashboardPanel.webview.onDidReceiveMessage((msg) => {
        void handleMessage(msg, dashboardPanel!.webview);
    });

    dashboardPanel.onDidDispose(() => {
        dashboardPanel = undefined;
    });
}

export function refreshDashboardIfOpen(): void {
    if (dashboardPanel) {
        postState(dashboardPanel.webview);
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
