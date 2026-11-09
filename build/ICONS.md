# BATSS Studio app icons

The icon is a posterior distribution with a dashed decision threshold: the
area past the threshold, the posterior probability that drives a trial
decision, is filled in gold.

Palette follows `src/renderer/src/assets/globals.css` (OKLCH converted to sRGB):

- Light primary: #02677f; accent: #03a2bc; gold: #ffb500.
- Dark card: #060e11; accent: #084150; gold: #eaaa2c.

## Files

`icon.svg` is the editable launcher source. `icon.png` (1024px), `icon.ico`
(16–256px), and `icon.icns` (16–1024px with Retina sizes) are matching exports
used by the existing electron-builder configuration. `resources/icon.png` is
the same launcher design used by BrowserWindow.

Linux uses `icons/` (16–512px, one PNG per size). The desktop icon theme only
searches the sizes it defines, which stop at 512×512, so a single 1024px PNG
is never found and the Dock falls back to a generic icon.

Renderer sources are `batss-studio-brand.svg`, `batss-studio-light.svg`, and
`batss-studio-dark.svg` under `src/renderer/src/assets/`.

`resources/icon-light.png` and `resources/icon-dark.png` are 1024px exports
of `build/icon-light.svg` and `build/icon-dark.svg`. The default teal export is `resources/icon.png`.
The main process imports all three as build assets and updates `app.dock`
at startup, on theme changes, and when the icon preference changes.

## Behaviour

Settings > App Icon defaults to Follow theme, which resolves Light, Dark,
and System using Electron's effective native theme. Teal, Light, and Dark
can also be selected as fixed icons independently of the color scheme.
The selection applies to the sidebar and the running macOS Dock icon.
Both the color scheme and icon preference persist across app restarts.

Finder, installers, and the Dock while the app is not running retain the
packaged teal icon. Windows and Linux launcher icons also retain that icon.
No application bundle or system icon cache is modified at runtime.

## Layout

Launcher sources in `build/` use a 340-unit canvas around the 274-unit tile,
leaving about 10% transparent padding on each side (826px artwork on a
1024px export). This applies consistently to runtime Dock variants and
packaged PNG, ICO, and ICNS exports. Renderer SVGs use a 290-unit canvas
(`viewBox="-8 -8 290 290"`) so sidebar sizing stays unchanged. Regenerate
launcher exports from the padded `build/` SVG sources, not the renderer SVGs.

## Regenerating exports

To update artwork, edit all six SVG sources (three in `build/`, three in
`src/renderer/src/assets/`), then regenerate every export.

Render each PNG size directly from the SVG rather than shrinking the 1024px
export, so small sizes stay sharp. The renderer must support SVG gradients and
clip paths: ImageMagick's built-in SVG renderer doesn't, and draws the tile
black. `rsvg-convert` (librsvg) does:

```sh
rsvg-convert -w 1024 -h 1024 build/icon.svg -o build/icon.png
for n in icon icon-light icon-dark; do
  rsvg-convert -w 1024 -h 1024 build/$n.svg -o resources/$n.png
done
for s in 16 24 32 48 64 128 256 512; do
  rsvg-convert -w $s -h $s build/icon.svg -o build/icons/${s}x${s}.png
done
```

Losslessly recompress the PNGs (the renderer's output is several times larger
than needed), then build `icon.ico` from the 16–256px PNGs and `icon.icns`
from a 1024px render plus the smaller sizes, both with Pillow on any platform.
Pillow stores each ICO entry as a PNG; `magick` would store uncompressed
bitmaps, making the file about ten times larger.

```sh
for f in build/icon.png build/icons/*.png resources/icon*.png; do
  magick "$f" -strip -define png:compression-level=9 PNG32:"$f"
done
python3 -c "
from PIL import Image
sizes = [16, 24, 32, 48, 64, 128, 256]
frames = [Image.open(f'build/icons/{s}x{s}.png') for s in sizes]
frames[-1].save('build/icon.ico', sizes=[(s, s) for s in sizes], append_images=frames[:-1])
"
python3 -c "
from PIL import Image
sizes = ['16x16', '32x32', '64x64', '128x128', '256x256', '512x512']
Image.open('build/icon.png').save('build/icon.icns',
    append_images=[Image.open(f'build/icons/{s}.png') for s in sizes])
"
```
