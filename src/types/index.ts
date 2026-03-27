export type SoundKind =
    | "terminal"
    | "error"
    | "buildFailure"
    | "buildSuccess"
    | "test";

export type SoundEvent = {
    kind: SoundKind;
    meta?: string;
};
