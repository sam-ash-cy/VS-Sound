import * as vscode from "vscode";
import { requestSound } from "../requestSound";

const DEBOUNCE_MS = 500;

export function registerDiagnosticSounds(): vscode.Disposable {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return vscode.languages.onDidChangeDiagnostics(() => {
        const tuples = vscode.languages.getDiagnostics();
        const hasError = tuples.some(([, diags]) =>
            diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error),
        );
        if (!hasError) {
            return;
        }
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = undefined;
            const again = vscode.languages
                .getDiagnostics()
                .some(([, diags]) =>
                    diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error),
                );
            if (again) {
                requestSound("error");
            }
        }, DEBOUNCE_MS);
    });
}
