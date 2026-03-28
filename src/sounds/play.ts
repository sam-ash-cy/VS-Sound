import * as vscode from "vscode";
import { playSound } from "../audio/playSound";
import {
    getCooldownMsForKind,
    getSoundPath,
    isFeatureDiagnosticsEnabled,
    isFeatureTasksEnabled,
    isVsSoundEnabled,
} from "../config";
import { logPlaySoundInfo, revealVsSoundLog } from "../logger";
import type { SoundKind } from "./catalog";

const lastEventPlayAt: Partial<Record<SoundKind, number>> = {};

const EVENT_LABEL: Record<SoundKind, string> = {
    error: "diagnostic error",
    buildSuccess: "task / build success",
    buildFailure: "task / build failure",
    terminal: "terminal",
    test: "test (command)",
};

function allowEventPlayback(kind: SoundKind): boolean {
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

/** Real events (diagnostics, tasks): respects master switch, feature toggles, and per-kind cooldown. */
export function requestSound(kind: SoundKind): void {
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
                logPlaySoundInfo(
                    `Event skipped (${label}, kind=${kind}): cooldown is ${cooldownMs}ms — ${remaining}ms left (${elapsed}ms since last play).`,
                );
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

/**
 * Panel preview: respects master switch and the same feature toggles as live events
 * (so disabling VS Sound or a feature stops preview for that kind).
 */
export function previewSound(kind: SoundKind): void {
    revealVsSoundLog(true);
    if (!isVsSoundEnabled()) {
        void vscode.window.showWarningMessage("VS Sound is disabled. Turn it on in the panel to use Preview.");
        return;
    }
    if (kind === "error" && !isFeatureDiagnosticsEnabled()) {
        void vscode.window.showWarningMessage(
            'Diagnostic sounds are off. Enable "Sounds on errors (diagnostics)" to preview this sound.',
        );
        return;
    }
    if ((kind === "buildFailure" || kind === "buildSuccess") && !isFeatureTasksEnabled()) {
        void vscode.window.showWarningMessage(
            'Task sounds are off. Enable "Sounds on task finish" to preview this sound.',
        );
        return;
    }
    const path = getSoundPath(kind);
    if (!path) {
        void vscode.window.showWarningMessage(`Set a path for "${kind}" in VS Sound or settings.`);
        return;
    }
    logPlaySoundInfo(`Preview (${kind}): "${path}".`);
    playSound(path);
}

/** Command palette test: same rules as live playback for the test slot. */
export function runPlayTestCommand(): void {
    revealVsSoundLog(true);
    if (!isVsSoundEnabled()) {
        void vscode.window.showWarningMessage("VS Sound is disabled.");
        return;
    }
    const path = getSoundPath("test");
    if (!path) {
        void vscode.window.showWarningMessage('Set a path for "Test" in VS Sound or settings.');
        return;
    }
    logPlaySoundInfo(`Test: "${path}".`);
    requestSound("test");
}
