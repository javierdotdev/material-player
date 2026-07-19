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

## Phase 3 — Extra controls � (in progress)

- [x] Shuffle mode (random next / auto-advance) with active-state glow
- [ ] Repeat mode (one / all) — note: "repeat all" is implicit (next wraps around)
- [x] Favorite (heart) toggle with `localStorage` persistence
- [ ] Menu / options buttons behavior (deferred — no clear UX yet)
- [x] Mute toggle (press `m`) + remember last volume, with a dynamic volume icon

## Phase 4 — Quality & tooling 🔮 (planned)

- [ ] Accessibility: real `<button>` semantics, `aria-label`s, keyboard focus
- [ ] Graceful error handling for failed audio loads
- [ ] Responsive / mobile layout review
- [ ] Optional: real npm build to automate `index.pug → index.html` and `scss → css`
- [ ] Keep README in sync with implemented features

## Future ideas 💡

- [ ] External URLs / streaming source support (currently local files only)
- [ ] Loading audio metadata (ID3 tags) automatically
- [ ] Waveform or richer progress visualization

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-19 | Phase 0 (repo hygiene) and Phase 1 (single-track functional player) completed. |
| 2026-07-19 | Phase 1 polish: smoothed volume (`.level`) and progress (`.complete`) width transitions. |
| 2026-07-19 | Phase 2 (playlist) completed: 3-track playlist, previous/next, auto-advance, per-track SVG covers with crossfade, slide-up playlist panel. |
| 2026-07-19 | Phase 3 (partial): shuffle with active glow, favorite (heart) persisted in localStorage, mute (`m` key) + persisted volume with dynamic volume icon. |
| 2026-07-19 | Regenerated the 3 samples as longer (~18-20s), distinct, richer melodies; added an `audio` error handler for diagnostics. |
