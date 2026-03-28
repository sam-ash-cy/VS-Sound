# VS Sound — manual test plan

Run every section in the **Extension Development Host** after `bun run build` and **F5**. Use **View → Output → VS Sound** to confirm logs (event play/skip, cooldown lines, player backend).

**Prerequisites for sound checks:** valid audio paths (panel **Choose file…** or settings), and a working player on the OS (e.g. Windows MCI / ffplay; macOS `afplay`).

### Extension Development Host + tasks

The test tasks live in the repo root **[`.vscode/tasks.json`](../.vscode/tasks.json)** — not under `tests/`. They run `tests/scripts/exit-ok.js` and `exit-fail.js` using **`${workspaceFolder}`**, so that variable must be the **VS-Sound repo root** (the folder that contains both `.vscode/` and `tests/`).

After **F5**, the new window often has **no folder open**. Then **Run Task** will not use those tasks correctly. In the Extension Development Host window: **File → Open Folder…** and choose the **VS-Sound** project folder. Then **Terminal → Run Task…** → pick **VS Sound: test task (success)** or **(failure)**.

You do **not** need a `tasks.json` inside `tests/`; the scripts are just files the root tasks point at.

---

## 1. Master switch (`vssound.enabled`)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Turn **Enable VS Sound** **off** in the panel. | |
| 1.2 | **Preview** any row. | Warning: VS Sound disabled; **no** playback. |
| 1.3 | Command Palette → **VS Sound: Play Test Sound**. | Warning: disabled; **no** playback. |
| 1.4 | Run **VS Sound: test task (success)** (if tasks + paths on). | **No** automatic sound (events respect master switch). |
| 1.5 | Turn **Enable VS Sound** **on** again. | Preview / test / tasks work again when other gates pass. |

---

## 2. Feature toggles

Assume **VS Sound** is **on** and paths are set.

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Turn **Sounds on errors (diagnostics)** **off**. Open `fixtures/diagnostic-error.ts` as active tab. | **No** error sound. |
| 2.2 | **Preview** on the **Errors** row. | Warning about diagnostics off; **no** playback. |
| 2.3 | Turn diagnostics **on** again; **Preview** Errors. | Plays (if path set). |
| 2.4 | Turn **Sounds on task finish** **off**. Run **VS Sound: test task (success)**. | **No** success sound. |
| 2.5 | **Preview** Build success / failure. | Warning about task sounds off; **no** playback. |
| 2.6 | Turn task sounds **on**; run success task again. | Success sound (if path set). |

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
| 3b.1 | **Error sounds only when errors appear** checked. Active file has a TS error; trigger many diagnostic updates (e.g. type extra characters) **without** clearing the error. | **No** new sound for each refresh; only when the file **gains** errors again after being clean. |
| 3b.2 | Same file still has errors: **tab away** to another file, then **tab straight back**. | **No** second sound (same “episode”; you were already notified for that URI until errors clear). |
| 3b.3 | After errors are **fixed** on that file, introduce a new error. | Sound plays again (new episode). |
| 3b.4 | Uncheck edge mode. Same spam edits while error persists. | May fire more often (still limited by **cooldown**). |

---

## 4. Task sounds (build success / failure)

Uses repo [`.vscode/tasks.json`](../.vscode/tasks.json) and `tests/scripts/exit-ok.js` / `exit-fail.js`.

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | **Terminal → Run Task… → VS Sound: test task (success)** | Output: `Event play (task / build success…)`; success sound. |
| 4.2 | **VS Sound: test task (failure)** | `Event play (task / build failure…)`; failure sound. |
| 4.3 | Run the same task twice within the **build** cooldown window. | Second run: `Event skipped … cooldown` in Output; no second sound. |

---

## 5. Cooldowns (`vssound.cooldown.*`)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Set **Diagnostic errors** cooldown to **5000** ms in panel; **Save cooldowns**. | |
| 5.2 | Trigger error sound on active file; trigger again within 5 s. | Second trigger skipped; log shows remaining ms. |
| 5.3 | Set a cooldown to **0** (or use settings). | No throttle for that kind; repeated events may sound each time (subject to debounce for diagnostics). |

### Volume (`vssound.volumePercent`)

| Step | Action | Expected |
|------|--------|----------|
| V.1 | Set **Volume** to **0**, **Save volume**, then **Preview**. | Output: volume 0 skips playback; no audio. |
| V.2 | Set to **40**, save, **Preview** with `ffplay`/`mpv`/`afplay`/MCI. | Noticeably quieter than 100%. |
| V.3 | **WAV** via PowerShell on Windows at &lt; 100%. | Output may note volume not applied for that path. |

---

## 6. Panel persistence

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Change toggles, paths, cooldowns; close panel; reopen from status bar. | State matches settings (refreshed from configuration). |
| 6.2 | Change **VS Sound** settings in Settings UI while panel open. | Panel updates when config changes (if still subscribed). |

---

## 7. Copying `tests/` to another repo

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Copy the **entire** `tests/` folder (keep `tsconfig.json` at `tests/` root only). | |
| 7.2 | Do **not** add `tsconfig.json` under `tests/scripts/`. | `include: ["fixtures/**/*.ts"]` must be relative to `tests/`, not `scripts/`. |
| 7.3 | Open `tests/fixtures/diagnostic-error.ts` in **that** workspace. | TypeScript project picks up `tests/tsconfig.json`; diagnostics appear; scope rules in §3 apply. |

---

## 8. Regression quick pass (before release)

- [ ] `bun run build` succeeds  
- [ ] F5: extension activates; status bar opens panel  
- [ ] §1 master switch  
- [ ] §2 feature toggles + preview alignment  
- [ ] §3 active-file diagnostics  
- [ ] §4 tasks + §5 cooldown logs  
- [ ] `npm run package` (optional): install `.vsix` in a clean profile  

---

## Fixture reference

| Asset | Role |
|-------|------|
| `fixtures/diagnostic-error.ts` | Intentional TS error for §2–§3 |
| `scripts/exit-ok.js` | Task exit code 0 |
| `scripts/exit-fail.js` | Task exit code 1 |
| `tsconfig.json` | Includes `fixtures/**/*.ts` only |
