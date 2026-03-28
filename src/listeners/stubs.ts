import * as vscode from "vscode";
import { logPlaySoundInfo } from "../logger";

/** No stable APIs yet for terminal stream or workbench toasts; one disposable to keep activation tidy. */
export function registerUnsupportedFeatureStubs(): vscode.Disposable {
    logPlaySoundInfo(
        "Terminal stream sounds are not available (no stable VS Code API). Notification toasts have no public hook.",
    );
    return new vscode.Disposable(() => {});
}
