import * as vscode from "vscode";
import { requestSound } from "../sounds/play";

async function readUtf8(uri: vscode.Uri): Promise<string | undefined> {
    try {
        const raw = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(raw).toString("utf8").trim();
    } catch {
        return undefined;
    }
}

/**
 * Watches `.git/HEAD`, `.git/FETCH_HEAD`, and `.git/MERGE_HEAD` under workspace folders.
 * First observed content is baseline only (no sound).
 */
export function registerGitWorkspaceSounds(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];
    const lastHead = new Map<string, string>();
    const lastFetch = new Map<string, string>();
    const mergePresent = new Set<string>();

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

    const considerMergeCreate = (uri: vscode.Uri): void => {
        const key = uri.fsPath;
        if (mergePresent.has(key)) {
            return;
        }
        mergePresent.add(key);
        requestSound("gitMergeConflict");
    };

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
