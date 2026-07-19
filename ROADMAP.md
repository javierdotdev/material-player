# Roadmap & progress tracker

Tracking document for `material-player`. Use the checkboxes to follow what is **done**
vs. **planned**. Update this file whenever a task changes state.

Legend: `[x]` done · `[~]` in progress · `[ ]` pending

---

## Phase 0 — Base repository hygiene ✅ (done)

- [x] Consolidate documentation into a single [README.md](README.md)
- [x] Add a `.gitignore` for a static front-end project
- [x] Remove redundant files (`README.txt`, `license.txt`, `AGENTS.md`, `.github/` AI files)
- [x] Remove CodePen runtime dependency (replace external `Ticker` script)
- [x] Vendor external assets locally (Font Awesome, normalize.css) — offline-ready

## Phase 1 — Functional player, single track ✅ (done)

- [x] Add a local, license-free audio sample ([audio/sample.wav](audio/sample.wav))
- [x] Rewrite player as dependency-free modern JS (drop jQuery) in [js/index.js](js/index.js)
- [x] Real play / pause on the HTML5 `<audio>` API (+ Space key)
- [x] Progress bar bound to `timeupdate` and click-to-seek on the track
- [x] Real volume control (bar + −/+ buttons) mapped to `audio.volume`
- [x] Elapsed / total time display (`0:00 / 0:07`)
- [x] Verify playback in a browser

## Phase 2 — Playlist ✅ (done)

- [x] Define a track data model (`title`, `artist`, `cover`, `src`)
- [x] Support multiple tracks and a "current track" index
- [x] Wire **Previous** / **Next** buttons (Previous restarts if > 3s, else prior track)
- [x] Auto-advance to the next track on `ended`
- [x] Update cover art / song / artist per track (with a crossfade)
- [x] Render a playlist UI toggled by the playlist button
- [x] Add a few more license-free sample tracks
- [x] Replace the remaining external image (imgur) with local SVG covers

## Phase 3 — Extra controls ✅ (done)

- [x] Shuffle mode (random next / auto-advance) with active-state glow
- [x] Repeat mode (off / all / one) via the options button, respected on auto-advance
- [x] Favorite (heart) toggle with `localStorage` persistence
- [x] Menu button (☰) toggles the playlist/queue panel
- [x] Mute toggle (press `m`) + remember last volume, with a dynamic volume icon

## Phase 4 — Quality & tooling ✅ (done)

- [x] Accessibility: button roles, `aria-label`/`aria-pressed`, keyboard operation, focus outline
- [x] Graceful error handling for failed audio loads (visible toast with `aria-live`)
- [x] Responsive / mobile layout (viewport meta + scaled card on small screens)
- [x] Real npm build for `scss → css` (`npm run build:css` / `watch:css`); `index.pug` removed so `index.html` is the single markup source
- [x] Keep README in sync with implemented features

## Phase 5 — Polish & platform features ✅ (done)

- [x] Semantic markup: every control is a real `<button>` (removed JS role/tabindex/key shims)
- [x] Seek & volume as accessible sliders: drag (Pointer Events), arrow keys, `aria-valuenow`, visible seek thumb on hover
- [x] True shuffle: Fisher-Yates queue, no repeats within a pass; respects repeat=off (stops after a full pass)
- [x] Persist shuffle & repeat (volume/favorites/ambient already persisted)
- [x] Stable track `id` in the data model; favorites keyed by id instead of file path
- [x] Media Session API: lock-screen / hardware media keys (play, pause, prev, next, seek) + metadata with cover
- [x] Global keyboard shortcuts: ← / → seek ±5 s, ↑ / ↓ volume
- [x] Ambient glow color extracted automatically from the cover (canvas average) with per-track fallback
- [x] Drag & drop local audio files onto the player (File API + object URLs) with a drop overlay and default cover
- [x] Dark mode via `prefers-color-scheme` (CSS custom properties theme)
- [x] Audio samples converted WAV → MP3 (~2.4 MB → ~103 KB)
- [x] Bourbon removed; plain modern CSS (position/transition) with theme variables

## Future ideas 💡

- [ ] External URLs / streaming source support (currently local files only)
- [ ] Loading audio metadata (ID3 tags) automatically — would give dropped files real titles/artists/covers
- [ ] Waveform or richer progress visualization
- [ ] Replace Font Awesome 4.2 with a small set of inline SVG icons (~560 KB vendor savings)
- [ ] Unit tests for the pure logic (time formatting, shuffle queue, repeat/ended rules)

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Phase 0 (repo hygiene) and Phase 1 (single-track functional player) completed. |
| 2026-07-19 | Phase 1 polish: smoothed volume (`.level`) and progress (`.complete`) width transitions. |
| 2026-07-19 | Phase 2 (playlist) completed: 3-track playlist, previous/next, auto-advance, per-track SVG covers with crossfade, slide-up playlist panel. |
| 2026-07-19 | Phase 3 (partial): shuffle with active glow, favorite (heart) persisted in localStorage, mute (`m` key) + persisted volume with dynamic volume icon. |
| 2026-07-19 | Regenerated the 3 samples as longer (~18-20s), distinct, richer melodies; added an `audio` error handler for diagnostics. |
| 2026-07-19 | Phase 3 completed: options button cycles repeat (off/all/one) with a '1' badge; menu button toggles the playlist/queue. |
| 2026-07-19 | UX: playlist panel now has a header + close (×), and closes on outside/empty click or Escape; options button opens a floating repeat menu instead of cycling directly. |
| 2026-07-19 | Favorites are now shown per-track in the queue (heart indicator), clarifying that favorites are saved per song regardless of the current shuffle track. |
| 2026-07-19 | Volume uses a single dynamic icon (click to mute); options menu is now a floating list (icon + short label); added a per-track cinematic glow around the player with an ambient-light toggle (former bottom hamburger). |
| 2026-07-19 | Enlarged the ambient-light button and added hover tooltips (title) to every control, with dynamic labels for stateful ones (mute, favorite, shuffle, repeat, ambient). |
| 2026-07-19 | Phase 4: keyboard operability + roles/aria for all controls, visible error toast (aria-live), responsive scaling with viewport meta. |
| 2026-07-19 | Phase 4 closed + Phase 5: npm build for Sass (Pug & Bourbon removed, `index.html` is the single markup source); real `<button>` controls; drag/keyboard sliders for seek & volume with a hover thumb; Fisher-Yates shuffle that respects repeat=off; shuffle/repeat persisted; favorites keyed by track `id`; Media Session API; ← → ↑ ↓ shortcuts; glow auto-extracted from covers; drag & drop local audio files; dark mode (`prefers-color-scheme`); samples converted WAV → MP3 (2.4 MB → 103 KB). |
