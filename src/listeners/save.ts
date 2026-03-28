/** Save sound: only for tracked workspace documents (see `isTrackedWorkspaceUri`). */
import * as vscode from "vscode";
import { requestSound } from "../sounds/play";
import { isTrackedWorkspaceUri } from "../util/workspaceUri";

/** `onDidSaveTextDocument` → `requestSound("save")` when URI is workspace-scoped. */
export function registerSaveSounds(): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!isTrackedWorkspaceUri(doc.uri)) {
            return;
        }
        requestSound("save");
    });
}
