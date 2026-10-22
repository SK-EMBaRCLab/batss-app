# Albatross app icons

Palette follows `src/renderer/src/assets/globals.css` (OKLCH converted to sRGB):

- Light primary: #02677f; accent: #03a2bc; gold: #ffb500.
- Dark card: #060e11; accent: #084150; gold: #eaaa2c.

`icon.svg` is the editable launcher source. `icon.png` (1024px), `icon.ico`
(16–256px), and `icon.icns` (16–1024px with Retina sizes) are matching exports
used by the existing electron-builder configuration.

Linux uses `icons/` (16–512px, one PNG per size). The desktop icon theme only
searches the sizes it defines, which stop at 512×512, so a single 1024px PNG
is never found and the Dock falls back to a generic icon. Regenerate them from
`icon.png` whenever it changes:

````sh
for s in 16 24 32 48 64 128 256 512; do
  magick build/icon.png -filter Lanczos -resize ${s}x${s} -strip PNG32:build/icons/${s}x${s}.png
done
``` `resources/icon.png` is
the same launcher design used by BrowserWindow.

Renderer sources are `albatross-brand.svg`, `albatross-light.svg`, and
`albatross-dark.svg` under `src/renderer/src/assets/`.

Settings > App Icon defaults to Follow theme, which resolves Light, Dark,
and System using Electron's effective native theme. Teal, Light, and Dark
can also be selected as fixed icons independently of the color scheme.
The selection applies to the sidebar and the running macOS Dock icon.
Both the color scheme and icon preference persist across app restarts.

`resources/icon-light.png` and `resources/icon-dark.png` are 1024px exports
of `build/icon-light.svg` and `build/icon-dark.svg`. The default teal export is `resources/icon.png`.
The main process imports all three as build assets and updates `app.dock`
at startup, on theme changes, and when the icon preference changes.

Finder, installers, and the Dock while the app is not running retain the
packaged teal icon. Windows and Linux launcher icons also retain that icon.
No application bundle or system icon cache is modified at runtime.

To update artwork, edit the SVG sources and regenerate matching exports.

Launcher sources in `build/` use a 340-unit canvas around the 274-unit tile,
leaving about 10% transparent padding on each side (826px artwork on a
1024px export). This applies consistently to runtime Dock variants and
packaged PNG, ICO, and ICNS exports. Renderer SVGs keep their original
viewBox so sidebar sizing stays unchanged. Regenerate launcher exports
from the padded `build/` SVG sources, not the renderer SVGs.
````
