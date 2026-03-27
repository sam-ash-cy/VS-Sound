import {
    getSoundPath,
    isFeatureDiagnosticsEnabled,
    isFeatureTasksEnabled,
    isVsSoundEnabled,
} from "./config";
import { playSound } from "./audio/playSound";
import type { SoundKind } from "./types";

function canPlayKind(kind: SoundKind): boolean {
    if (!isVsSoundEnabled()) {
        return false;
    }
    if (kind === "error" && !isFeatureDiagnosticsEnabled()) {
        return false;
    }
    if ((kind === "buildFailure" || kind === "buildSuccess") && !isFeatureTasksEnabled()) {
        return false;
    }
    return true;
}

export function requestSound(kind: SoundKind): void {
    if (!canPlayKind(kind)) {
        return;
    }
    const path = getSoundPath(kind);
    if (!path) {
        return;
    }
    playSound(path);
}
