/**
 * Webview ↔ extension bridge: apply settings updates, show **information/warning toasts** for panel actions,
 * and run preview/test with the same gates as `play.ts` (reasons surfaced to the user).
 */
import * as vscode from "vscode";
import {
    getDashboardState,
    setCooldownMs,
    setDiagnosticsEdgeTriggerOnly,
    setFeatureDebug,
    setFeatureDiagnostics,
    setFeatureGit,
    setFeatureSave,
    setFeatureTasks,
    setFeatureTerminal,
    setSoundPath,
    setSoundPaths,
    setVolumePercent,
    setVsSoundEnabled,
    type CooldownMs,
} from "../../config";
import { AUDIO_FILE_DIALOG_FILTERS, SOUND_KINDS, type SoundKind } from "../../sounds/catalog";
import {
    getPlayTestBlockedReason,
    getPreviewBlockedReason,
    previewSound,
    runPlayTestCommand,
} from "../../sounds/play";

/** Webview `postMessage` data is untrusted; reject non-plain objects (prototype pollution / odd shapes). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

/**
 * Build a full `Record<SoundKind, string>` from the panel: only catalog keys, string values, trimmed.
 * Unknown keys on the payload are ignored.
 */
function parseSoundPathsFromWebview(raw: unknown): Record<string, string> | undefined {
    if (!isPlainObject(raw)) {
        return undefined;
    }
    const out: Record<string, string> = {};
    for (const k of SOUND_KINDS) {
        const v = raw[k];
        out[k] = typeof v === "string" ? v.trim() : "";
    }
    return out;
}

/** Push current `getDashboardState()` so inputs/checkboxes match configuration. */
export function postDashboardState(webview: vscode.Webview): void {
    webview.postMessage({ type: "state", ...getDashboardState() });
}

/** Safe parse of `message.kind` from untrusted webview JSON. */
function asSoundKind(value: unknown): SoundKind | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    return (SOUND_KINDS as readonly string[]).includes(value) ? (value as SoundKind) : undefined;
}

/** Prefix all panel-driven information toasts for quick scanning in the notification list. */
function toast(msg: string): void {
    void vscode.window.showInformationMessage(`VS Sound: ${msg}`);
}

/** Native open dialog → persist path → refresh webview + toast. */
async function pickAudioFileForKind(kind: SoundKind, webview: vscode.Webview): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select audio file",
        filters: AUDIO_FILE_DIALOG_FILTERS,
    });
    if (!uris?.[0]) {
        return;
    }
    await setSoundPath(kind, uris[0].fsPath);
    postDashboardState(webview);
    toast(`Path set for “${kind}”.`);
}

/** Extract numeric cooldown fields from the webview payload; ignore invalid/missing keys. */
function parseCooldownPayload(raw: unknown): Partial<CooldownMs> | undefined {
    if (!isPlainObject(raw)) {
        return undefined;
    }
    const o = raw;
    const out: Partial<CooldownMs> = {};
    for (const key of [
        "errorMs",
        "buildSuccessMs",
        "buildFailureMs",
        "terminalMs",
        "saveMs",
        "debugMs",
        "gitMs",
    ] as const) {
        const v = o[key];
        if (typeof v === "number" && Number.isFinite(v)) {
            out[key] = v;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}

/** Central switch for `postMessage` types from `html.ts` embedded script. */
export async function handleDashboardMessage(message: unknown, webview: vscode.Webview): Promise<void> {
    if (!isPlainObject(message) || typeof message.type !== "string") {
        return;
    }
    const m = message;

    switch (m.type) {
        case "ready":
            postDashboardState(webview);
            break;
        case "playTest": {
            const blocked = getPlayTestBlockedReason();
            if (blocked !== undefined) {
                void vscode.window.showWarningMessage(`VS Sound: ${blocked}`);
            } else {
                runPlayTestCommand();
                toast("Playing test sound.");
            }
            break;
        }
        case "playPreview": {
            const k = asSoundKind(m.kind);
            if (!k) {
                break;
            }
            const blocked = getPreviewBlockedReason(k);
            if (blocked !== undefined) {
                void vscode.window.showWarningMessage(`VS Sound: ${blocked}`);
            } else {
                previewSound(k);
                toast(`Preview (${k}).`);
            }
            break;
        }
        case "pickSound": {
            const k = asSoundKind(m.kind);
            if (k) {
                await pickAudioFileForKind(k, webview);
            }
            break;
        }
        case "setEnabled":
            if (typeof m.value === "boolean") {
                await setVsSoundEnabled(m.value);
                toast(m.value ? "Enabled." : "Disabled.");
            }
            break;
        case "setFeatureDiagnostics":
            if (typeof m.value === "boolean") {
                await setFeatureDiagnostics(m.value);
                toast(
                    m.value
                        ? "Diagnostic error sounds are on."
                        : "Diagnostic error sounds are off.",
                );
            }
            break;
        case "setFeatureTasks":
            if (typeof m.value === "boolean") {
                await setFeatureTasks(m.value);
                toast(
                    m.value
                        ? "Task finish sounds (success / failure) are on."
                        : "Task finish sounds are off.",
                );
            }
            break;
        case "setFeatureSave":
            if (typeof m.value === "boolean") {
                await setFeatureSave(m.value);
                toast(m.value ? "Save sounds are on." : "Save sounds are off.");
            }
            break;
        case "setFeatureDebug":
            if (typeof m.value === "boolean") {
                await setFeatureDebug(m.value);
                toast(
                    m.value
                        ? "Debug session start/end sounds are on."
                        : "Debug session sounds are off.",
                );
            }
            break;
        case "setFeatureTerminal":
            if (typeof m.value === "boolean") {
                await setFeatureTerminal(m.value);
                toast(
                    m.value
                        ? "Terminal open / exit sounds are on."
                        : "Terminal sounds are off.",
                );
            }
            break;
        case "setFeatureGit":
            if (typeof m.value === "boolean") {
                await setFeatureGit(m.value);
                toast(m.value ? "Git event sounds are on." : "Git event sounds are off.");
            }
            break;
        case "setDiagnosticsEdgeOnly":
            if (typeof m.value === "boolean") {
                await setDiagnosticsEdgeTriggerOnly(m.value);
                toast(
                    m.value
                        ? "Error edge mode on (sound when errors appear or count increases, not every refresh)."
                        : "Error edge mode off (more frequent sounds; cooldown still applies).",
                );
            }
            break;
        case "applyVolume":
            if (typeof m.volumePercent === "number" && Number.isFinite(m.volumePercent)) {
                const v = Math.max(0, Math.min(100, Math.round(m.volumePercent)));
                await setVolumePercent(v);
                toast(`Volume saved (${v}%). 0% skips playback.`);
            }
            break;
        case "applyPaths": {
            const paths = parseSoundPathsFromWebview(m.paths);
            if (paths !== undefined) {
                await setSoundPaths(paths);
                toast("Sound paths saved.");
            }
            break;
        }
        case "applyCooldowns": {
            const c = parseCooldownPayload(m.cooldown);
            if (c) {
                await setCooldownMs(c);
                toast("Cooldowns saved.");
            }
            break;
        }
        case "openSettings":
            await vscode.commands.executeCommand("workbench.action.openSettings", "vssound");
            break;
        default:
            break;
    }
}
