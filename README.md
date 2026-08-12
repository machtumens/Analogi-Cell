# A cell works like a space station

A full-screen slide deck comparing an animal cell and the International Space
Station — ten jobs (boundary, power, manufacturing, waste, …) shown side by
side as real-time 3D models you can orbit and zoom. Scroll, arrow keys, or the
chapter rail page through it; each frame snaps into place.

Everything runs **fully offline**: three.js and the fonts are vendored locally,
so there are no CDN or network requests.

## View it

- **Single file:** open [`dist/cell-and-iss.standalone.html`](dist/cell-and-iss.standalone.html)
  directly in a browser (double-click). Everything — three.js, fonts, all
  code — is inlined into that one file.
- **Modular source:** serve the repo root over HTTP and open `index.html`:
  ```bash
  python3 -m http.server 8000   # then visit http://localhost:8000/
  ```
  (ES modules don't load over `file://`, so the modular version needs a server;
  the standalone file does not.)

## Structure

```
index.html      modular entry (loads src/, vendor/, fonts/)
src/            main.js · models.js · three-d-stage.js  (app + 22 model builders)
vendor/         three.min.js + OrbitControls (minified)
fonts/          Sora + JetBrains Mono, self-hosted woff2 + fonts.css
dist/           cell-and-iss.standalone.html  (single-file build)
build.mjs       regenerates dist/ from index.html + src/ + vendor/ + fonts/
```

## Build

The single-file build is produced from the modular source:

```bash
node build.mjs
```

It inlines the vendored three.js and addons as `data:` URLs in the import map,
embeds the fonts as base64 `@font-face`, and merges the app scripts into the
page. Output: `dist/cell-and-iss.standalone.html`.

## Credits & license

Project code is MIT licensed — see [LICENSE](LICENSE).
Vendored dependencies (three.js, Sora, JetBrains Mono) retain their own
licenses — see [THIRD-PARTY.md](THIRD-PARTY.md).

Models are simplified and not to scale, built to be read rather than measured.
