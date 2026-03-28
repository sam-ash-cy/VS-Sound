import * as vscode from "vscode";
import {
    getDashboardState,
    setCooldownMs,
    setDiagnosticsEdgeTriggerOnly,
    setFeatureDiagnostics,
    setFeatureTasks,
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
    void vscode.window.showInformationMessage(`VS Sound: path set for ${kind}.`);
}

function parseCooldownPayload(raw: unknown): Partial<CooldownMs> | undefined {
    if (!raw || typeof raw !== "object") {
        return undefined;
    }
    const o = raw as Record<string, unknown>;
    const out: Partial<CooldownMs> = {};
    for (const key of ["errorMs", "buildSuccessMs", "buildFailureMs", "terminalMs"] as const) {
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
                void vscode.window.showInformationMessage(
                    message.value ? "VS Sound is enabled." : "VS Sound is disabled.",
                );
            }
            break;
        case "setFeatureDiagnostics":
            if (typeof message.value === "boolean") {
                await setFeatureDiagnostics(message.value);
                void vscode.window.showInformationMessage(
                    message.value
                        ? "VS Sound: sounds on diagnostic errors are enabled."
                        : "VS Sound: sounds on diagnostic errors are disabled.",
                );
            }
            break;
        case "setFeatureTasks":
            if (typeof message.value === "boolean") {
                await setFeatureTasks(message.value);
                void vscode.window.showInformationMessage(
                    message.value
                        ? "VS Sound: sounds on task finish (success/failure) are enabled."
                        : "VS Sound: sounds on task finish (success/failure) are disabled.",
                );
            }
            break;
        case "setDiagnosticsEdgeOnly":
            if (typeof message.value === "boolean") {
                await setDiagnosticsEdgeTriggerOnly(message.value);
                void vscode.window.showInformationMessage(
                    message.value
                        ? "VS Sound: error sounds only when errors appear (edge mode) — on."
                        : "VS Sound: error sounds on every diagnostic pass while errors exist — edge mode off.",
                );
            }
            break;
        case "applyVolume":
            if (typeof message.volumePercent === "number" && Number.isFinite(message.volumePercent)) {
                await setVolumePercent(message.volumePercent);
                void vscode.window.showInformationMessage(
                    `VS Sound: volume set to ${Math.max(0, Math.min(100, Math.round(message.volumePercent)))}%.`,
                );
            }
            break;
        case "applyPaths":
            if (message.paths && typeof message.paths === "object") {
                await setSoundPaths(message.paths);
                void vscode.window.showInformationMessage("VS Sound paths saved.");
            }
            break;
        case "applyCooldowns": {
            const c = parseCooldownPayload(message.cooldown);
            if (c) {
                await setCooldownMs(c);
                void vscode.window.showInformationMessage("VS Sound cooldowns saved.");
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
