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
import { previewSound, runPlayTestCommand } from "../../sounds/play";

export function postDashboardState(webview: vscode.Webview): void {
    webview.postMessage({ type: "state", ...getDashboardState() });
}

function asSoundKind(value: unknown): SoundKind | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    return (SOUND_KINDS as readonly string[]).includes(value) ? (value as SoundKind) : undefined;
}

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
}

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
        case "setFeatureSave":
            if (typeof message.value === "boolean") {
                await setFeatureSave(message.value);
            }
            break;
        case "setFeatureDebug":
            if (typeof message.value === "boolean") {
                await setFeatureDebug(message.value);
            }
            break;
        case "setFeatureTerminal":
            if (typeof message.value === "boolean") {
                await setFeatureTerminal(message.value);
            }
            break;
        case "setFeatureGit":
            if (typeof message.value === "boolean") {
                await setFeatureGit(message.value);
            }
            break;
        case "setDiagnosticsEdgeOnly":
            if (typeof message.value === "boolean") {
                await setDiagnosticsEdgeTriggerOnly(message.value);
            }
            break;
        case "applyVolume":
            if (typeof message.volumePercent === "number" && Number.isFinite(message.volumePercent)) {
                await setVolumePercent(message.volumePercent);
            }
            break;
        case "applyPaths":
            if (message.paths && typeof message.paths === "object") {
                await setSoundPaths(message.paths);
            }
            break;
        case "applyCooldowns": {
            const c = parseCooldownPayload(message.cooldown);
            if (c) {
                await setCooldownMs(c);
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
