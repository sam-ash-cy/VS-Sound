import { getSoundPath, isVsSoundEnabled } from "./config";
import { playSound } from "./audio/playSound";
import type { SoundKind } from "./types";

export function requestSound(kind: SoundKind): void {
    if (!isVsSoundEnabled()) {
        return;
    }
    const path = getSoundPath(kind);
    if (!path) {
        return;
    }
    playSound(path);
}
