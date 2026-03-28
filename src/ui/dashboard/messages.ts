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
    if (!raw || typeof raw !== "object") {
        return undefined;
    }
    const o = raw as Record<string, unknown>;
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
export async function handleDashboardMessage(
    message: {
        type: string;
        value?: boolean;
        paths?: Record<string, string>;
        kind?: string;
        cooldown?: unknown;
        volumePercent?: number;
    },
    webview: vscode.Webview,
): Promise<void> {
    switch (message.type) {
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
            const k = asSoundKind(message.kind);
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
            const k = asSoundKind(message.kind);
            if (k) {
                await pickAudioFileForKind(k, webview);
            }
            break;
        }
        case "setEnabled":
            if (typeof message.value === "boolean") {
                await setVsSoundEnabled(message.value);
                toast(message.value ? "Enabled." : "Disabled.");
            }
            break;
        case "setFeatureDiagnostics":
            if (typeof message.value === "boolean") {
                await setFeatureDiagnostics(message.value);
                toast(
                    message.value
                        ? "Diagnostic error sounds are on."
                        : "Diagnostic error sounds are off.",
                );
            }
            break;
        case "setFeatureTasks":
            if (typeof message.value === "boolean") {
                await setFeatureTasks(message.value);
                toast(
                    message.value
                        ? "Task finish sounds (success / failure) are on."
                        : "Task finish sounds are off.",
                );
            }
            break;
        case "setFeatureSave":
            if (typeof message.value === "boolean") {
                await setFeatureSave(message.value);
                toast(message.value ? "Save sounds are on." : "Save sounds are off.");
            }
            break;
        case "setFeatureDebug":
            if (typeof message.value === "boolean") {
                await setFeatureDebug(message.value);
                toast(
                    message.value
                        ? "Debug session start/end sounds are on."
                        : "Debug session sounds are off.",
                );
            }
            break;
        case "setFeatureTerminal":
            if (typeof message.value === "boolean") {
                await setFeatureTerminal(message.value);
                toast(
                    message.value
                        ? "Terminal open / exit sounds are on."
                        : "Terminal sounds are off.",
                );
            }
            break;
        case "setFeatureGit":
            if (typeof message.value === "boolean") {
                await setFeatureGit(message.value);
                toast(message.value ? "Git event sounds are on." : "Git event sounds are off.");
            }
            break;
        case "setDiagnosticsEdgeOnly":
            if (typeof message.value === "boolean") {
                await setDiagnosticsEdgeTriggerOnly(message.value);
                toast(
                    message.value
                        ? "Error edge mode on (sound when errors appear or count increases, not every refresh)."
                        : "Error edge mode off (more frequent sounds; cooldown still applies).",
                );
            }
            break;
        case "applyVolume":
            if (typeof message.volumePercent === "number" && Number.isFinite(message.volumePercent)) {
                const v = Math.max(0, Math.min(100, Math.round(message.volumePercent)));
                await setVolumePercent(v);
                toast(`Volume saved (${v}%). 0% skips playback.`);
            }
            break;
        case "applyPaths":
            if (message.paths && typeof message.paths === "object") {
                await setSoundPaths(message.paths);
                toast("Sound paths saved.");
            }
            break;
        case "applyCooldowns": {
            const c = parseCooldownPayload(message.cooldown);
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
