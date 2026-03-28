var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __toCommonJS = (from) => {
  var entry = (__moduleCache ??= new WeakMap).get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function") {
    for (var key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(entry, key))
        __defProp(entry, key, {
          get: __accessProp.bind(from, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
  }
  __moduleCache.set(from, entry);
  return entry;
};
var __moduleCache;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
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

// src/logger.ts
var vscode = __toESM(require("vscode"));
var channel;
function registerVsSoundLog(context) {
  channel = vscode.window.createOutputChannel("VS Sound");
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

// src/listeners/diagnostics.ts
var vscode4 = __toESM(require("vscode"));

// src/config.ts
var vscode2 = __toESM(require("vscode"));

// src/sounds/catalog.ts
var SOUND_SLOTS = [
  { kind: "test", label: "Test", placeholder: "Path or Choose file…" },
  {
    kind: "terminal",
    label: "Terminal (reserved)",
    placeholder: "No terminal stream API yet"
  },
  { kind: "error", label: "Errors", placeholder: "Path or Choose file…" },
  { kind: "buildFailure", label: "Build failure", placeholder: "Path or Choose file…" },
  { kind: "buildSuccess", label: "Build success", placeholder: "Path or Choose file…" }
];
var SOUND_KINDS = SOUND_SLOTS.map((s) => s.kind);
var AUDIO_FILE_DIALOG_FILTERS = {
  Audio: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "aiff", "caf", "opus"]
};

// src/config.ts
function isVsSoundEnabled() {
  return vscode2.workspace.getConfiguration("vssound").get("enabled", true);
}
function isFeatureDiagnosticsEnabled() {
  return vscode2.workspace.getConfiguration("vssound").get("features.diagnostics", true);
}
function isFeatureTasksEnabled() {
  return vscode2.workspace.getConfiguration("vssound").get("features.tasks", true);
}
function isDiagnosticsEdgeTriggerOnly() {
  return vscode2.workspace.getConfiguration("vssound").get("diagnostics.edgeTriggerOnly", true) ?? true;
}
function getVolumePercent() {
  const c = vscode2.workspace.getConfiguration("vssound");
  const v = c.get("volumePercent", 100) ?? 100;
  return Math.max(0, Math.min(100, Math.round(v)));
}
function getCooldownMsForKind(kind) {
  const c = vscode2.workspace.getConfiguration("vssound");
  switch (kind) {
    case "error":
      return Math.max(0, c.get("cooldown.errorMs", 2000) ?? 0);
    case "buildSuccess":
      return Math.max(0, c.get("cooldown.buildSuccessMs", 1000) ?? 0);
    case "buildFailure":
      return Math.max(0, c.get("cooldown.buildFailureMs", 1000) ?? 0);
    case "terminal":
      return Math.max(0, c.get("cooldown.terminalMs", 2000) ?? 0);
    default:
      return 0;
  }
}
function readCooldownMs() {
  const c = vscode2.workspace.getConfiguration("vssound");
  return {
    errorMs: Math.max(0, c.get("cooldown.errorMs", 2000) ?? 0),
    buildSuccessMs: Math.max(0, c.get("cooldown.buildSuccessMs", 1000) ?? 0),
    buildFailureMs: Math.max(0, c.get("cooldown.buildFailureMs", 1000) ?? 0),
    terminalMs: Math.max(0, c.get("cooldown.terminalMs", 2000) ?? 0)
  };
}
function getSoundPath(kind) {
  const v = vscode2.workspace.getConfiguration("vssound").get(`sounds.${kind}`, "")?.trim();
  return v || undefined;
}
function getDashboardState() {
  const c = vscode2.workspace.getConfiguration("vssound");
  const sounds = {};
  for (const k of SOUND_KINDS) {
    sounds[k] = c.get(`sounds.${k}`, "") ?? "";
  }
  return {
    enabled: c.get("enabled", true),
    features: {
      diagnostics: c.get("features.diagnostics", true),
      tasks: c.get("features.tasks", true)
    },
    diagnosticsEdgeOnly: c.get("diagnostics.edgeTriggerOnly", true) ?? true,
    volumePercent: getVolumePercent(),
    sounds,
    cooldown: readCooldownMs()
  };
}
async function setVsSoundEnabled(value) {
  await vscode2.workspace.getConfiguration("vssound").update("enabled", value, vscode2.ConfigurationTarget.Global);
}
async function setFeatureDiagnostics(value) {
  await vscode2.workspace.getConfiguration("vssound").update("features.diagnostics", value, vscode2.ConfigurationTarget.Global);
}
async function setFeatureTasks(value) {
  await vscode2.workspace.getConfiguration("vssound").update("features.tasks", value, vscode2.ConfigurationTarget.Global);
}
async function setDiagnosticsEdgeTriggerOnly(value) {
  await vscode2.workspace.getConfiguration("vssound").update("diagnostics.edgeTriggerOnly", value, vscode2.ConfigurationTarget.Global);
}
async function setVolumePercent(value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  await vscode2.workspace.getConfiguration("vssound").update("volumePercent", v, vscode2.ConfigurationTarget.Global);
}
async function setSoundPaths(paths) {
  const c = vscode2.workspace.getConfiguration("vssound");
  for (const k of SOUND_KINDS) {
    const v = typeof paths[k] === "string" ? paths[k] : "";
    await c.update(`sounds.${k}`, v, vscode2.ConfigurationTarget.Global);
  }
}
async function setSoundPath(kind, value) {
  await vscode2.workspace.getConfiguration("vssound").update(`sounds.${kind}`, value, vscode2.ConfigurationTarget.Global);
}
async function setCooldownMs(values) {
  const cfg = vscode2.workspace.getConfiguration("vssound");
  const entries = [
    ["errorMs", "cooldown.errorMs"],
    ["buildSuccessMs", "cooldown.buildSuccessMs"],
    ["buildFailureMs", "cooldown.buildFailureMs"],
    ["terminalMs", "cooldown.terminalMs"]
  ];
  for (const [key, configKey] of entries) {
    const v = values[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      await cfg.update(configKey, Math.max(0, Math.floor(v)), vscode2.ConfigurationTarget.Global);
    }
  }
}

// src/sounds/play.ts
var vscode3 = __toESM(require("vscode"));

// src/audio/playSound.ts
var import_child_process = require("child_process");
var import_buffer = require("buffer");
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");
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
function whichExecutable(name) {
  if (process.platform === "win32") {
    const r2 = import_child_process.spawnSync("where.exe", [name], { encoding: "utf8", windowsHide: true });
    if (r2.status !== 0 || !r2.stdout) {
      return;
    }
    const line = r2.stdout.trim().split(/\r?\n/)[0];
    return line?.trim() || undefined;
  }
  const r = import_child_process.spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) {
    return;
  }
  return r.stdout.trim().split(/\r?\n/)[0] || undefined;
}
function runSpawn(label, command, args, options = {}) {
  logPlaySoundInfo(`Playing via ${label}`);
  const child = import_child_process.spawn(command, args, {
    stdio: "ignore",
    windowsHide: options.windowsHide ?? process.platform === "win32",
    env: options.env
  });
  child.on("error", (err) => {
    logPlaySoundFailure(`${label} failed to start: ${err.message}`);
  });
  child.on("close", (code) => {
    if (code !== 0 && code !== null) {
      logPlaySoundFailure(`${label} exited with code ${code}`);
    }
  });
}
function playDarwin(resolved, volumePercent) {
  const v = Math.max(1, Math.min(255, Math.round(volumePercent / 100 * 255)));
  runSpawn("afplay", "afplay", ["-v", String(v), resolved]);
  return true;
}
function playWindowsSoundPlayer(resolved) {
  const ext = import_path.extname(resolved).toLowerCase();
  if (ext !== ".wav") {
    return false;
  }
  runSpawn("PowerShell SoundPlayer", "powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "(New-Object System.Media.SoundPlayer($env:VSSOUND_PATH)).PlaySync(); exit 0"
  ], { env: { ...process.env, VSSOUND_PATH: resolved } });
  return true;
}
function playWindowsMci(resolved, volumePercent) {
  const script = [
    "$ProgressPreference = 'SilentlyContinue'",
    "$ErrorActionPreference = 'Stop'",
    "Add-Type @'",
    "using System;",
    "using System.Runtime.InteropServices;",
    "using System.Text;",
    "public class VssMci {",
    '  [DllImport("winmm.dll", CharSet = CharSet.Unicode)]',
    "  public static extern int mciSendString(string s, StringBuilder r, int n, IntPtr h);",
    "}",
    "'@",
    "$p = $env:VSSOUND_PATH",
    "if (-not (Test-Path -LiteralPath $p)) { Write-Error 'File not found'; exit 2 }",
    "$alias = 'VSS' + [guid]::NewGuid().ToString('N')",
    "$ext = [IO.Path]::GetExtension($p).ToLowerInvariant()",
    "$mciType = if ($ext -eq '.wav') { 'waveaudio' } else { 'mpegvideo' }",
    "function VssSend([string]$cmd) {",
    "  $sb = New-Object System.Text.StringBuilder 512",
    "  $e = [VssMci]::mciSendString($cmd, $sb, $sb.Capacity, [IntPtr]::Zero)",
    "  if ($e -ne 0) { Write-Error ('MCI error {0}: {1}' -f $e, $sb.ToString()); exit 1 }",
    "}",
    "$dq = [string][char]34",
    "$inner = $p.Replace($dq, ([string][char]92 + $dq))",
    "$quoted = $dq + $inner + $dq",
    "VssSend ('open ' + $quoted + ' type ' + $mciType + ' alias ' + $alias)",
    "$vp = [int]$env:VSSOUND_VOL",
    "$vm = [Math]::Min(1000, [Math]::Max(0, $vp * 10))",
    "VssSend ('setaudio ' + $alias + ' volume to ' + $vm)",
    "VssSend ('play ' + $alias + ' wait')",
    "VssSend ('close ' + $alias)"
  ].join(`
`);
  const encoded = import_buffer.Buffer.from(script, "utf16le").toString("base64");
  logPlaySoundInfo("Playing via Windows MCI (winmm)");
  const child = import_child_process.spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
    env: { ...process.env, VSSOUND_PATH: resolved, VSSOUND_VOL: String(volumePercent) }
  });
  let errBuf = "";
  child.stderr?.on("data", (d) => {
    errBuf += String(d);
  });
  child.on("error", (err) => {
    logPlaySoundFailure(`MCI PowerShell failed to start: ${err.message}`);
  });
  child.on("close", (code) => {
    if (code !== 0 && code !== null) {
      logPlaySoundFailure(`MCI playback failed (exit ${code}): ${errBuf.trim() || "see Output"}`);
    }
  });
}
function playFfplay(resolved, volumePercent) {
  const bin = whichExecutable("ffplay");
  if (!bin) {
    return false;
  }
  runSpawn("ffplay", bin, [
    "-nodisp",
    "-autoexit",
    "-loglevel",
    "quiet",
    "-volume",
    String(volumePercent),
    resolved
  ]);
  return true;
}
function playMpv(resolved, volumePercent) {
  const bin = whichExecutable("mpv");
  if (!bin) {
    return false;
  }
  runSpawn("mpv", bin, [`--volume=${volumePercent}`, "--no-video", "--really-quiet", "--no-terminal", resolved]);
  return true;
}
function playLinuxPulseOrAlsa(resolved) {
  const ext = import_path.extname(resolved).toLowerCase();
  if (ext !== ".wav") {
    return false;
  }
  const paplay = whichExecutable("paplay");
  if (paplay) {
    runSpawn("paplay", paplay, [resolved]);
    return true;
  }
  const aplay = whichExecutable("aplay");
  if (aplay) {
    runSpawn("aplay", aplay, [resolved]);
    return true;
  }
  return false;
}
function playLinuxLike(resolved, volumePercent) {
  if (playFfplay(resolved, volumePercent)) {
    return;
  }
  if (playMpv(resolved, volumePercent)) {
    return;
  }
  if (playLinuxPulseOrAlsa(resolved)) {
    if (volumePercent < 100) {
      logPlaySoundInfo("Volume slider does not apply to paplay/aplay; install ffplay or mpv for volume control.");
    }
    return;
  }
  logPlaySoundFailure(`No player found for "${resolved}". Install ffmpeg (ffplay) or mpv, or use a .wav with paplay/aplay.`);
}
function playSound(filePath) {
  const volumePercent = getVolumePercent();
  if (volumePercent <= 0) {
    logPlaySoundInfo("Volume is 0% — skipping playback.");
    return;
  }
  const resolved = resolveSoundPath(filePath);
  if (!import_fs.existsSync(resolved)) {
    logPlaySoundFailure(`File not found: ${resolved} (from settings: ${filePath})`);
    return;
  }
  const platform = process.platform;
  if (platform === "darwin") {
    playDarwin(resolved, volumePercent);
    return;
  }
  if (platform === "win32") {
    if (playFfplay(resolved, volumePercent) || playMpv(resolved, volumePercent)) {
      return;
    }
    if (playWindowsSoundPlayer(resolved)) {
      if (volumePercent < 100) {
        logPlaySoundInfo("Volume setting not applied for PowerShell SoundPlayer (.wav only).");
      }
      return;
    }
    playWindowsMci(resolved, volumePercent);
    return;
  }
  if (platform === "linux") {
    playLinuxLike(resolved, volumePercent);
    return;
  }
  if (playFfplay(resolved, volumePercent) || playMpv(resolved, volumePercent)) {
    return;
  }
  logPlaySoundFailure(`Playback on "${platform}" needs ffplay or mpv on PATH. File: ${resolved}`);
}

// src/sounds/play.ts
var lastEventPlayAt = {};
var EVENT_LABEL = {
  error: "diagnostic error",
  buildSuccess: "task / build success",
  buildFailure: "task / build failure",
  terminal: "terminal",
  test: "test (command)"
};
function allowEventPlayback(kind) {
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
  if (!allowEventPlayback(kind)) {
    return;
  }
  const path = getSoundPath(kind);
  if (!path) {
    return;
  }
  const cooldownMs = getCooldownMsForKind(kind);
  const label = EVENT_LABEL[kind];
  if (cooldownMs > 0) {
    const last = lastEventPlayAt[kind];
    if (last !== undefined) {
      const elapsed = Date.now() - last;
      if (elapsed < cooldownMs) {
        const remaining = cooldownMs - elapsed;
        logPlaySoundInfo(`Event skipped (${label}, kind=${kind}): cooldown is ${cooldownMs}ms — ${remaining}ms left (${elapsed}ms since last play).`);
        return;
      }
    }
  }
  const cooldownDesc = cooldownMs > 0 ? `${cooldownMs}ms` : "off (0ms)";
  logPlaySoundInfo(`Event play (${label}, kind=${kind}): cooldown setting ${cooldownDesc}. File: "${path}"`);
  playSound(path);
  if (cooldownMs > 0) {
    lastEventPlayAt[kind] = Date.now();
  }
}
function previewSound(kind) {
  revealVsSoundLog(true);
  if (!isVsSoundEnabled()) {
    vscode3.window.showWarningMessage("VS Sound is disabled. Turn it on in the panel to use Preview.");
    return;
  }
  if (kind === "error" && !isFeatureDiagnosticsEnabled()) {
    vscode3.window.showWarningMessage('Diagnostic sounds are off. Enable "Sounds on errors (diagnostics)" to preview this sound.');
    return;
  }
  if ((kind === "buildFailure" || kind === "buildSuccess") && !isFeatureTasksEnabled()) {
    vscode3.window.showWarningMessage('Task sounds are off. Enable "Sounds on task finish" to preview this sound.');
    return;
  }
  const path = getSoundPath(kind);
  if (!path) {
    vscode3.window.showWarningMessage(`Set a path for "${kind}" in VS Sound or settings.`);
    return;
  }
  logPlaySoundInfo(`Preview (${kind}): "${path}".`);
  playSound(path);
}
function runPlayTestCommand() {
  revealVsSoundLog(true);
  if (!isVsSoundEnabled()) {
    vscode3.window.showWarningMessage("VS Sound is disabled.");
    return;
  }
  const path = getSoundPath("test");
  if (!path) {
    vscode3.window.showWarningMessage('Set a path for "Test" in VS Sound or settings.');
    return;
  }
  logPlaySoundInfo(`Test: "${path}".`);
  requestSound("test");
}

// src/listeners/diagnostics.ts
var DEBOUNCE_MS = 500;
var CLEAR_SUPPRESS_MS = 600;
function isTrackedDocument(uri) {
  if (uri.scheme === "file") {
    return vscode4.workspace.getWorkspaceFolder(uri) !== undefined;
  }
  if (uri.scheme === "untitled") {
    const folders = vscode4.workspace.workspaceFolders;
    return folders !== undefined && folders.length > 0;
  }
  return false;
}
function uriHasErrors(uri) {
  const diags = vscode4.languages.getDiagnostics(uri);
  return diags.some((d) => d.severity === vscode4.DiagnosticSeverity.Error);
}
function activeEditorHasErrors() {
  const editor = vscode4.window.activeTextEditor;
  if (!editor || editor.document.isClosed) {
    return false;
  }
  const uri = editor.document.uri;
  if (!isTrackedDocument(uri)) {
    return false;
  }
  return uriHasErrors(uri);
}
function parseTrackedUri(uriKey) {
  try {
    const u = vscode4.Uri.parse(uriKey);
    return isTrackedDocument(u) ? u : undefined;
  } catch {
    return;
  }
}
function registerDiagnosticSounds() {
  let debounceTimer;
  let lastActiveUriKey;
  let hadErrorsOnActive = false;
  const tabBackSuppress = new Set;
  const pendingClearSuppress = new Map;
  const cancelPendingClearSuppress = (uriKey) => {
    const t = pendingClearSuppress.get(uriKey);
    if (t !== undefined) {
      clearTimeout(t);
      pendingClearSuppress.delete(uriKey);
    }
  };
  const scheduleClearSuppressIfStillClean = (uri) => {
    const uriKey = uri.toString();
    cancelPendingClearSuppress(uriKey);
    pendingClearSuppress.set(uriKey, setTimeout(() => {
      pendingClearSuppress.delete(uriKey);
      if (!isTrackedDocument(uri)) {
        return;
      }
      if (!uriHasErrors(uri)) {
        tabBackSuppress.delete(uriKey);
      }
    }, CLEAR_SUPPRESS_MS));
  };
  const onDiagnosticUrisChanged = (uris) => {
    for (const uri of uris) {
      if (!isTrackedDocument(uri)) {
        continue;
      }
      const key = uri.toString();
      if (uriHasErrors(uri)) {
        cancelPendingClearSuppress(key);
      } else {
        scheduleClearSuppressIfStillClean(uri);
      }
    }
  };
  const noteLeavingDocument = (leftKey) => {
    if (leftKey === undefined) {
      return;
    }
    const u = parseTrackedUri(leftKey);
    if (u === undefined) {
      return;
    }
    if (uriHasErrors(u)) {
      tabBackSuppress.add(leftKey);
    } else {
      tabBackSuppress.delete(leftKey);
    }
  };
  const runCheck = () => {
    const editor = vscode4.window.activeTextEditor;
    if (!editor || editor.document.isClosed) {
      noteLeavingDocument(lastActiveUriKey);
      lastActiveUriKey = undefined;
      hadErrorsOnActive = false;
      return;
    }
    const uriKey = editor.document.uri.toString();
    const prevKey = lastActiveUriKey;
    const focusChanged = prevKey !== uriKey;
    if (focusChanged) {
      noteLeavingDocument(prevKey);
    }
    lastActiveUriKey = uriKey;
    const nowHasErrors = activeEditorHasErrors();
    const edgeOnly = isDiagnosticsEdgeTriggerOnly();
    if (!edgeOnly) {
      if (nowHasErrors) {
        requestSound("error");
      }
      hadErrorsOnActive = nowHasErrors;
      return;
    }
    if (focusChanged) {
      if (nowHasErrors && !tabBackSuppress.has(uriKey)) {
        requestSound("error");
      }
      hadErrorsOnActive = nowHasErrors;
      return;
    }
    if (nowHasErrors && !hadErrorsOnActive && !tabBackSuppress.has(uriKey)) {
      requestSound("error");
    }
    hadErrorsOnActive = nowHasErrors;
  };
  const scheduleDebouncedCheck = () => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      runCheck();
    }, DEBOUNCE_MS);
  };
  const onDiagnostics = vscode4.languages.onDidChangeDiagnostics((e) => {
    onDiagnosticUrisChanged(e.uris);
    scheduleDebouncedCheck();
  });
  const onActiveEditor = vscode4.window.onDidChangeActiveTextEditor(() => {
    runCheck();
  });
  queueMicrotask(() => {
    runCheck();
  });
  return vscode4.Disposable.from(onDiagnostics, onActiveEditor, new vscode4.Disposable(() => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    for (const t of pendingClearSuppress.values()) {
      clearTimeout(t);
    }
    pendingClearSuppress.clear();
  }));
}

// src/listeners/tasks.ts
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

// src/listeners/stubs.ts
var vscode6 = __toESM(require("vscode"));
function registerUnsupportedFeatureStubs() {
  logPlaySoundInfo("Terminal stream sounds are not available (no stable VS Code API). Notification toasts have no public hook.");
  return new vscode6.Disposable(() => {});
}

// src/ui/dashboard/panel.ts
var vscode8 = __toESM(require("vscode"));

// src/ui/dashboard/html.ts
var import_crypto = require("crypto");
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function soundBlocksHtml() {
  return SOUND_SLOTS.map((s) => `
  <div class="sound-block">
    <label for="sound-${s.kind}">${escapeHtml(s.label)}</label>
    <div class="path-row">
      <input type="text" id="sound-${s.kind}" placeholder="${escapeHtml(s.placeholder)}" data-kind="${s.kind}" />
      <div class="row-actions">
        <button type="button" class="small pick-sound" data-kind="${s.kind}">Choose file…</button>
        <button type="button" class="small preview-sound" data-kind="${s.kind}">Preview</button>
      </div>
    </div>
  </div>`).join("");
}
function buildDashboardHtml(webview) {
  const nonce = import_crypto.randomBytes(16).toString("base64");
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`
  ].join("; ");
  const soundKeysJson = JSON.stringify(SOUND_KINDS);
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
      max-width: 640px;
    }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 16px; }
    h2 { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; margin: 20px 0 10px; }
    .row { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
    label { cursor: pointer; }
    .feature-row label { flex: 1; }
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
      white-space: nowrap;
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.small {
      padding: 6px 10px;
      margin: 0;
      font-size: 0.9em;
    }
    button:hover { opacity: 0.92; }
    .hint { font-size: 0.85rem; opacity: 0.75; margin-top: 12px; }
    .sound-block { margin: 12px 0; }
    .sound-block > label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .path-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .path-row input[type="text"] {
      flex: 1;
      min-width: 0;
    }
    .path-row .row-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    input[type="number"].cd-ms {
      width: 6.5rem;
      flex-shrink: 0;
    }
    .cooldown-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 8px 0;
    }
    .cooldown-row label { flex: 1; cursor: default; }
  </style>
</head>
<body>
  <h1>VS Sound</h1>

  <div class="row feature-row">
    <input type="checkbox" id="toggle-enabled" />
    <label for="toggle-enabled">Enable VS Sound</label>
  </div>

  <h2>Features</h2>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-diagnostics" />
    <label for="toggle-diagnostics">Sounds on errors (diagnostics)</label>
  </div>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-tasks" />
    <label for="toggle-tasks">Sounds on task finish (build success / failure)</label>
  </div>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-edge-diagnostics" />
    <label for="toggle-edge-diagnostics">Error sounds only when errors appear (edge mode)</label>
  </div>
  <p class="hint" style="margin: 4px 0 0 28px;">When on: play once when the active file gains errors, or when you switch to a file that already has errors — not on every diagnostic refresh while errors stay.</p>

  <h2>Playback</h2>
  <div class="cooldown-row">
    <label for="volume-percent">Volume (0–100%)</label>
    <input type="number" class="cd-ms" id="volume-percent" min="0" max="100" step="1" />
  </div>
  <p class="hint" style="margin-top: 4px;"><strong>0%</strong> skips playback. Affects <code>afplay</code>, <code>ffplay</code>, <code>mpv</code>, and Windows MCI. PowerShell WAV and <code>paplay</code>/<code>aplay</code> may ignore volume.</p>
  <button type="button" id="btn-save-volume" class="small" style="margin-top: 4px;">Save volume</button>

  <h2>Event cooldowns (ms)</h2>
  <p class="hint" style="margin-top: 0;">Minimum time between <em>automatic</em> plays per trigger. Use <strong>0</strong> for no limit. Does not apply to Preview or Play test sound.</p>
  <div class="cooldown-row">
    <label for="cd-errorMs">Diagnostic errors</label>
    <input type="number" class="cd-ms" id="cd-errorMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-buildSuccessMs">Task / build success</label>
    <input type="number" class="cd-ms" id="cd-buildSuccessMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-buildFailureMs">Task / build failure</label>
    <input type="number" class="cd-ms" id="cd-buildFailureMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-terminalMs">Terminal (reserved)</label>
    <input type="number" class="cd-ms" id="cd-terminalMs" min="0" step="100" />
  </div>
  <button type="button" id="btn-save-cooldowns" class="small" style="margin-top: 4px;">Save cooldowns</button>

  <h2>Sound files</h2>
  <p class="hint" style="margin-top: 0;"><strong>Choose file</strong> opens the system file picker (same on every OS) and stores the real path in settings. Preview respects master switch and feature toggles.</p>
${soundBlocksHtml()}

  <div style="margin-top: 16px;">
    <button type="button" id="btn-apply">Save paths</button>
    <button type="button" id="btn-play">Play test sound</button>
    <button type="button" id="btn-settings" class="secondary">Open Settings (UI)</button>
  </div>
  <p class="hint">Reopen this panel from the status bar. Players: macOS <code>afplay</code>; Windows <code>ffplay</code>/<code>mpv</code> or MCI / PowerShell WAV; Linux <code>ffplay</code>/<code>mpv</code> or <code>paplay</code>/<code>aplay</code>. Use <strong>Playback</strong> above for volume where supported.</p>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const SOUND_KEYS = ${soundKeysJson};

    window.addEventListener('message', (event) => {
      const m = event.data;
      if (m.type !== 'state') return;
      document.getElementById('toggle-enabled').checked = !!m.enabled;
      document.getElementById('toggle-diagnostics').checked = !!m.features.diagnostics;
      document.getElementById('toggle-tasks').checked = !!m.features.tasks;
      const edgeEl = document.getElementById('toggle-edge-diagnostics');
      if (edgeEl) edgeEl.checked = m.diagnosticsEdgeOnly !== false;
      const volEl = document.getElementById('volume-percent');
      if (volEl) volEl.value = String(typeof m.volumePercent === 'number' ? m.volumePercent : 100);
      const s = m.sounds || {};
      SOUND_KEYS.forEach((k) => {
        const el = document.getElementById('sound-' + k);
        if (el) el.value = s[k] || '';
      });
      const cd = m.cooldown;
      if (cd) {
        document.getElementById('cd-errorMs').value = String(cd.errorMs);
        document.getElementById('cd-buildSuccessMs').value = String(cd.buildSuccessMs);
        document.getElementById('cd-buildFailureMs').value = String(cd.buildFailureMs);
        document.getElementById('cd-terminalMs').value = String(cd.terminalMs);
      }
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
    document.getElementById('toggle-edge-diagnostics').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setDiagnosticsEdgeOnly', value: e.target.checked });
    });

    document.getElementById('btn-save-volume').addEventListener('click', () => {
      const n = parseInt(document.getElementById('volume-percent').value, 10);
      const v = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 100;
      vscode.postMessage({ type: 'applyVolume', volumePercent: v });
    });

    document.querySelectorAll('.pick-sound').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-kind');
        if (kind) vscode.postMessage({ type: 'pickSound', kind });
      });
    });
    document.querySelectorAll('.preview-sound').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-kind');
        if (kind) vscode.postMessage({ type: 'playPreview', kind });
      });
    });

    function readCooldownMs(id) {
      const n = parseInt(document.getElementById(id).value, 10);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    document.getElementById('btn-save-cooldowns').addEventListener('click', () => {
      vscode.postMessage({
        type: 'applyCooldowns',
        cooldown: {
          errorMs: readCooldownMs('cd-errorMs'),
          buildSuccessMs: readCooldownMs('cd-buildSuccessMs'),
          buildFailureMs: readCooldownMs('cd-buildFailureMs'),
          terminalMs: readCooldownMs('cd-terminalMs'),
        },
      });
    });

    document.getElementById('btn-apply').addEventListener('click', () => {
      const paths = {};
      SOUND_KEYS.forEach((k) => {
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

// src/ui/dashboard/messages.ts
var vscode7 = __toESM(require("vscode"));
function postDashboardState(webview) {
  webview.postMessage({ type: "state", ...getDashboardState() });
}
function asSoundKind(value) {
  if (typeof value !== "string") {
    return;
  }
  return SOUND_KINDS.includes(value) ? value : undefined;
}
async function pickAudioFileForKind(kind, webview) {
  const uris = await vscode7.window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Select audio file",
    filters: AUDIO_FILE_DIALOG_FILTERS
  });
  if (!uris?.[0]) {
    return;
  }
  await setSoundPath(kind, uris[0].fsPath);
  postDashboardState(webview);
  vscode7.window.showInformationMessage(`VS Sound: path set for ${kind}.`);
}
function parseCooldownPayload(raw) {
  if (!raw || typeof raw !== "object") {
    return;
  }
  const o = raw;
  const out = {};
  for (const key of ["errorMs", "buildSuccessMs", "buildFailureMs", "terminalMs"]) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
async function handleDashboardMessage(message, webview) {
  switch (message.type) {
    case "ready":
      postDashboardState(webview);
      break;
    case "playTest":
      runPlayTestCommand();
      break;
    case "playPreview": {
      const k = asSoundKind(message.kind);
      if (k) {
        previewSound(k);
      }
      break;
    }
    case "pickSound": {
      const k = asSoundKind(message.kind);
      if (k) {
        await pickAudioFileForKind(k, webview);
      }
      break;
    }
    case "setEnabled":
      if (typeof message.value === "boolean") {
        await setVsSoundEnabled(message.value);
        vscode7.window.showInformationMessage(message.value ? "VS Sound is enabled." : "VS Sound is disabled.");
      }
      break;
    case "setFeatureDiagnostics":
      if (typeof message.value === "boolean") {
        await setFeatureDiagnostics(message.value);
        vscode7.window.showInformationMessage(message.value ? "VS Sound: sounds on diagnostic errors are enabled." : "VS Sound: sounds on diagnostic errors are disabled.");
      }
      break;
    case "setFeatureTasks":
      if (typeof message.value === "boolean") {
        await setFeatureTasks(message.value);
        vscode7.window.showInformationMessage(message.value ? "VS Sound: sounds on task finish (success/failure) are enabled." : "VS Sound: sounds on task finish (success/failure) are disabled.");
      }
      break;
    case "setDiagnosticsEdgeOnly":
      if (typeof message.value === "boolean") {
        await setDiagnosticsEdgeTriggerOnly(message.value);
        vscode7.window.showInformationMessage(message.value ? "VS Sound: error sounds only when errors appear (edge mode) — on." : "VS Sound: error sounds on every diagnostic pass while errors exist — edge mode off.");
      }
      break;
    case "applyVolume":
      if (typeof message.volumePercent === "number" && Number.isFinite(message.volumePercent)) {
        await setVolumePercent(message.volumePercent);
        vscode7.window.showInformationMessage(`VS Sound: volume set to ${Math.max(0, Math.min(100, Math.round(message.volumePercent)))}%.`);
      }
      break;
    case "applyPaths":
      if (message.paths && typeof message.paths === "object") {
        await setSoundPaths(message.paths);
        vscode7.window.showInformationMessage("VS Sound paths saved.");
      }
      break;
    case "applyCooldowns": {
      const c = parseCooldownPayload(message.cooldown);
      if (c) {
        await setCooldownMs(c);
        vscode7.window.showInformationMessage("VS Sound cooldowns saved.");
      }
      break;
    }
    case "openSettings":
      await vscode7.commands.executeCommand("workbench.action.openSettings", "vssound");
      break;
    default:
      break;
  }
}

// src/ui/dashboard/panel.ts
var panel;
function openDashboard() {
  if (panel) {
    panel.reveal(vscode8.ViewColumn.One);
    postDashboardState(panel.webview);
    return;
  }
  panel = vscode8.window.createWebviewPanel("vssound.dashboard", "VS Sound", vscode8.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
  panel.webview.html = buildDashboardHtml(panel.webview);
  panel.webview.onDidReceiveMessage((msg) => {
    handleDashboardMessage(msg, panel.webview);
  });
  panel.onDidDispose(() => {
    panel = undefined;
  });
}
function refreshDashboardIfOpen() {
  if (panel) {
    postDashboardState(panel.webview);
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
    runPlayTestCommand();
  }));
  context.subscriptions.push(registerUnsupportedFeatureStubs(), registerDiagnosticSounds(), registerTaskSounds());
}
function deactivate() {}
