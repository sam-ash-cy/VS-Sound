import * as vscode from "vscode";

/**
 * Documents we attach automatic sounds to: on-disk files under a workspace root, or untitled buffers when
 * any folder is open (matches diagnostic / save listener scope).
 */
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
