/**
 * Event and panel playback orchestration: feature gates, per-kind cooldown timestamps, preview/test helpers
 * that return human-readable block reasons for dashboard toasts.
 */
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

/** Last wall-clock time we played each kind for automatic `requestSound` cooldown (not preview/test). */
const lastEventPlayAt: Partial<Record<SoundKind, number>> = {};

/** Master switch + per-feature flags; mirrors `getPreviewBlockedReason` without user-facing strings. */
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

/** If preview would not play, a short reason for the panel toast. */
export function getPreviewBlockedReason(kind: SoundKind): string | undefined {
    if (!isVsSoundEnabled()) {
        return "VS Sound is disabled. Turn it on in the panel.";
    }
    if (kind === "error" && !isFeatureDiagnosticsEnabled()) {
        return 'Turn on "Sounds on errors (diagnostics)" to preview this sound.';
    }
    if ((kind === "buildFailure" || kind === "buildSuccess") && !isFeatureTasksEnabled()) {
        return 'Turn on "Sounds on task finish" to preview this sound.';
    }
    if (kind === "save" && !isFeatureSaveEnabled()) {
        return 'Turn on "Sounds on save" to preview this sound.';
    }
    if ((kind === "debugStart" || kind === "debugEnd") && !isFeatureDebugEnabled()) {
        return 'Turn on "Sounds on debug session start / end" to preview this sound.';
    }
    if (
        (kind === "terminalOpen" || kind === "terminalExitSuccess" || kind === "terminalExitFailure") &&
        !isFeatureTerminalEnabled()
    ) {
        return 'Turn on "Sounds on terminal open / shell exit" to preview this sound.';
    }
    if ((kind === "gitCommit" || kind === "gitPull" || kind === "gitMergeConflict") && !isFeatureGitEnabled()) {
        return 'Turn on "Sounds on Git events" to preview this sound.';
    }
    if (!getSoundPath(kind)) {
        return "Set an audio path for this row (Choose file… or type a path), then preview again.";
    }
    return undefined;
}

/** If the test sound would not play from the panel, a short reason for a toast. */
export function getPlayTestBlockedReason(): string | undefined {
    if (!isVsSoundEnabled()) {
        return "VS Sound is disabled. Turn it on in the panel.";
    }
    if (!getSoundPath("test")) {
        return 'Set a path for the "Test" row (or setting vssound.sounds.test), then try again.';
    }
    return undefined;
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
    if (getPreviewBlockedReason(kind) !== undefined) {
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
    if (getPlayTestBlockedReason() !== undefined) {
        return;
    }
    requestSound("test");
}
