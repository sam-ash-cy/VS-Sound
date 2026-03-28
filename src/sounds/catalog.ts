/** Single source of truth for sound kinds, UI labels, and file-picker filters. */
export const SOUND_SLOTS = [
    { kind: "test", label: "Test", placeholder: "Path or Choose file…" },
    {
        kind: "terminal",
        label: "Terminal (reserved)",
        placeholder: "No terminal stream API yet",
    },
    { kind: "error", label: "Errors", placeholder: "Path or Choose file…" },
    { kind: "buildFailure", label: "Build failure", placeholder: "Path or Choose file…" },
    { kind: "buildSuccess", label: "Build success", placeholder: "Path or Choose file…" },
] as const;

export type SoundKind = (typeof SOUND_SLOTS)[number]["kind"];

export const SOUND_KINDS: SoundKind[] = SOUND_SLOTS.map((s) => s.kind);

export const AUDIO_FILE_DIALOG_FILTERS = {
    Audio: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "aiff", "caf", "opus"],
};
