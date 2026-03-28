# VS Sound

VS Code extension that plays audio for diagnostics, tasks, save, debug, terminal, Git events, and more. Configure everything from the **VS Sound** panel or `vssound.*` settings.

## Requirements

- [VS Code](https://code.visualstudio.com/) **1.85+**
- [Bun](https://bun.sh/) (used for the build script), or adapt the `build` script to use another bundler
- Node-style dev dependencies (install with Bun or npm below)
- A system audio player the extension can spawn (e.g. **afplay** on macOS, **ffplay** / **mpv** on Windows/Linux, or Windows **MCI** / PowerShell for some formats)

## From scratch: clone → run → debug

1. **Clone** this repository and open the folder in VS Code.
2. **Install dev dependencies**:
  ```bash
   bun install
  ```
3. **Build** the extension entrypoint:
  ```bash
   bun run build
  ```

4. **Typecheck** (optional):
  ```bash
   bun run typecheck
  ```
5. **Run the extension**
  Open **Run and Debug**, choose **Launch Extension** (or press **F5**). A new *Extension Development Host* window opens with VS Sound loaded.
6. **Open a workspace folder** in that window
  For tasks and `${workspaceFolder}` in `.vscode/tasks.json`, use **File → Open Folder…** and select the **VS-Sound** repo root (or your test project).
7. **Open the panel**
  Run **VS Sound: Open Panel** from the Command Palette.
8. **Set paths and toggles**
  Use **Choose file…** for each sound you care about, turn features on/off, adjust volume and cooldowns, then **Save paths** / **Save volume** / **Save cooldowns** as needed.
9. **Try sounds**
  Use **Preview** on a row, or **Play test sound** for the Test slot. Use **VS Sound: Play Test Sound** from the palette for the same test.

## Daily development

- **Watch build**: `bun run watch`
- **Package a `.vsix`**: `bun run package` (runs local `@vscode/vsce` via `bunx`; no global `vsce` install). If you call vsce yourself, use **`bunx vsce package --no-dependencies`**: a plain `bunx vsce package` runs `npm list`, which fails on trees installed with Bun. `package.json` → `publisher` must match your [Marketplace publisher id](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher) **exactly** (including casing; no spaces)—not your public display name.

Install a `.vsix` in VS Code: **Extensions** → **…** → **Install from VSIX…**

## Configuration

All keys live under `**vssound`** in Settings. The panel mirrors:

- **Master**: `vssound.enabled`
- **Features**: `vssound.features.diagnostics`, `.tasks`, `.save`, `.debug`, `.terminal`, `.git`
- **Diagnostics**: `vssound.diagnostics.edgeTriggerOnly` (avoid spamming while errors stay; still plays when error **count** increases)
- **Sounds**: `vssound.sounds.<kind>` (file paths)
- **Cooldowns**: `vssound.cooldown.*Ms`
- **Volume**: `vssound.volumePercent` (0–100; 0 skips playback where supported)

See `package.json` → `contributes.configuration` for defaults and descriptions.

## Manual QA (Helpful)

See **[tests/TEST-PLAN.md](tests/TEST-PLAN.md)** for a step-by-step checklist (Extension Development Host, tasks, diagnostics, new features).

