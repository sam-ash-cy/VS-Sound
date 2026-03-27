import * as vscode from "vscode";
import type { SoundKind } from "./types";

export function isVsSoundEnabled(): boolean {
    return vscode.workspace.getConfiguration("vssound").get<boolean>("enabled", true);
}

export function getSoundPath(kind: SoundKind): string | undefined {
    const v = vscode.workspace
        .getConfiguration("vssound")
        .get<string>(`sounds.${kind}`, "")
        ?.trim();
    return v || undefined;
}
