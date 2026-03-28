import * as vscode from "vscode";
import { requestSound } from "../sounds/play";
import { isTrackedWorkspaceUri } from "../util/workspaceUri";

export function registerSaveSounds(): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!isTrackedWorkspaceUri(doc.uri)) {
            return;
        }
        requestSound("save");
    });
}
