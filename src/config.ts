import * as vscode from "vscode";
import type { SoundKind } from "./types";

export const SOUND_KEYS: SoundKind[] = [
    "terminal",
    "error",
    "buildFailure",
    "buildSuccess",
    "test",
];

export type DashboardState = {
    enabled: boolean;
    features: { diagnostics: boolean; tasks: boolean };
    sounds: Record<SoundKind, string>;
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
    for (const k of SOUND_KEYS) {
        sounds[k] = c.get<string>(`sounds.${k}`, "") ?? "";
    }
    return {
        enabled: c.get<boolean>("enabled", true),
        features: {
            diagnostics: c.get<boolean>("features.diagnostics", true),
            tasks: c.get<boolean>("features.tasks", true),
        },
        sounds,
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

export async function setSoundPaths(paths: Record<string, string>): Promise<void> {
    const c = vscode.workspace.getConfiguration("vssound");
    for (const k of SOUND_KEYS) {
        const v = typeof paths[k] === "string" ? paths[k] : "";
        await c.update(`sounds.${k}`, v, vscode.ConfigurationTarget.Global);
    }
}
