# Albatross app icons

Palette follows `src/renderer/src/assets/globals.css` (OKLCH converted to sRGB):

- Light primary: #02677f; accent: #03a2bc; gold: #ffb500.
- Dark card: #060e11; accent: #084150; gold: #eaaa2c.

`icon.svg` is the editable launcher source. `icon.png` (1024px), `icon.ico`
(16–256px), and `icon.icns` (16–1024px with Retina sizes) are matching exports
used by the existing electron-builder configuration. `resources/icon.png` is
the same launcher design used by BrowserWindow.

Renderer sources are `albatross-brand.svg`, `albatross-light.svg`, and
`albatross-dark.svg` under `src/renderer/src/assets/`. The sidebar uses the
existing `.dark` class, so Light, Dark, and System settings stay synchronized
without a second theme listener. `albatross-mark.svg` remains a compatible
alias of the default brand artwork.

The launcher uses a fixed teal design legible on light and dark desktops.
The in-app logo adapts to the app theme; installer and launcher icons do not
change with it. Transparency is outside the rounded tile, with no baked shadow.

To update artwork, edit the SVG sources and regenerate the matching PNG,
ICO and ICNS exports. No additional application dependencies are required.
