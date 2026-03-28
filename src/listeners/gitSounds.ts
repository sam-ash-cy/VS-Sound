/**
 * Git-related sounds via **filesystem watchers** on `.git` metadata (no `vscode.git` API dependency).
 * HEAD / FETCH_HEAD: first read establishes baseline; later **content** changes fire sounds. MERGE_HEAD:
 * **create** fires merge sound once per path until deleted.
 */
import * as vscode from "vscode";
import { requestSound } from "../sounds/play";

/** Read file as UTF-8 text for comparing `.git/*` heads; returns undefined if missing/unreadable. */
async function readUtf8(uri: vscode.Uri): Promise<string | undefined> {
    try {
        const raw = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(raw).toString("utf8").trim();
    } catch {
        return undefined;
    }
}

/** Registers watchers for each `workspaceFolder` (not updated if folders are added later without reload). */
export function registerGitWorkspaceSounds(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    const lastHead = new Map<string, string>();
    const lastFetch = new Map<string, string>();
    const mergePresent = new Set<string>();

    /** Compare new HEAD file contents to previous; play `gitCommit` on real ref change. */
    const considerHead = (uri: vscode.Uri): void => {
        void (async () => {
            const key = uri.fsPath;
            const next = await readUtf8(uri);
            if (next === undefined) {
                return;
            }
            const prev = lastHead.get(key);
            lastHead.set(key, next);
            if (prev !== undefined && prev !== next) {
                requestSound("gitCommit");
            }
        })();
    };

    /** FETCH_HEAD updates on fetch/pull; distinct from HEAD for a separate user-assignable sound. */
    const considerFetch = (uri: vscode.Uri): void => {
        void (async () => {
            const key = uri.fsPath;
            const next = await readUtf8(uri);
            if (next === undefined) {
                return;
            }
            const prev = lastFetch.get(key);
            lastFetch.set(key, next);
            if (prev !== undefined && prev !== next) {
                requestSound("gitPull");
            }
        })();
    };

    /** MERGE_HEAD appearing usually means merge/revert/cherry-pick in progress. */
    const considerMergeCreate = (uri: vscode.Uri): void => {
        const key = uri.fsPath;
        if (mergePresent.has(key)) {
            return;
        }
        mergePresent.add(key);
        requestSound("gitMergeConflict");
    };

    /** Allow a future merge on the same repo to fire create again. */
    const considerMergeDelete = (uri: vscode.Uri): void => {
        mergePresent.delete(uri.fsPath);
    };

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const headPat = new vscode.RelativePattern(folder, "**/.git/HEAD");
        const fetchPat = new vscode.RelativePattern(folder, "**/.git/FETCH_HEAD");
        const mergePat = new vscode.RelativePattern(folder, "**/.git/MERGE_HEAD");

        const wh = vscode.workspace.createFileSystemWatcher(headPat, false, false, false);
        disposables.push(wh);
        wh.onDidChange(considerHead);
        wh.onDidCreate(considerHead);

        const wf = vscode.workspace.createFileSystemWatcher(fetchPat, false, false, false);
        disposables.push(wf);
        wf.onDidChange(considerFetch);
        wf.onDidCreate(considerFetch);

        const wm = vscode.workspace.createFileSystemWatcher(mergePat, false, false, false);
        disposables.push(wm);
        wm.onDidCreate(considerMergeCreate);
        wm.onDidDelete(considerMergeDelete);
    }

    return vscode.Disposable.from(...disposables);
}
