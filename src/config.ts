/**
 * Reads and writes `vssound.*` workspace configuration: feature flags, sound paths, cooldowns, volume,
 * dashboard snapshot for the webview. Most updates target **global** user settings from the panel.
 */
import * as vscode from "vscode";
import type { SoundKind } from "./sounds/catalog";
import { SOUND_KINDS } from "./sounds/catalog";

export type CooldownMs = {
    errorMs: number;
    buildSuccessMs: number;
    buildFailureMs: number;
    terminalMs: number;
    saveMs: number;
    debugMs: number;
    gitMs: number;
};

export type DashboardFeatures = {
    diagnostics: boolean;
    tasks: boolean;
    save: boolean;
    debug: boolean;
    terminal: boolean;
    git: boolean;
};

export type DashboardState = {
    enabled: boolean;
    features: DashboardFeatures;
    diagnosticsEdgeOnly: boolean;
    volumePercent: number;
    sounds: Record<SoundKind, string>;
    cooldown: CooldownMs;
};

export function isVsSoundEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("enabled", true);
}

export function isFeatureDiagnosticsEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.diagnostics", true);
}

export function isFeatureTasksEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.tasks", true);
}

export function isFeatureSaveEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.save", false) ?? false;
}

export function isFeatureDebugEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.debug", false) ?? false;
}

export function isFeatureTerminalEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.terminal", false) ?? false;
}

export function isFeatureGitEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("features.git", false) ?? false;
}

export function isDiagnosticsEdgeTriggerOnly(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("diagnostics.edgeTriggerOnly", true) ?? true;
}

/** Clamped 0–100. Used by playback; 0 means skip play. */
export function getVolumePercent(): number {
    const c = vscode.workspace.getConfiguration("vssound");
    const v = c.get<number>("volumePercent", 100) ?? 100;
    return Math.max(0, Math.min(100, Math.round(v)));
}

/** Cooldown for event-driven `requestSound` only; `test` and previews are not throttled. */
export function getCooldownMsForKind(kind: SoundKind): number {
    const c = vscode.workspace.getConfiguration("vssound");
    switch (kind) {
        case "error":
            return Math.max(0, c.get<number>("cooldown.errorMs", 2000) ?? 0);
        case "buildSuccess":
            return Math.max(0, c.get<number>("cooldown.buildSuccessMs", 1000) ?? 0);
        case "buildFailure":
            return Math.max(0, c.get<number>("cooldown.buildFailureMs", 1000) ?? 0);
        case "terminalOpen":
        case "terminalExitSuccess":
        case "terminalExitFailure":
            return Math.max(0, c.get<number>("cooldown.terminalMs", 2000) ?? 0);
        case "save":
            return Math.max(0, c.get<number>("cooldown.saveMs", 300) ?? 0);
        case "debugStart":
        case "debugEnd":
            return Math.max(0, c.get<number>("cooldown.debugMs", 500) ?? 0);
        case "gitCommit":
        case "gitPull":
        case "gitMergeConflict":
            return Math.max(0, c.get<number>("cooldown.gitMs", 1000) ?? 0);
        default:
            return 0;
    }
}

/** Snapshot of all cooldown keys for the dashboard. */
function readCooldownMs(): CooldownMs {
    const c = vscode.workspace.getConfiguration("vssound");
    return {
        errorMs: Math.max(0, c.get<number>("cooldown.errorMs", 2000) ?? 0),
        buildSuccessMs: Math.max(0, c.get<number>("cooldown.buildSuccessMs", 1000) ?? 0),
        buildFailureMs: Math.max(0, c.get<number>("cooldown.buildFailureMs", 1000) ?? 0),
        terminalMs: Math.max(0, c.get<number>("cooldown.terminalMs", 2000) ?? 0),
        saveMs: Math.max(0, c.get<number>("cooldown.saveMs", 300) ?? 0),
        debugMs: Math.max(0, c.get<number>("cooldown.debugMs", 500) ?? 0),
        gitMs: Math.max(0, c.get<number>("cooldown.gitMs", 1000) ?? 0),
    };
}

/** Trimmed path from settings; empty string treated as unset. */
export function getSoundPath(kind: SoundKind): string | undefined {
    const v = vscode.workspace
        .getConfiguration("vssound")
        .get<string>(`sounds.${kind}`, "")
        ?.trim();
    return v || undefined;
}

/** Full state pushed to the webview on load and after panel-driven changes. */
export function getDashboardState(): DashboardState {
    const c = vscode.workspace.getConfiguration("vssound");
    const sounds = {} as Record<SoundKind, string>;
    for (const k of SOUND_KINDS) {
        sounds[k] = c.get<string>(`sounds.${k}`, "") ?? "";
    }
    return {
        enabled: c.get<boolean>("enabled", true),
        features: {
            diagnostics: c.get<boolean>("features.diagnostics", true),
            tasks: c.get<boolean>("features.tasks", true),
            save: c.get<boolean>("features.save", false) ?? false,
            debug: c.get<boolean>("features.debug", false) ?? false,
            terminal: c.get<boolean>("features.terminal", false) ?? false,
            git: c.get<boolean>("features.git", false) ?? false,
        },
        diagnosticsEdgeOnly: c.get<boolean>("diagnostics.edgeTriggerOnly", true) ?? true,
        volumePercent: getVolumePercent(),
        sounds,
        cooldown: readCooldownMs(),
    };
}

export async function setVsSoundEnabled(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("enabled", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureDiagnostics(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.diagnostics", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureTasks(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.tasks", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureSave(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.save", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureDebug(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.debug", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureTerminal(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.terminal", value, vscode.ConfigurationTarget.Global);
}

export async function setFeatureGit(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("features.git", value, vscode.ConfigurationTarget.Global);
}

export async function setDiagnosticsEdgeTriggerOnly(value: boolean): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update("diagnostics.edgeTriggerOnly", value, vscode.ConfigurationTarget.Global);
}

export async function setVolumePercent(value: number): Promise<void> {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    await vscode.workspace
        .getConfiguration("vssound")
        .update("volumePercent", v, vscode.ConfigurationTarget.Global);
}

/** Bulk-apply every known `SoundKind` path from the panel “Save paths” button. */
export async function setSoundPaths(paths: Record<string, string>): Promise<void> {
    const c = vscode.workspace.getConfiguration("vssound");
    for (const k of SOUND_KINDS) {
        const v = typeof paths[k] === "string" ? paths[k] : "";
        await c.update(`sounds.${k}`, v, vscode.ConfigurationTarget.Global);
    }
}

export async function setSoundPath(kind: SoundKind, value: string): Promise<void> {
    await vscode.workspace
        .getConfiguration("vssound")
        .update(`sounds.${kind}`, value, vscode.ConfigurationTarget.Global);
}

/** Updates only keys present in `values` (panel sends the full cooldown object on save). */
export async function setCooldownMs(values: Partial<CooldownMs>): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("vssound");
    const entries: [keyof CooldownMs, string][] = [
        ["errorMs", "cooldown.errorMs"],
        ["buildSuccessMs", "cooldown.buildSuccessMs"],
        ["buildFailureMs", "cooldown.buildFailureMs"],
        ["terminalMs", "cooldown.terminalMs"],
        ["saveMs", "cooldown.saveMs"],
        ["debugMs", "cooldown.debugMs"],
        ["gitMs", "cooldown.gitMs"],
    ];
    for (const [key, configKey] of entries) {
        const v = values[key];
        if (typeof v === "number" && Number.isFinite(v)) {
            await cfg.update(configKey, Math.max(0, Math.floor(v)), vscode.ConfigurationTarget.Global);
        }
    }
}
