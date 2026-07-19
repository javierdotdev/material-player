# material-player

A static, single-screen **Material Design music player** — originally a CodePen UI demo,
now wired up to real playback. It plays a bundled **playlist** with working **play/pause,
previous/next, seek, volume, mute and elapsed-time** controls, per-track cover art with a
crossfade, a slide-up playlist panel, **drag & drop for local audio files**, and
**Media Session** integration (lock-screen / hardware media keys) — all built on the
HTML5 `<audio>` API.

> **Status:** Phases 1–4 are functional — single track, playlist, extra controls
> (shuffle, repeat, favorites, mute) and quality/tooling. See the [roadmap](ROADMAP.md)
> for the full progress tracker.

Live pen (original UI): <https://codepen.io/javierski/pen/xzXyap>

## What it looks like

A 500×320 card with cover art, song/artist/time labels, playback controls
(previous / pause / next), a volume slider, playlist and shuffle buttons, and an
animated progress track with a seek thumb. The card follows the OS
**light / dark color scheme**.

## Base technology

Plain front-end code with a **minimal npm build** for styles only:

| Source (authored) | Compiled output (loaded by the browser) | Tool |
| ----------------- | --------------------------------------- | ---- |
| [scss/style.scss](scss/style.scss) | [css/style.css](css/style.css) | [Sass](https://sass-lang.com/) (`npm run build:css`) |

[index.html](index.html) is now the **single source of truth** for markup (the old
`index.pug` source was removed to avoid keeping two files in sync by hand), and the
Bourbon mixin library was dropped in favor of plain modern CSS.

Runtime assets are **vendored locally** under [vendor/](vendor) (no CDN), so the demo
works fully offline:

- **Font Awesome 4.2.0** (`vendor/font-awesome/`) — icons via classes like `fa fa-play`,
  with its web fonts in `vendor/font-awesome/fonts/`.
- **normalize.css 5.0.0** (`vendor/normalize/`) — cross-browser style reset.

Playback logic lives in dependency-free, modern JavaScript in [js/index.js](js/index.js)
(no jQuery). Audio is a set of short, license-free **MP3** samples in [audio/](audio)
with matching local SVG covers in [images/](images) — edit the `playlist` array at the
top of `js/index.js` to use your own files, or just **drag & drop audio files onto the
player**.

## Running it

Open [index.html](index.html) directly in a browser, or serve the folder with any
static server (`npm run serve`).

To rebuild the CSS after editing the SCSS:

```bash
npm install
npm run build:css   # or: npm run watch:css
```

Controls:

- **Play / pause** — click the center button, or press **Space**.
- **Previous / next** — skip tracks; Previous restarts the current track if more than
  3 seconds have elapsed.
- **Seek** — click **or drag** the bottom progress track (a thumb appears on hover),
  or press **← / →** (±5 s). The bar is a keyboard-operable slider (Tab + arrows).
- **Volume** — click or drag the volume bar, or press **↑ / ↓**; click the speaker icon
  (or press **m**) to mute/unmute. The last volume is remembered across reloads.
- **Shuffle** — the bottom-right pink circle toggles random playback (glows when on).
  Shuffle uses a **Fisher-Yates queue**, so every track plays exactly once per pass,
  and playback stops after a full pass when repeat is off.
- **Repeat** — the top-right options button (⋮) opens a small menu: Off / All / One.
- **Favorite** — the heart icon likes the current track (saved in `localStorage` by a
  stable track `id`); liked tracks are also flagged in the queue.
- **Ambient light** — the bulb icon toggles a cinematic glow around the player. The glow
  color is **extracted automatically from each cover** (average dominant color), with a
  per-track fallback.
- **Playlist** — the top-left menu (☰) opens the queue; click a track to play it, and
  close it with ×, Escape, or a click outside.
- **Add your own music** — drag & drop audio files anywhere on the player; they're
  appended to the queue and start playing (loaded via `URL.createObjectURL`, nothing is
  uploaded anywhere).
- **Media keys / lock screen** — play/pause, previous/next and seeking work from
  hardware media keys and the OS media UI via the **Media Session API**.

Shuffle, repeat, volume, favorites and the ambient toggle all **persist across reloads**.

> **Note:** all assets (audio, Font Awesome, normalize.css, fonts) are bundled locally,
> so no network connection is required to run the demo.

### Accessibility & responsiveness

- Every control is a real, labelled `<button>`, operable by keyboard, with a visible
  focus outline; toggles expose `aria-pressed`, the repeat menu uses
  `role="menuitemradio"`, and there is an `aria-live` region for load errors.
- Seek and volume are proper `role="slider"` controls with `aria-valuenow`
  (plus `aria-valuetext` on seek) and arrow-key support.
- The card scales down on small screens and follows `prefers-color-scheme` for
  light/dark theming.

## Development notes

- **Markup is edited directly in `index.html`** — there is no template layer anymore.
- **Styles are authored in `scss/style.scss`** and compiled with `npm run build:css`;
  commit the regenerated `css/style.css` together with SCSS changes.
- **Class names are a shared contract** between [index.html](index.html),
  [js/index.js](js/index.js), and [scss/style.scss](scss/style.scss) — e.g. `.pause`,
  `.level`, `.vol-bar`, `.complete`. Renaming a class means updating all three.
- **Theme colors live in CSS custom properties** (`--surface`, `--text`, `--accent`, …)
  on `.player`; the dark variant only swaps variables.
- **Keep vendor paths intact.** Font Awesome's CSS resolves its fonts via `../fonts/`,
  so `vendor/font-awesome/css/` and `vendor/font-awesome/fonts/` must stay siblings.

## Credits

- Concept / original design: **Dribbble** shot by **kerroudj** (<https://dribbble.com/kerroudj>).
- Based on a **CodePen** pen by **Colin Hall-Coates** (<https://codepen.io/Oka/pen/gbgXvd>).
- Icons by **Font Awesome**.

## License

Released under the [MIT License](LICENSE).
