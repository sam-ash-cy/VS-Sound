/**
 * Cross-platform audio playback: picks a backend per OS (afplay, ffplay, mpv, MCI, PowerShell WAV, paplay/aplay).
 * Failures go to `logPlaySoundFailure` (Output channel + stderr). Volume is best-effort per backend.
 */
import { spawn, spawnSync } from "child_process";
import { Buffer } from "buffer";
import { existsSync } from "fs";
import { homedir } from "os";
import { extname, resolve } from "path";
import { getVolumePercent } from "../config";
import { logPlaySoundFailure } from "../logger";

/** Expand `~/` and resolve to an absolute path for existence checks and players. */
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

/** Resolve `name` on PATH (`where` on Windows, `command -v` elsewhere). */
function whichExecutable(name: string): string | undefined {
    if (process.platform === "win32") {
        const r = spawnSync("where.exe", [name], { encoding: "utf8", windowsHide: true });
        if (r.status !== 0 || !r.stdout) {
            return undefined;
        }
        const line = r.stdout.trim().split(/\r?\n/)[0];
        return line?.trim() || undefined;
    }
    const r = spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" });
    if (r.status !== 0 || !r.stdout) {
        return undefined;
    }
    return r.stdout.trim().split(/\r?\n/)[0] || undefined;
}

/** Fire-and-forget child process; log spawn/exit failures only. */
function runSpawn(
    label: string,
    command: string,
    args: string[],
    options: { env?: NodeJS.ProcessEnv; windowsHide?: boolean } = {},
): void {
    const child = spawn(command, args, {
        stdio: "ignore",
        windowsHide: options.windowsHide ?? process.platform === "win32",
        env: options.env,
    });

    child.on("error", (err) => {
        logPlaySoundFailure(`${label} failed to start: ${err.message}`);
    });

    child.on("close", (code) => {
        if (code !== 0 && code !== null) {
            logPlaySoundFailure(`${label} exited with code ${code}`);
        }
    });
}

/** macOS built-in player; maps 0–100% to afplay’s 1–255 volume scale. */
function playDarwin(resolved: string, volumePercent: number): boolean {
    const v = Math.max(1, Math.min(255, Math.round((volumePercent / 100) * 255)));
    runSpawn("afplay", "afplay", ["-v", String(v), resolved]);
    return true;
}

/** WAV only; built into Windows / PowerShell. Volume setting not supported here. */
function playWindowsSoundPlayer(resolved: string): boolean {
    const ext = extname(resolved).toLowerCase();
    if (ext !== ".wav") {
        return false;
    }
    runSpawn(
        "PowerShell SoundPlayer",
        "powershell.exe",
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "(New-Object System.Media.SoundPlayer($env:VSSOUND_PATH)).PlaySync(); exit 0",
        ],
        { env: { ...process.env, VSSOUND_PATH: resolved } },
    );
    return true;
}

/**
 * Windows multimedia command interface via PowerShell + winmm `mciSendString`.
 * Builds a one-off alias, sets volume (0–1000 scale), plays synchronously, closes. Path quoting uses `$dq`
 * so `Replace` uses the string overload (char overload breaks on some paths).
 */
function playWindowsMci(resolved: string, volumePercent: number): void {
    const script = [
        "$ProgressPreference = 'SilentlyContinue'",
        "$ErrorActionPreference = 'Stop'",
        "Add-Type @'",
        "using System;",
        "using System.Runtime.InteropServices;",
        "using System.Text;",
        "public class VssMci {",
        "  [DllImport(\"winmm.dll\", CharSet = CharSet.Unicode)]",
        "  public static extern int mciSendString(string s, StringBuilder r, int n, IntPtr h);",
        "}",
        "'@",
        "$p = $env:VSSOUND_PATH",
        "if (-not (Test-Path -LiteralPath $p)) { Write-Error 'File not found'; exit 2 }",
        "$alias = 'VSS' + [guid]::NewGuid().ToString('N')",
        "$ext = [IO.Path]::GetExtension($p).ToLowerInvariant()",
        "$mciType = if ($ext -eq '.wav') { 'waveaudio' } else { 'mpegvideo' }",
        "function VssSend([string]$cmd) {",
        "  $sb = New-Object System.Text.StringBuilder 512",
        "  $e = [VssMci]::mciSendString($cmd, $sb, $sb.Capacity, [IntPtr]::Zero)",
        "  if ($e -ne 0) { Write-Error ('MCI error {0}: {1}' -f $e, $sb.ToString()); exit 1 }",
        "}",
        "$dq = [string][char]34",
        "$inner = $p.Replace($dq, ([string][char]92 + $dq))",
        "$quoted = $dq + $inner + $dq",
        "VssSend ('open ' + $quoted + ' type ' + $mciType + ' alias ' + $alias)",
        "$vp = [int]$env:VSSOUND_VOL",
        "$vm = [Math]::Min(1000, [Math]::Max(0, $vp * 10))",
        "VssSend ('setaudio ' + $alias + ' volume to ' + $vm)",
        "VssSend ('play ' + $alias + ' wait')",
        "VssSend ('close ' + $alias)",
    ].join("\n");

    const encoded = Buffer.from(script, "utf16le").toString("base64");

    const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
        {
            stdio: ["ignore", "ignore", "pipe"],
            windowsHide: true,
            env: { ...process.env, VSSOUND_PATH: resolved, VSSOUND_VOL: String(volumePercent) },
        },
    );

    let errBuf = "";
    child.stderr?.on("data", (d) => {
        errBuf += String(d);
    });

    child.on("error", (err) => {
        logPlaySoundFailure(`MCI PowerShell failed to start: ${err.message}`);
    });

    child.on("close", (code) => {
        if (code !== 0 && code !== null) {
            logPlaySoundFailure(`MCI playback failed (exit ${code}): ${errBuf.trim() || "see Output"}`);
        }
    });
}

/** ffmpeg’s minimal player; good volume control across formats. */
function playFfplay(resolved: string, volumePercent: number): boolean {
    const bin = whichExecutable("ffplay");
    if (!bin) {
        return false;
    }
    runSpawn("ffplay", bin, [
        "-nodisp",
        "-autoexit",
        "-loglevel",
        "quiet",
        "-volume",
        String(volumePercent),
        resolved,
    ]);
    return true;
}

/** Alternative to ffplay; similar volume flag. */
function playMpv(resolved: string, volumePercent: number): boolean {
    const bin = whichExecutable("mpv");
    if (!bin) {
        return false;
    }
    runSpawn("mpv", bin, [`--volume=${volumePercent}`, "--no-video", "--really-quiet", "--no-terminal", resolved]);
    return true;
}

/** Last-resort on Linux: WAV only, no volume slider in this extension. */
function playLinuxPulseOrAlsa(resolved: string): boolean {
    const ext = extname(resolved).toLowerCase();
    if (ext !== ".wav") {
        return false;
    }
    const paplay = whichExecutable("paplay");
    if (paplay) {
        runSpawn("paplay", paplay, [resolved]);
        return true;
    }
    const aplay = whichExecutable("aplay");
    if (aplay) {
        runSpawn("aplay", aplay, [resolved]);
        return true;
    }
    return false;
}

/** Prefer ffplay/mpv for volume; fall back to WAV-only paplay/aplay. */
function playLinuxLike(resolved: string, volumePercent: number): void {
    if (playFfplay(resolved, volumePercent)) {
        return;
    }
    if (playMpv(resolved, volumePercent)) {
        return;
    }
    if (playLinuxPulseOrAlsa(resolved)) {
        return;
    }
    logPlaySoundFailure(
        `No player found for "${resolved}". Install ffmpeg (ffplay) or mpv, or use a .wav with paplay/aplay.`,
    );
}

/** Entry: honor volume 0 = skip; resolve path; branch on `process.platform`. */
export function playSound(filePath: string): void {
    const volumePercent = getVolumePercent();
    if (volumePercent <= 0) {
        return;
    }

    const resolved = resolveSoundPath(filePath);
    if (!existsSync(resolved)) {
        logPlaySoundFailure(`File not found: ${resolved} (from settings: ${filePath})`);
        return;
    }

    const platform = process.platform;

    if (platform === "darwin") {
        playDarwin(resolved, volumePercent);
        return;
    }

    if (platform === "win32") {
        if (playFfplay(resolved, volumePercent) || playMpv(resolved, volumePercent)) {
            return;
        }
        if (playWindowsSoundPlayer(resolved)) {
            return;
        }
        playWindowsMci(resolved, volumePercent);
        return;
    }

    if (platform === "linux") {
        playLinuxLike(resolved, volumePercent);
        return;
    }

    if (playFfplay(resolved, volumePercent) || playMpv(resolved, volumePercent)) {
        return;
    }
    logPlaySoundFailure(
        `Playback on "${platform}" needs ffplay or mpv on PATH. File: ${resolved}`,
    );
}
