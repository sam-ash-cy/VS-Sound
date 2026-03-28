# VS Sound — development

This document is for **contributors and maintainers**. End-user overview lives in [README.md](README.md) (also used as the Marketplace listing).

## Prerequisites

- [VS Code](https://code.visualstudio.com/) **1.85+**
- [Bun](https://bun.sh/) (build script), or adapt `package.json` → `scripts.build` to another bundler
- Dev dependencies: `bun install` (or npm equivalent)

## Clone → install → build

```bash
git clone https://github.com/sam-ash-cy/VS-Sound.git
cd VS-Sound
bun install
bun run build
```

Optional typecheck:

```bash
bun run typecheck
```

## Run and debug (F5)

1. Open the repo folder in VS Code.
2. **Run and Debug** → **Launch Extension** (or **F5**). An **Extension Development Host** window opens.
3. For tasks that use `${workspaceFolder}`, use **File → Open Folder…** and select the **VS-Sound** root (so `.vscode/tasks.json` resolves correctly).
4. **VS Sound: Open Panel** from the Command Palette to exercise the webview and settings.

## Daily workflow

| Command | Purpose |
|---------|---------|
| `bun run watch` | Rebuild `dist/extension.js` on changes |
| `bun run build` | One-off production bundle |
| `bun run package` | Produce a `.vsix` via local `@vscode/vsce` |

### Packaging and publishing

- Use **`bun run package`** / **`bun run publish`**—they invoke **`bunx vsce`** with **`--no-dependencies`** so `vsce` does not run `npm list` on a Bun-installed `node_modules` tree (that often fails with extraneous/invalid packages).
- Manual pack: `bunx vsce package --no-dependencies`
- `package.json` → **`publisher`** must match your [Marketplace publisher id](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher) exactly (including casing), not your display name.

Install a local `.vsix`: **Extensions** → **…** → **Install from VSIX…**

## Manual QA

See **[tests/TEST-PLAN.md](tests/TEST-PLAN.md)** for a step-by-step checklist (Extension Development Host, diagnostics, tasks, save, debug, terminal, Git, panel).

Test tasks are defined in **[`.vscode/tasks.json`](.vscode/tasks.json)** and call scripts under `tests/scripts/`.

## Project layout (high level)

- **`src/extension.ts`** — activation and wiring
- **`src/ui/dashboard/`** — webview panel (HTML, messages, script)
- **`src/config.ts`** — settings and validation
- **`dist/extension.js`** — bundled output shipped in the `.vsix` (run `bun run build` before packaging)

## License

MIT — see [LICENSE](LICENSE).
