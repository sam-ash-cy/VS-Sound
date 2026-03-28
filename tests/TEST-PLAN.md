# VS Sound — manual test plan

Run every section in the **Extension Development Host** after `bun run build` and **F5**.

**Output channel:** **View → Output → VS Sound** only logs **failures** (missing file, player error, etc.). Successful playback and cooldown skips are **silent** there.

**Panel toasts:** Changing toggles, saving volume/paths/cooldowns, choosing a file, **Preview**, and **Play test sound** from the **VS Sound** panel should show **information** or **warning** notifications as appropriate.

**Prerequisites for sound checks:** valid audio paths (panel **Choose file…** or settings), and a working player on the OS (e.g. Windows MCI / ffplay; macOS `afplay`).

### Extension Development Host + tasks

The test tasks live in the repo root **[`.vscode/tasks.json`](../.vscode/tasks.json)** — not under `tests/`. They run `tests/scripts/exit-ok.js` and `exit-fail.js` using **`${workspaceFolder}`**, so that variable must be the **VS-Sound repo root** (the folder that contains both `.vscode/` and `tests/`).

After **F5**, the new window often has **no folder open**. Then **Run Task** will not use those tasks correctly. In the Extension Development Host window: **File → Open Folder…** and choose the **VS-Sound** project folder. Then **Terminal → Run Task…** → pick **VS Sound: test task (success)** or **(failure)**.

You do **not** need a `tasks.json` inside `tests/`; the scripts are just files the root tasks point at.

---

## 1. Master switch (`vssound.enabled`)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Turn **Enable VS Sound** **off** in the panel. | Toast: disabled (or similar). |
| 1.2 | **Preview** any row. | **Warning** toast; **no** playback. |
| 1.3 | **Play test sound** in the panel. | **Warning** toast; **no** playback. |
| 1.4 | Command Palette → **VS Sound: Play Test Sound**. | **No** toast; **no** playback when disabled. |
| 1.5 | Run **VS Sound: test task (success)** (if tasks + paths on). | **No** automatic sound (events respect master switch). |
| 1.6 | Turn **Enable VS Sound** **on** again. | Toast: enabled. Preview / test / tasks work again when other gates pass. |

---

## 2. Feature toggles

Assume **VS Sound** is **on** and paths are set where needed.

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Turn **Sounds on errors (diagnostics)** **off**. | Toast about diagnostic sounds off. |
| 2.2 | Open `fixtures/diagnostic-error.ts` as active tab. | **No** error sound. |
| 2.3 | **Preview** on the **Errors** row. | **Warning** toast; **no** playback. |
| 2.4 | Turn diagnostics **on** again; **Preview** Errors. | Toast + plays (if path set). |
| 2.5 | Turn **Sounds on task finish** **off**. | Toast. |
| 2.6 | Run **VS Sound: test task (success)**. | **No** success sound. |
| 2.7 | **Preview** Build success / failure. | **Warning** if tasks off; else toast + play. |
| 2.8 | Turn task sounds **on**; run success task again. | Success sound (if path set). |
| 2.9 | Toggle **Save**, **Debug**, **Terminal**, **Git** features off/on. | **Toast per toggle**; when **on**, set matching sound paths and verify event (save file, start/stop debug, open/close terminal, git operation in repo — see §9). |

---

## 3. Diagnostic sound scope (active file + workspace)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Open a clean file (no errors) as **active** tab. Open `diagnostic-error.ts` in a **background** tab only. | **No** error sound (errors not in **active** editor). |
| 3.2 | Click `diagnostic-error.ts` to make it **active**. | After debounce (~500 ms), error sound if diagnostics + path + cooldown allow. |
| 3.3 | Switch active tab back to a file **without** errors. | No new sound solely from switching away (unless you rely on active-editor check + cooldown edge cases). |
| 3.4 | Single-folder workspace: error only fires for `file:` URIs **inside** that folder. | Files outside workspace roots should not drive error sounds. |

### 3b. Error edge mode (`vssound.diagnostics.edgeTriggerOnly`, default **on**)

| Step | Action | Expected |
|------|--------|----------|
| 3b.1 | **Error sounds only when errors appear** checked. Active file has a TS error; trigger many diagnostic updates **without** adding/removing errors. | **No** new sound for each refresh. |
| 3b.2 | Add a **second** distinct error on the same file (error **count** increases). | Sound plays again (new error). |
| 3b.3 | Same file still has errors: **tab away** to another file, then **tab straight back**. | **No** second sound (tab-back suppression until errors clear long enough). |
| 3b.4 | After errors are **fixed** on that file, introduce a new error. | Sound plays again. |
| 3b.5 | Uncheck edge mode. Same spam edits while error persists. | May fire more often (still limited by **cooldown**). |

---

## 4. Task sounds (build success / failure)

Uses repo [`.vscode/tasks.json`](../.vscode/tasks.json) and `tests/scripts/exit-ok.js` / `exit-fail.js`.

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | **Terminal → Run Task… → VS Sound: test task (success)** | Success sound (if path set). No success line in Output unless a player fails. |
| 4.2 | **VS Sound: test task (failure)** | Failure sound (if path set). |
| 4.3 | Run the same task twice within the **build** cooldown window. | Second run: **no** second sound (cooldown; silent — no Output line). |

---

## 5. Cooldowns (`vssound.cooldown.*`)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Set **Diagnostic errors** cooldown to **5000** ms in panel; **Save cooldowns**. | Toast: cooldowns saved. |
| 5.2 | Trigger error sound on active file; trigger again within 5 s. | Second trigger skipped; **silent** (no Output info line). |
| 5.3 | Set a cooldown to **0** (or use settings). | No throttle for that kind; repeated events may sound each time (subject to debounce for diagnostics). |

### Volume (`vssound.volumePercent`)

| Step | Action | Expected |
|------|--------|----------|
| V.1 | Set **Volume** to **0**, **Save volume**, then **Preview**. | Toast; **no** audio (playback skipped). |
| V.2 | Set to **40**, save, **Preview** with `ffplay`/`mpv`/`afplay`/MCI. | Noticeably quieter than 100% where volume is supported. |
| V.3 | **WAV** via PowerShell on Windows at &lt; 100%. | Volume may not apply; playback may still work. |

---

## 6. Panel persistence

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Change toggles, paths, cooldowns; close panel; reopen from status bar. | State matches settings (refreshed from configuration). |
| 6.2 | Change **VS Sound** settings in Settings UI while panel open. | Panel updates when config changes. |

---

## 7. Copying `tests/` to another repo

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Copy the **entire** `tests/` folder (keep `tsconfig.json` at `tests/` root only). | |
| 7.2 | Do **not** add `tsconfig.json` under `tests/scripts/`. | `include: ["fixtures/**/*.ts"]` must be relative to `tests/`, not `scripts/`. |
| 7.3 | Open `tests/fixtures/diagnostic-error.ts` in **that** workspace. | TypeScript project picks up `tests/tsconfig.json`; diagnostics appear; scope rules in §3 apply. |

---

## 8. Optional: Save, Debug, Terminal, Git

Enable each feature in the panel (expect a **toast**), set the corresponding sound paths, then:

| Feature | Quick check |
|---------|-------------|
| **Save** | Save a tracked workspace file → sound (respect `saveMs` cooldown). |
| **Debug** | Start debugger → `debugStart`; stop → `debugEnd`. |
| **Terminal** | New terminal → `terminalOpen`; exit shell → success/failure sound by exit code (if `exitStatus` available). |
| **Git** | In a repo under the workspace: commit/checkout (`.git/HEAD`), fetch/pull (`.git/FETCH_HEAD`), start merge (`.git/MERGE_HEAD`). May get multiple sounds close together; tune `gitMs`. |

---

## 9. Regression quick pass (before release)

- [ ] `bun run build` succeeds  
- [ ] F5: extension activates; status bar opens panel  
- [ ] §1 master switch + panel toasts  
- [ ] §2 feature toggles + Preview warnings when off  
- [ ] §3 active-file diagnostics + §3b edge / tab-back / error count  
- [ ] §4 tasks + §5 cooldown behavior (silent skip)  
- [ ] `bun run package` (optional): install `.vsix` in a clean profile  

---

## Fixture reference

| Asset | Role |
|-------|------|
| `fixtures/diagnostic-error.ts` | Intentional TS error for §2–§3 |
| `scripts/exit-ok.js` | Task exit code 0 |
| `scripts/exit-fail.js` | Task exit code 1 |
| `tsconfig.json` | Includes `fixtures/**/*.ts` only |
