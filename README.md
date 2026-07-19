# material-player

A static, single-screen **Material Design music-player UI demo** — a CodePen export.
It is **not** a functional player: there is no real audio. Play/pause, volume and the
track progress bar are simulated in the browser with jQuery and a small `Ticker` script.

Live pen: <https://codepen.io/javierski/pen/xzXyap>

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

Runtime dependencies are **vendored locally** under [vendor/](vendor) (no CDN, no npm),
so the demo works fully offline:

- **jQuery 2.1.3** (`vendor/jquery/`) — DOM handling and click events in [js/index.js](js/index.js).
- **Font Awesome 4.2.0** (`vendor/font-awesome/`) — icons via classes like `fa fa-play`,
  with its web fonts in `vendor/font-awesome/fonts/`.
- **normalize.css 5.0.0** (`vendor/normalize/`) — cross-browser style reset.

The progress animation is handled by a small **local** helper,
[js/ticker.js](js/ticker.js), which exposes a global `Ticker` and animates the
`.complete` track. It replaces the original external CodePen script, so the project
has no runtime dependency on CodePen either.

### What is the `.pug` file?

[Pug](https://pugjs.org/) (formerly *Jade*) is an HTML templating language that uses
indentation instead of angle brackets, so markup is shorter and cleaner.
[index.pug](index.pug) is the **source** of the page; [index.html](index.html) is the
**compiled result** that browsers actually load. Because no build script is committed,
editing the `.pug` means you must also update the `.html` by hand so both stay in sync.

## Running it

Open [index.html](index.html) directly in a browser, or serve the folder with any
static server. There is no dev server or watch task.

> **Note:** all assets (jQuery, Font Awesome, normalize.css, fonts) are bundled in
> [vendor/](vendor), so no network connection is required to run the demo.

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