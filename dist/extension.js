var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/extension.ts
var exports_extension = {};
__export(exports_extension, {
  deactivate: () => deactivate,
  activate: () => activate
});
module.exports = __toCommonJS(exports_extension);
var vscode9 = __toESM(require("vscode"));

// src/events/diagnostics.ts
var vscode3 = __toESM(require("vscode"));

// src/config.ts
var vscode = __toESM(require("vscode"));
var SOUND_KEYS = [
  "terminal",
  "error",
  "buildFailure",
  "buildSuccess",
  "test"
];
function isVsSoundEnabled() {
  return vscode.workspace.getConfiguration("vssound").get("enabled", true);
}
function isFeatureDiagnosticsEnabled() {
  return vscode.workspace.getConfiguration("vssound").get("features.diagnostics", true);
}
function isFeatureTasksEnabled() {
  return vscode.workspace.getConfiguration("vssound").get("features.tasks", true);
}
function getSoundPath(kind) {
  const v = vscode.workspace.getConfiguration("vssound").get(`sounds.${kind}`, "")?.trim();
  return v || undefined;
}
function getDashboardState() {
  const c = vscode.workspace.getConfiguration("vssound");
  const sounds = {};
  for (const k of SOUND_KEYS) {
    sounds[k] = c.get(`sounds.${k}`, "") ?? "";
  }
  return {
    enabled: c.get("enabled", true),
    features: {
      diagnostics: c.get("features.diagnostics", true),
      tasks: c.get("features.tasks", true)
    },
    sounds
  };
}
async function setVsSoundEnabled(value) {
  await vscode.workspace.getConfiguration("vssound").update("enabled", value, vscode.ConfigurationTarget.Global);
}
async function setFeatureDiagnostics(value) {
  await vscode.workspace.getConfiguration("vssound").update("features.diagnostics", value, vscode.ConfigurationTarget.Global);
}
async function setFeatureTasks(value) {
  await vscode.workspace.getConfiguration("vssound").update("features.tasks", value, vscode.ConfigurationTarget.Global);
}
async function setSoundPaths(paths) {
  const c = vscode.workspace.getConfiguration("vssound");
  for (const k of SOUND_KEYS) {
    const v = typeof paths[k] === "string" ? paths[k] : "";
    await c.update(`sounds.${k}`, v, vscode.ConfigurationTarget.Global);
  }
}

// src/audio/playSound.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");

// src/logger.ts
var vscode2 = __toESM(require("vscode"));
var channel;
function registerVsSoundLog(context) {
  channel = vscode2.window.createOutputChannel("VS Sound");
  context.subscriptions.push(channel);
  channel.appendLine('[VS Sound] Logging here. Command Palette → "VS Sound: Play Test Sound" to test.');
  channel.show(true);
}
function logPlaySoundFailure(message) {
  const line = `[VS Sound] ${message}`;
  console.error(line);
  channel?.appendLine(line);
}
function logPlaySoundInfo(message) {
  const line = `[VS Sound] ${message}`;
  console.log(line);
  channel?.appendLine(line);
}
function revealVsSoundLog(preserveFocus) {
  channel?.show(preserveFocus ?? true);
}

// src/audio/playSound.ts
function resolveSoundPath(filePath) {
  const t = filePath.trim();
  if (t.startsWith("~/")) {
    return import_path.resolve(import_os.homedir(), t.slice(2));
  }
  if (t === "~") {
    return import_os.homedir();
  }
  return import_path.resolve(t);
}
function playSound(filePath) {
  if (process.platform !== "darwin") {
    logPlaySoundFailure(`Playback not supported on platform "${process.platform}": ${filePath}`);
    return;
  }
  const resolved = resolveSoundPath(filePath);
  if (!import_fs.existsSync(resolved)) {
    logPlaySoundFailure(`File not found: ${resolved} (from settings: ${filePath})`);
    return;
  }
  logPlaySoundInfo(`Playing: ${resolved}`);
  const child = import_child_process.spawn("afplay", [resolved], {
    stdio: "ignore"
  });
  child.on("error", (err) => {
    logPlaySoundFailure(`afplay failed to start: ${err.message} (${resolved})`);
  });
  child.on("close", (code) => {
    if (code !== 0 && code !== null) {
      logPlaySoundFailure(`afplay exited with code ${code}: ${resolved}`);
    }
  });
}

// src/requestSound.ts
function canPlayKind(kind) {
  if (!isVsSoundEnabled()) {
    return false;
  }
  if (kind === "error" && !isFeatureDiagnosticsEnabled()) {
    return false;
  }
  if ((kind === "buildFailure" || kind === "buildSuccess") && !isFeatureTasksEnabled()) {
    return false;
  }
  return true;
}
function requestSound(kind) {
  if (!canPlayKind(kind)) {
    return;
  }
  const path = getSoundPath(kind);
  if (!path) {
    return;
  }
  playSound(path);
}

// src/events/diagnostics.ts
var DEBOUNCE_MS = 500;
function registerDiagnosticSounds() {
  let timer;
  return vscode3.languages.onDidChangeDiagnostics(() => {
    const tuples = vscode3.languages.getDiagnostics();
    const hasError = tuples.some(([, diags]) => diags.some((d) => d.severity === vscode3.DiagnosticSeverity.Error));
    if (!hasError) {
      return;
    }
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      const again = vscode3.languages.getDiagnostics().some(([, diags]) => diags.some((d) => d.severity === vscode3.DiagnosticSeverity.Error));
      if (again) {
        requestSound("error");
      }
    }, DEBOUNCE_MS);
  });
}

// src/events/notifications.ts
var vscode4 = __toESM(require("vscode"));
function registerNotificationSounds() {
  return new vscode4.Disposable(() => {});
}

// src/events/tasks.ts
var vscode5 = __toESM(require("vscode"));
function registerTaskSounds() {
  return vscode5.tasks.onDidEndTaskProcess((e) => {
    const code = e.exitCode;
    if (code === 0) {
      requestSound("buildSuccess");
    } else if (code !== undefined) {
      requestSound("buildFailure");
    }
  });
}

// src/events/terminal.ts
var vscode6 = __toESM(require("vscode"));
function registerTerminalSounds() {
  logPlaySoundInfo("Terminal output sounds are disabled (no stable VS Code API for terminal stream; proposed API not enabled for this extension).");
  return new vscode6.Disposable(() => {});
}

// src/panel/dashboard.ts
var import_crypto = require("crypto");
var vscode8 = __toESM(require("vscode"));

// src/playTestAction.ts
var vscode7 = __toESM(require("vscode"));
function runPlayTestSound() {
  revealVsSoundLog(true);
  if (!isVsSoundEnabled()) {
    vscode7.window.showWarningMessage("VS Sound is disabled.");
    return;
  }
  const path = getSoundPath("test");
  if (!path) {
    vscode7.window.showWarningMessage('Set a path for "Test" in the VS Sound panel or settings.');
    return;
  }
  logPlaySoundInfo(`Test: "${path}".`);
  requestSound("test");
}

// src/panel/dashboard.ts
var dashboardPanel;
function postState(webview) {
  webview.postMessage({ type: "state", ...getDashboardState() });
}
function dashboardHtml(webview) {
  const nonce = import_crypto.randomBytes(16).toString("base64");
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`
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
async function handleMessage(message, webview) {
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
        vscode8.window.showInformationMessage("VS Sound paths saved.");
      }
      break;
    case "openSettings":
      await vscode8.commands.executeCommand("workbench.action.openSettings", "vssound");
      break;
    default:
      break;
  }
}
function openDashboard() {
  if (dashboardPanel) {
    dashboardPanel.reveal(vscode8.ViewColumn.One);
    postState(dashboardPanel.webview);
    return;
  }
  dashboardPanel = vscode8.window.createWebviewPanel("vssound.dashboard", "VS Sound", vscode8.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
  dashboardPanel.webview.html = dashboardHtml(dashboardPanel.webview);
  dashboardPanel.webview.onDidReceiveMessage((msg) => {
    handleMessage(msg, dashboardPanel.webview);
  });
  dashboardPanel.onDidDispose(() => {
    dashboardPanel = undefined;
  });
}
function refreshDashboardIfOpen() {
  if (dashboardPanel) {
    postState(dashboardPanel.webview);
  }
}
function registerDashboardSideEffects(context) {
  context.subscriptions.push(vscode8.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("vssound")) {
      refreshDashboardIfOpen();
    }
  }));
}

// src/extension.ts
function activate(context) {
  registerVsSoundLog(context);
  logPlaySoundInfo("Activated.");
  const status = vscode9.window.createStatusBarItem(vscode9.StatusBarAlignment.Right, 100);
  status.command = "vssound.openDashboard";
  status.text = "$(bell) VS Sound";
  status.tooltip = "Open VS Sound panel";
  status.show();
  context.subscriptions.push(status);
  registerDashboardSideEffects(context);
  context.subscriptions.push(vscode9.commands.registerCommand("vssound.openDashboard", () => {
    openDashboard();
  }), vscode9.commands.registerCommand("vssound.playTest", () => {
    runPlayTestSound();
  }));
  context.subscriptions.push(registerTerminalSounds(), registerDiagnosticSounds(), registerTaskSounds(), registerNotificationSounds());
}
function deactivate() {}
