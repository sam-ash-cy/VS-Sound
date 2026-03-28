import * as vscode from "vscode";
import type { SoundKind } from "./sounds/catalog";
import { SOUND_KINDS } from "./sounds/catalog";

export type CooldownMs = {
    errorMs: number;
    buildSuccessMs: number;
    buildFailureMs: number;
    terminalMs: number;
};

export type DashboardState = {
    enabled: boolean;
    features: { diagnostics: boolean; tasks: boolean };
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
        case "terminal":
            return Math.max(0, c.get<number>("cooldown.terminalMs", 2000) ?? 0);
        default:
            return 0;
    }
}

function readCooldownMs(): CooldownMs {
    const c = vscode.workspace.getConfiguration("vssound");
    return {
        errorMs: Math.max(0, c.get<number>("cooldown.errorMs", 2000) ?? 0),
        buildSuccessMs: Math.max(0, c.get<number>("cooldown.buildSuccessMs", 1000) ?? 0),
        buildFailureMs: Math.max(0, c.get<number>("cooldown.buildFailureMs", 1000) ?? 0),
        terminalMs: Math.max(0, c.get<number>("cooldown.terminalMs", 2000) ?? 0),
    };
}

export function getSoundPath(kind: SoundKind): string | undefined {
    const v = vscode.workspace
        .getConfiguration("vssound")
        .get<string>(`sounds.${kind}`, "")
        ?.trim();
    return v || undefined;
}

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

export async function setCooldownMs(values: Partial<CooldownMs>): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("vssound");
    const entries: [keyof CooldownMs, string][] = [
        ["errorMs", "cooldown.errorMs"],
        ["buildSuccessMs", "cooldown.buildSuccessMs"],
        ["buildFailureMs", "cooldown.buildFailureMs"],
        ["terminalMs", "cooldown.terminalMs"],
    ];
    for (const [key, configKey] of entries) {
        const v = values[key];
        if (typeof v === "number" && Number.isFinite(v)) {
            await cfg.update(configKey, Math.max(0, Math.floor(v)), vscode.ConfigurationTarget.Global);
        }
    }
}
