# material-player

A static, single-screen **Material Design music player** — originally a CodePen UI demo,
now wired up to real playback. It plays a bundled **playlist** with working **play/pause,
previous/next, seek, volume, mute and elapsed-time** controls, per-track cover art with a
crossfade, and a slide-up playlist panel — all built on the HTML5 `<audio>` API.

> **Status:** Phases 1–3 are functional — single track, playlist, and extra controls
> (shuffle, repeat, favorites, mute). See the [roadmap](ROADMAP.md) for the full
> progress tracker.

Live pen (original UI): <https://codepen.io/javierski/pen/xzXyap>

## What it looks like

A 500×320 card with cover art, song/artist/time labels, playback controls
(previous / pause / next), a volume slider, playlist and shuffle buttons, and an
animated progress track.

## Base technology

This project has **no build tooling committed** (no `package.json`, no bundler, no tests).
It is plain front-end code that originated on CodePen, so it ships both the authored
sources and their pre-compiled output:

| Source (authored) | Compiled output (loaded by the browser) | Tool |
|-------------------|------------------------------------------|------|
| [index.pug](index.pug) | [index.html](index.html) | [Pug](https://pugjs.org/) (HTML templating) |
| [scss/style.scss](scss/style.scss) | [css/style.css](css/style.css) | [Sass](https://sass-lang.com/) + [Bourbon 4.x](https://www.bourbon.io/) |

Runtime assets are **vendored locally** under [vendor/](vendor) (no CDN, no npm),
so the demo works fully offline:

- **Font Awesome 4.2.0** (`vendor/font-awesome/`) — icons via classes like `fa fa-play`,
  with its web fonts in `vendor/font-awesome/fonts/`.
- **normalize.css 5.0.0** (`vendor/normalize/`) — cross-browser style reset.

Playback logic lives in dependency-free, modern JavaScript in
[js/index.js](js/index.js) (no jQuery). Audio is a set of short, license-free samples in
[audio/](audio) with matching local SVG covers in [images/](images) — edit the
`playlist` array at the top of `js/index.js` to use your own files.

### What is the `.pug` file?

[Pug](https://pugjs.org/) (formerly *Jade*) is an HTML templating language that uses
indentation instead of angle brackets, so markup is shorter and cleaner.
[index.pug](index.pug) is the **source** of the page; [index.html](index.html) is the
**compiled result** that browsers actually load. Because no build script is committed,
editing the `.pug` means you must also update the `.html` by hand so both stay in sync.

## Running it

Open [index.html](index.html) directly in a browser, or serve the folder with any
static server. There is no dev server or watch task.

Controls:

- **Play / pause** — click the center button, or press **Space**.
- **Previous / next** — skip tracks; Previous restarts the current track if more than
  3 seconds have elapsed.
- **Shuffle** — the bottom-right pink circle toggles random playback (glows when on).
- **Repeat** — the top-right options button (⋮) opens a small menu: Off / All / One.
- **Favorite** — the heart icon likes the current track (saved in `localStorage`); liked
  tracks are also flagged in the queue.
- **Seek** — click anywhere on the bottom progress track.
- **Volume** — click the volume bar to set the level; click the speaker icon (or press
  **m**) to mute/unmute. The last volume is remembered across reloads.
- **Ambient light** — the bulb icon toggles a cinematic glow around the player that
  matches each track's cover color.
- **Playlist** — the top-left menu (☰) opens the queue; click a track to play it, and
  close it with ×, Escape, or a click outside.

> **Note:** all assets (audio, Font Awesome, normalize.css, fonts) are bundled locally,
> so no network connection is required to run the demo.

### Accessibility & responsiveness

- Every control is a labelled button, operable by keyboard (Tab, then Enter/Space),
  with a visible focus outline; toggles expose `aria-pressed` and there is an
  `aria-live` region for load errors.
- The card scales down on small screens (a `viewport` meta tag is included).

## Development notes

- **Keep sources and compiled output in sync.** There is no build script, so after
  editing `index.pug` or `scss/style.scss` you must regenerate `index.html` /
  `css/style.css` by hand (or with `npx pug` / `npx sass`).
- **Class names are a shared contract** between [index.html](index.html),
  [js/index.js](js/index.js), and [scss/style.scss](scss/style.scss) — e.g. `.pause`,
  `.level`, `.vol-bar`, `.complete`. Renaming a class means updating all three.
- **Keep vendor paths intact.** Font Awesome's CSS resolves its fonts via `../fonts/`,
  so `vendor/font-awesome/css/` and `vendor/font-awesome/fonts/` must stay siblings.

## Credits

- Concept / original design: **Dribbble** shot by **kerroudj**
  (<https://dribbble.com/kerroudj>).
- Based on a **CodePen** pen by **Colin Hall-Coates**
  (<https://codepen.io/Oka/pen/gbgXvd>).
- Icons by **Font Awesome**.

## License

Released under the [MIT License](LICENSE).