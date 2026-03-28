import * as vscode from "vscode";
import { isDiagnosticsEdgeTriggerOnly } from "../config";
import { requestSound } from "../sounds/play";

const DEBOUNCE_MS = 500;
/** Before we trust "no errors" from diagnostics to reset tab-back suppression. */
const CLEAR_SUPPRESS_MS = 600;

/** Only `file:` URIs inside the workspace, or `untitled:` when a workspace is open. */
function isTrackedDocument(uri: vscode.Uri): boolean {
    if (uri.scheme === "file") {
        return vscode.workspace.getWorkspaceFolder(uri) !== undefined;
    }
    if (uri.scheme === "untitled") {
        const folders = vscode.workspace.workspaceFolders;
        return folders !== undefined && folders.length > 0;
    }
    return false;
}

function uriHasErrors(uri: vscode.Uri): boolean {
    const diags = vscode.languages.getDiagnostics(uri);
    return diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error);
}

function activeEditorHasErrors(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.isClosed) {
        return false;
    }
    const uri = editor.document.uri;
    if (!isTrackedDocument(uri)) {
        return false;
    }
    return uriHasErrors(uri);
}

function parseTrackedUri(uriKey: string): vscode.Uri | undefined {
    try {
        const u = vscode.Uri.parse(uriKey);
        return isTrackedDocument(u) ? u : undefined;
    } catch {
        return undefined;
    }
}

export function registerDiagnosticSounds(): vscode.Disposable {
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    /** Last active editor URI key (stable string from `document.uri.toString()`). */
    let lastActiveUriKey: string | undefined;
    let hadErrorsOnActive = false;
    /**
     * URIs the user left while that document still had errors. While a URI is in this set, focusing it
     * again must not replay the sound (tab back). Cleared only after diagnostics stay error-free (delayed).
     */
    const tabBackSuppress = new Set<string>();
    const pendingClearSuppress = new Map<string, ReturnType<typeof setTimeout>>();

    const cancelPendingClearSuppress = (uriKey: string): void => {
        const t = pendingClearSuppress.get(uriKey);
        if (t !== undefined) {
            clearTimeout(t);
            pendingClearSuppress.delete(uriKey);
        }
    };

    const scheduleClearSuppressIfStillClean = (uri: vscode.Uri): void => {
        const uriKey = uri.toString();
        cancelPendingClearSuppress(uriKey);
        pendingClearSuppress.set(
            uriKey,
            setTimeout(() => {
                pendingClearSuppress.delete(uriKey);
                if (!isTrackedDocument(uri)) {
                    return;
                }
                if (!uriHasErrors(uri)) {
                    tabBackSuppress.delete(uriKey);
                }
            }, CLEAR_SUPPRESS_MS),
        );
    };

    const onDiagnosticUrisChanged = (uris: readonly vscode.Uri[]): void => {
        for (const uri of uris) {
            if (!isTrackedDocument(uri)) {
                continue;
            }
            const key = uri.toString();
            if (uriHasErrors(uri)) {
                cancelPendingClearSuppress(key);
            } else {
                scheduleClearSuppressIfStillClean(uri);
            }
        }
    };

    const noteLeavingDocument = (leftKey: string | undefined): void => {
        if (leftKey === undefined) {
            return;
        }
        const u = parseTrackedUri(leftKey);
        if (u === undefined) {
            return;
        }
        if (uriHasErrors(u)) {
            tabBackSuppress.add(leftKey);
        } else {
            tabBackSuppress.delete(leftKey);
        }
    };

    const runCheck = (): void => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.isClosed) {
            noteLeavingDocument(lastActiveUriKey);
            lastActiveUriKey = undefined;
            hadErrorsOnActive = false;
            return;
        }

        const uriKey = editor.document.uri.toString();
        const prevKey = lastActiveUriKey;
        const focusChanged = prevKey !== uriKey;

        if (focusChanged) {
            noteLeavingDocument(prevKey);
        }

        lastActiveUriKey = uriKey;

        const nowHasErrors = activeEditorHasErrors();
        const edgeOnly = isDiagnosticsEdgeTriggerOnly();

        if (!edgeOnly) {
            if (nowHasErrors) {
                requestSound("error");
            }
            hadErrorsOnActive = nowHasErrors;
            return;
        }

        if (focusChanged) {
            if (nowHasErrors && !tabBackSuppress.has(uriKey)) {
                requestSound("error");
            }
            hadErrorsOnActive = nowHasErrors;
            return;
        }

        if (nowHasErrors && !hadErrorsOnActive && !tabBackSuppress.has(uriKey)) {
            requestSound("error");
        }
        hadErrorsOnActive = nowHasErrors;
    };

    const scheduleDebouncedCheck = (): void => {
        if (debounceTimer !== undefined) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            debounceTimer = undefined;
            runCheck();
        }, DEBOUNCE_MS);
    };

    const onDiagnostics = vscode.languages.onDidChangeDiagnostics((e) => {
        onDiagnosticUrisChanged(e.uris);
        scheduleDebouncedCheck();
    });
    const onActiveEditor = vscode.window.onDidChangeActiveTextEditor(() => {
        runCheck();
    });

    queueMicrotask(() => {
        runCheck();
    });

    return vscode.Disposable.from(
        onDiagnostics,
        onActiveEditor,
        new vscode.Disposable(() => {
            if (debounceTimer !== undefined) {
                clearTimeout(debounceTimer);
            }
            for (const t of pendingClearSuppress.values()) {
                clearTimeout(t);
            }
            pendingClearSuppress.clear();
        }),
    );
}
