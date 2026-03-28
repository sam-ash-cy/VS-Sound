/**
 * Inline HTML/CSS/JS string for the webview: CSP with per-load nonce, feature toggles, sound rows from catalog.
 * Script posts messages typed in `messages.ts` (`ready`, `setEnabled`, …).
 */
import { randomBytes } from "crypto";
import * as vscode from "vscode";
import { SOUND_KINDS, SOUND_SLOTS } from "../../sounds/catalog";

/** Prevent breaking attribute/text injection when embedding labels in static HTML. */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** One path row per `SOUND_SLOTS` entry (inputs use `data-kind` for message routing). */
function soundBlocksHtml(): string {
    return SOUND_SLOTS.map(
        (s) => `
  <div class="sound-block">
    <label for="sound-${s.kind}">${escapeHtml(s.label)}</label>
    <div class="path-row">
      <input type="text" id="sound-${s.kind}" placeholder="${escapeHtml(s.placeholder)}" data-kind="${s.kind}" />
      <div class="row-actions">
        <button type="button" class="small pick-sound" data-kind="${s.kind}">Choose file…</button>
        <button type="button" class="small preview-sound" data-kind="${s.kind}">Preview</button>
      </div>
    </div>
  </div>`,
    ).join("");
}

/** Full document string assigned to `WebviewPanel.webview.html`. */
export function buildDashboardHtml(webview: vscode.Webview): string {
    const nonce = randomBytes(16).toString("base64");
    const csp = [
        "default-src 'none'",
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        "img-src 'none'",
        "font-src 'none'",
        `script-src 'nonce-${nonce}'`,
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
    <input type="checkbox" id="toggle-save" />
    <label for="toggle-save">Sounds on save (active workspace file)</label>
  </div>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-debug" />
    <label for="toggle-debug">Sounds on debug session start / end</label>
  </div>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-terminal" />
    <label for="toggle-terminal">Sounds on terminal open / shell exit</label>
  </div>
  <div class="row feature-row">
    <input type="checkbox" id="toggle-git" />
    <label for="toggle-git">Sounds on Git (HEAD, fetch, merge start)</label>
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
    <label for="cd-terminalMs">Terminal open / exit</label>
    <input type="number" class="cd-ms" id="cd-terminalMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-saveMs">Save</label>
    <input type="number" class="cd-ms" id="cd-saveMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-debugMs">Debug start / end</label>
    <input type="number" class="cd-ms" id="cd-debugMs" min="0" step="100" />
  </div>
  <div class="cooldown-row">
    <label for="cd-gitMs">Git events</label>
    <input type="number" class="cd-ms" id="cd-gitMs" min="0" step="100" />
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
      const saveEl = document.getElementById('toggle-save');
      if (saveEl) saveEl.checked = !!m.features.save;
      const debugEl = document.getElementById('toggle-debug');
      if (debugEl) debugEl.checked = !!m.features.debug;
      const termEl = document.getElementById('toggle-terminal');
      if (termEl) termEl.checked = !!m.features.terminal;
      const gitEl = document.getElementById('toggle-git');
      if (gitEl) gitEl.checked = !!m.features.git;
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
        const saveCd = document.getElementById('cd-saveMs');
        if (saveCd) saveCd.value = String(cd.saveMs);
        const debugCd = document.getElementById('cd-debugMs');
        if (debugCd) debugCd.value = String(cd.debugMs);
        const gitCd = document.getElementById('cd-gitMs');
        if (gitCd) gitCd.value = String(cd.gitMs);
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
    document.getElementById('toggle-save').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureSave', value: e.target.checked });
    });
    document.getElementById('toggle-debug').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureDebug', value: e.target.checked });
    });
    document.getElementById('toggle-terminal').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureTerminal', value: e.target.checked });
    });
    document.getElementById('toggle-git').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'setFeatureGit', value: e.target.checked });
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
          saveMs: readCooldownMs('cd-saveMs'),
          debugMs: readCooldownMs('cd-debugMs'),
          gitMs: readCooldownMs('cd-gitMs'),
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
