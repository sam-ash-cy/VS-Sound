/**
 * Diagnostic error sounds for the **active** editor only.
 *
 * **Edge mode** (default): avoids spam on TS/LS refresh by playing when (a) you focus a tab with errors
 * (unless tab-back suppress applies), or (b) the **count** of Error-severity diagnostics **increases**
 * on the same tab. **Tab-back suppress**: leaving a file that still had errors, then returning, does not
 * replay until that file stays error-free long enough (`CLEAR_SUPPRESS_MS`) so transient empty diagnostics
 * do not clear suppress too early.
 *
 * **Non–edge mode**: plays on each debounced pass while the active file has errors (still gated by cooldown).
 */
import * as vscode from "vscode";
import { isDiagnosticsEdgeTriggerOnly } from "../config";
import { requestSound } from "../sounds/play";
import { isTrackedWorkspaceUri } from "../util/workspaceUri";

/** Coalesce rapid `onDidChangeDiagnostics` bursts from language services. */
const DEBOUNCE_MS = 500;
/** Before we trust "no errors" from diagnostics to reset tab-back suppression. */
const CLEAR_SUPPRESS_MS = 600;

function uriHasErrors(uri: vscode.Uri): boolean {
    const diags = vscode.languages.getDiagnostics(uri);
    return diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error);
}

/** Number of Error-severity diagnostics (used to detect new errors without clearing existing ones). */
function uriErrorCount(uri: vscode.Uri): number {
    return vscode.languages
        .getDiagnostics(uri)
        .filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length;
}

/** True if the current active editor is in a tracked workspace doc and has at least one error diagnostic. */
function activeEditorHasErrors(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.isClosed) {
        return false;
    }
    const uri = editor.document.uri;
    if (!isTrackedWorkspaceUri(uri)) {
        return false;
    }
    return uriHasErrors(uri);
}

/** Parse a stored `document.uri.toString()` key back to a Uri if it is a tracked workspace resource. */
function parseTrackedUri(uriKey: string): vscode.Uri | undefined {
    try {
        const u = vscode.Uri.parse(uriKey);
        return isTrackedWorkspaceUri(u) ? u : undefined;
    } catch {
        return undefined;
    }
}

/** Subscribes to diagnostic changes + active editor changes; returns a disposable that clears timers. */
export function registerDiagnosticSounds(): vscode.Disposable {
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    /** Last active editor URI key (stable string from `document.uri.toString()`). */
    let lastActiveUriKey: string | undefined;
    /**
     * Error count we last applied for the active tab (edge mode). When the user already has errors and
     * the language service adds more, count increases → play again. Pure refreshes keep the same count → no play.
     */
    let lastErrorCountBaseline = 0;
    /**
     * URIs the user left while that document still had errors. While a URI is in this set, focusing it
     * again must not replay the sound (tab back). Cleared only after diagnostics stay error-free (delayed).
     */
    const tabBackSuppress = new Set<string>();
    const pendingClearSuppress = new Map<string, ReturnType<typeof setTimeout>>();

    /** Abort a pending “clear tab-back suppress” timer when errors reappear for that URI. */
    const cancelPendingClearSuppress = (uriKey: string): void => {
        const t = pendingClearSuppress.get(uriKey);
        if (t !== undefined) {
            clearTimeout(t);
            pendingClearSuppress.delete(uriKey);
        }
    };

    /** After errors disappear for `uri`, wait `CLEAR_SUPPRESS_MS` then drop tab-back suppress if still clean. */
    const scheduleClearSuppressIfStillClean = (uri: vscode.Uri): void => {
        const uriKey = uri.toString();
        cancelPendingClearSuppress(uriKey);
        pendingClearSuppress.set(
            uriKey,
            setTimeout(() => {
                pendingClearSuppress.delete(uriKey);
                if (!isTrackedWorkspaceUri(uri)) {
                    return;
                }
                if (!uriHasErrors(uri)) {
                    tabBackSuppress.delete(uriKey);
                }
            }, CLEAR_SUPPRESS_MS),
        );
    };

    /** VS Code tells us which URIs changed; we only adjust suppress timers for tracked workspace files. */
    const onDiagnosticUrisChanged = (uris: readonly vscode.Uri[]): void => {
        for (const uri of uris) {
            if (!isTrackedWorkspaceUri(uri)) {
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

    /** When switching away from `leftKey`, remember if it still had errors (enables tab-back suppress). */
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

    /** Single evaluation of active editor + error state; may request an error sound. */
    const runCheck = (): void => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.isClosed) {
            noteLeavingDocument(lastActiveUriKey);
            lastActiveUriKey = undefined;
            lastErrorCountBaseline = 0;
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
        const errorCount = nowHasErrors ? uriErrorCount(editor.document.uri) : 0;
        const edgeOnly = isDiagnosticsEdgeTriggerOnly();

        if (!edgeOnly) {
            if (nowHasErrors) {
                requestSound("error");
            }
            lastErrorCountBaseline = errorCount;
            return;
        }

        if (focusChanged) {
            if (nowHasErrors && !tabBackSuppress.has(uriKey)) {
                requestSound("error");
            }
            lastErrorCountBaseline = errorCount;
            return;
        }

        if (nowHasErrors && errorCount > lastErrorCountBaseline) {
            requestSound("error");
        }
        lastErrorCountBaseline = errorCount;
    };

    /** Reset timer on each diagnostic burst so we run `runCheck` once things settle. */
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

    /** Active editor exists before any tab event on cold start — sync baseline once. */
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
