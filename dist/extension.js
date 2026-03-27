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
var vscode7 = __toESM(require("vscode"));

// src/events/diagnostics.ts
var vscode3 = __toESM(require("vscode"));

// src/config.ts
var vscode = __toESM(require("vscode"));
function isVsSoundEnabled() {
  return vscode.workspace.getConfiguration("vssound").get("enabled", true);
}
function getSoundPath(kind) {
  const v = vscode.workspace.getConfiguration("vssound").get(`sounds.${kind}`, "")?.trim();
  return v || undefined;
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
function requestSound(kind) {
  if (!isVsSoundEnabled()) {
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

// src/extension.ts
function activate(context) {
  registerVsSoundLog(context);
  logPlaySoundInfo("Activated.");
  context.subscriptions.push(vscode7.commands.registerCommand("vssound.playTest", () => {
    revealVsSoundLog(true);
    if (!isVsSoundEnabled()) {
      vscode7.window.showWarningMessage("VS Sound is disabled in settings.");
      return;
    }
    const path = getSoundPath("test");
    if (!path) {
      vscode7.window.showWarningMessage("Set vssound.sounds.test to an audio file path in settings.");
      return;
    }
    logPlaySoundInfo(`Test command: path from settings is "${path}".`);
    requestSound("test");
  }));
  context.subscriptions.push(registerTerminalSounds(), registerDiagnosticSounds(), registerTaskSounds(), registerNotificationSounds());
}
function deactivate() {}
