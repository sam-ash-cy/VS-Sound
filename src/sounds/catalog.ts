/** Single source of truth for sound kinds, UI labels, and file-picker filters. */
export const SOUND_SLOTS = [
    { kind: "test", label: "Test", placeholder: "Path or Choose file…" },
    { kind: "error", label: "Errors", placeholder: "Path or Choose file…" },
    { kind: "buildSuccess", label: "Build success", placeholder: "Path or Choose file…" },
    { kind: "buildFailure", label: "Build failure", placeholder: "Path or Choose file…" },
    { kind: "save", label: "Save (active file)", placeholder: "Path or Choose file…" },
    { kind: "debugStart", label: "Debug session started", placeholder: "Path or Choose file…" },
    { kind: "debugEnd", label: "Debug session ended", placeholder: "Path or Choose file…" },
    { kind: "terminalOpen", label: "Terminal opened", placeholder: "Path or Choose file…" },
    { kind: "terminalExitSuccess", label: "Terminal closed (exit 0)", placeholder: "Path or Choose file…" },
    { kind: "terminalExitFailure", label: "Terminal closed (non-zero exit)", placeholder: "Path or Choose file…" },
    {
        kind: "gitCommit",
        label: "Git HEAD changed",
        placeholder: "Commit, checkout, merge, etc.",
    },
    {
        kind: "gitPull",
        label: "Git fetch / pull (FETCH_HEAD)",
        placeholder: "Path or Choose file…",
    },
    {
        kind: "gitMergeConflict",
        label: "Git merge started (MERGE_HEAD)",
        placeholder: "Path or Choose file…",
    },
] as const;

export type SoundKind = (typeof SOUND_SLOTS)[number]["kind"];

export const SOUND_KINDS: SoundKind[] = SOUND_SLOTS.map((s) => s.kind);

export const AUDIO_FILE_DIALOG_FILTERS = {
    Audio: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "aiff", "caf", "opus"],
};
