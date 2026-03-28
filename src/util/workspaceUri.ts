import * as vscode from "vscode";

/** `file:` URIs inside the workspace, or `untitled:` when a workspace is open. */
export function isTrackedWorkspaceUri(uri: vscode.Uri): boolean {
    if (uri.scheme === "file") {
        return vscode.workspace.getWorkspaceFolder(uri) !== undefined;
    }
    if (uri.scheme === "untitled") {
        const folders = vscode.workspace.workspaceFolders;
        return folders !== undefined && folders.length > 0;
    }
    return false;
}
