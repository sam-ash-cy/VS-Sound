# VS Sound

**VS Sound** adds optional audio feedback to Visual Studio Code: hear when diagnostics report errors, when tasks finish, when you save, when debug sessions start or end, when terminals open or exit, and for common Git workspace events. Assign your own audio files, tune volume, and use per-feature cooldowns so sounds stay useful—not noisy.

> **Building or contributing?** Clone and workflow docs live in [DEVELOPMENT.md](https://github.com/sam-ash-cy/VS-Sound/blob/main/DEVELOPMENT.md) on GitHub.

## Install

Install **VS Sound** from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/). Requires **VS Code 1.85** or newer.

## Quick start

1. Open the **Command Palette** and run **VS Sound: Open Panel**, or open **Settings** and search for `vssound`.
2. Turn **Enable VS Sound** on and enable the **features** you care about.
3. Use **Choose file…** (in the panel) or set paths under **Settings → VS Sound** for each sound slot you use.
4. Use **Preview** on a row or **Play test sound** to verify playback.

## What you can hook up

| Area | What triggers sound |
|------|---------------------|
| **Diagnostics** | Errors in the **active editor** (workspace files only). Optional **edge mode** reduces repeats while errors stay; still plays when error **count** goes up or you switch to a file that newly shows errors. |
| **Tasks** | Integrated terminal tasks exit **success** (code 0) or **failure** (non-zero). |
| **Save** | Active document **saved** (e.g. Ctrl+S). |
| **Debug** | Debug session **starts** or **ends**. |
| **Terminal** | Terminal **created**; shell **exits** (success vs failure). |
| **Git** | `.git/HEAD` changes (commit, checkout, etc.); **fetch/pull** updates `FETCH_HEAD`; **merge** in progress (`MERGE_HEAD`). |

## Commands

- **VS Sound: Open Panel** — settings UI for toggles, paths, volume, cooldowns, and previews.
- **VS Sound: Play Test Sound** — plays the **Test** sound slot (same as the panel’s test button).

## Settings (overview)

All settings are under the **`vssound`** prefix.

- **`vssound.enabled`** — master on/off.
- **`vssound.features.*`** — turn **diagnostics**, **tasks**, **save**, **debug**, **terminal**, and **git** on or off.
- **`vssound.diagnostics.edgeTriggerOnly`** — when on (default), avoids spamming error sounds on every diagnostic refresh; still fires on meaningful changes (see table above).
- **`vssound.sounds.*`** — file path per event (errors, build success/failure, save, debug start/end, terminal open/exit, Git commit/pull/merge conflict, **test**).
- **`vssound.volumePercent`** — **0–100**; **0** skips playback where supported. Some players ignore volume for certain formats.
- **`vssound.cooldown.*Ms`** — minimum milliseconds between sounds per category (errors, task success/failure, terminal, save, debug, Git). **0** means no cooldown for that category.

For defaults and full descriptions, open **Settings** and search `vssound`, or see the extension’s **Feature Contributions** on the Marketplace.

## Requirements on your machine

VS Code does not play audio by itself. The extension runs a **system player** for your files, depending on OS and what is installed—for example **afplay** on macOS, **ffplay** / **mpv** on Windows or Linux, or Windows **MCI** / PowerShell for some formats. If nothing suitable is available, sounds will not play; check **View → Output** and select **VS Sound** for error messages.

## Troubleshooting

- **No sound** — Confirm **VS Sound** is enabled, the feature is on, the file path exists, and a player works for that format on your OS. Try **Play test sound** after setting the **Test** path.
- **Too many sounds** — Tighten **cooldowns**, turn on **error edge mode**, or disable features you do not need.

## Links

- **Source code:** [github.com/sam-ash-cy/VS-Sound](https://github.com/sam-ash-cy/VS-Sound)
- **Issues:** [github.com/sam-ash-cy/VS-Sound/issues](https://github.com/sam-ash-cy/VS-Sound/issues)
