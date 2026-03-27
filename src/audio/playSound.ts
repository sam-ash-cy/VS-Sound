import { spawn } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { logPlaySoundFailure, logPlaySoundInfo } from "../logger";

function resolveSoundPath(filePath: string): string {
    const t = filePath.trim();
    if (t.startsWith("~/")) {
        return resolve(homedir(), t.slice(2));
    }
    if (t === "~") {
        return homedir();
    }
    return resolve(t);
}

export function playSound(filePath: string): void {
    if (process.platform !== "darwin") {
        logPlaySoundFailure(`Playback not supported on platform "${process.platform}": ${filePath}`);
        return;
    }

    const resolved = resolveSoundPath(filePath);
    if (!existsSync(resolved)) {
        logPlaySoundFailure(`File not found: ${resolved} (from settings: ${filePath})`);
        return;
    }

    logPlaySoundInfo(`Playing: ${resolved}`);

    const child = spawn("afplay", [resolved], {
        stdio: "ignore",
    });

    child.on("error", (err) => {
        logPlaySoundFailure(`afplay failed to start: ${err.message} (${resolved})`);
    });

    child.on("close", (code) => {
        if (code !== 0 && code !== null) {
            logPlaySoundFailure(`afplay exited with code ${code}: ${resolved}`);
        }
    });
}
