import { playSound } from "../audio/playSound";
import {
    getCooldownMsForKind,
    getSoundPath,
    isFeatureDebugEnabled,
    isFeatureDiagnosticsEnabled,
    isFeatureGitEnabled,
    isFeatureSaveEnabled,
    isFeatureTasksEnabled,
    isFeatureTerminalEnabled,
    isVsSoundEnabled,
} from "../config";
import type { SoundKind } from "./catalog";

const lastEventPlayAt: Partial<Record<SoundKind, number>> = {};

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
    if (kind === "save" && !isFeatureSaveEnabled()) {
        return false;
    }
    if ((kind === "debugStart" || kind === "debugEnd") && !isFeatureDebugEnabled()) {
        return false;
    }
    if (
        (kind === "terminalOpen" || kind === "terminalExitSuccess" || kind === "terminalExitFailure") &&
        !isFeatureTerminalEnabled()
    ) {
        return false;
    }
    if ((kind === "gitCommit" || kind === "gitPull" || kind === "gitMergeConflict") && !isFeatureGitEnabled()) {
        return false;
    }
    return true;
}

/** Real events: respects master switch, feature toggles, and per-kind cooldown. */
export function requestSound(kind: SoundKind): void {
    if (!allowEventPlayback(kind)) {
        return;
    }
    const path = getSoundPath(kind);
    if (!path) {
        return;
    }
    const cooldownMs = getCooldownMsForKind(kind);
    if (cooldownMs > 0) {
        const last = lastEventPlayAt[kind];
        if (last !== undefined) {
            const elapsed = Date.now() - last;
            if (elapsed < cooldownMs) {
                return;
            }
        }
    }
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
    if (!allowEventPlayback(kind)) {
        return;
    }
    const path = getSoundPath(kind);
    if (!path) {
        return;
    }
    playSound(path);
}

/** Command palette test: same rules as live playback for the test slot. */
export function runPlayTestCommand(): void {
    if (!isVsSoundEnabled()) {
        return;
    }
    const path = getSoundPath("test");
    if (!path) {
        return;
    }
    requestSound("test");
}
