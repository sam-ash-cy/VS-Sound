import * as vscode from "vscode";
import { logPlaySoundInfo } from "../logger";

export function registerTerminalSounds(): vscode.Disposable {
    logPlaySoundInfo(
        "Terminal output sounds are disabled (no stable VS Code API for terminal stream; proposed API not enabled for this extension).",
    );
    return new vscode.Disposable(() => {});
}
