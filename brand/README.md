# نسق — Arabic wordmark

The current logo is **نسق alone**, in **Aref Ruqaa Bold**, converted to SVG paths.
It has no accompanying symbol or Latin lettering. [decision.json](decision.json)
records the identity, typography, palette, and motion specification.

Open [the guide](index.html) or [the preview](previews/arabic-wordmark.png).
The teal, mint, ivory and ink palette remains. English and Arabic interface text
continue to use IBM Plex; the logo stays Arabic in either interface language.

## Current artwork

| File | Use |
| --- | --- |
| `assets/nasaq-wordmark.svg` | Primary teal wordmark |
| `assets/nasaq-wordmark-reverse.svg` | Ivory on dark surfaces |
| `assets/nasaq-wordmark-mono.svg` | Ink monochrome |
| `assets/nasaq-wordmark-white.svg` | White on dark surfaces |
| `assets/favicon.svg` | Arabic wordmark on a teal browser tile |
| `assets/nasaq-pattern.svg` | Quiet decorative Arabic-wordmark repetition |
| `editable-wordmark.svg` | Editable Arabic outline group |

All wordmarks use a **144 × 112** view box. The older `nasaq-symbol`,
`nasaq-lockup-ar`, `nasaq-lockup-en`, and `nasaq-lockup-bilingual` filenames and
their color variants are compatibility aliases containing **exactly the same
Arabic-only artwork**. They no longer denote separate symbols or language variants.
Use `nasaq-wordmark` for new integrations.

Every current SVG contains outlined Arabic lettering. No installed font, CSS,
font download, package dependency, or network request is needed to display it.
The source Aref Ruqaa TTF is used only by the offline generator and is bundled
with its original OFL notice for reproducibility. It is not loaded by application
styles or component packages.

Prefer 48 CSS pixels or wider for normal logo placement. Smaller samples are
provided for inspection and the dedicated favicon handles browser tabs. Preserve
the view-box proportions and at least 12 units of clear space around the artwork.
Do not mirror, stretch, rotate, separate the letters, or add another symbol or
Latin word to the logo. A linked logo needs a translated accessible name such as
“Nasaq home”; decorative repeats use empty alt text.

## Animated wordmark loader

The Arabic lettering follows a reconstructed handwriting sequence: the initial
nūn descends into the connected sīn, then the final qāf forms its head, bowl,
and terminal return. A brief pen lift precedes the nūn's diamond dot. The exact
existing outline is retained, including the qāf's end marks incorporated into
its terminal stroke.

The transparent GIF loop lasts **3.6 seconds**, with **90 frames at 25 fps**.
It holds the complete wordmark, clears, and restarts without reverse erasing.

- `assets/nasaq-wordmark-loader.gif`: teal, 128 × 128 pixels.
- `assets/nasaq-wordmark-loader-256.gif`: teal, 256 × 256 pixels.
- `assets/nasaq-wordmark-loader-white.gif`: white, 128 × 128 pixels.
- `assets/nasaq-wordmark-loader-white-256.gif`: white, 256 × 256 pixels.

Use a static wordmark for reduced motion and supply the loading status in text.
Translate the status and remove the loader when the operation finishes.

```html
<p role="status">
  <picture>
    <source media="(prefers-reduced-motion: reduce)"
            srcset="./brand/assets/nasaq-wordmark.svg" type="image/svg+xml">
    <img src="./brand/assets/nasaq-wordmark-loader.gif" width="64" height="64" alt="">
  </picture>
  <span>Loading…</span>
</p>
```

Resolve asset paths against the consuming application’s base path. The older
`nasaq-loader*.gif` filenames remain identical compatibility aliases.

For dark surfaces, pair the white GIF with `nasaq-wordmark-white.svg`.
The animation uses the exact outlined lettering, rendered locally by Chromium
and encoded by ffmpeg. It does not use generated raster lettering.

### Handwriting references

The sequence and timing reconstruct a plausible pen movement through this
specific outline. They are not a universal prescribed Ruqʿah stroke order.

- [Al-Wasat's Ruqʿah lesson 5](https://www.alwasatnews.com/news/887827.html)
  describes qāf as a wāw head combined with a nūn body.
- [The Jordanian Arabic Language Academy's *تيسير تعلم الخط العربي*](https://arabic.jo/res/seasons/16/16-3.pdf)
  discusses continuous motion and the qāf's two dots attached at its end.
  This reference was checked through its indexed excerpt; direct PDF access
  timed out, so it does not establish the animation's exact trajectory.
- [El-Sana and Biadsy's Arabic handwriting research](https://patents.google.com/patent/WO2008012824A1/en)
  describes dots and supplementary marks as strokes usually added after the
  word, and records joined forms of multiple dots.

## Color and typography

The palette is teal `#006A64`, mint `#C8E7DD`, ivory `#F7F5EE`, and ink `#142D30`.
[palette.json](palette.json) records measured contrast pairs. White on teal is
6.47:1; teal on ivory is 5.93:1; ink on ivory is 13.30:1. Test new states and
pairings separately; these measurements do not certify an entire interface.

**Logo:** Aref Ruqaa Bold 700, Arabic only, outlined into the asset.
**UI:** IBM Plex Sans Arabic and IBM Plex Sans, unchanged. Arabic body text
normally uses 16px or larger with line height around 1.75; Latin body text uses
around 1.55. Never letter-space connected Arabic or reverse its characters.

Use real Unicode and `lang="ar" dir="rtl"` for Arabic UI content. The logo image
keeps its orientation regardless of surrounding reading direction. The product
may still be named “Nasaq” in English prose and package names; that spelling is
not a second visual wordmark.

## Sources and rights

The wordmark is typographic artwork shaped with HarfBuzz from unmodified
`third-party/arefruqaa/ArefRuqaa-Bold.ttf`. The original font and its OFL notice
were fetched from Google Fonts. Their Git blob hashes were verified against
GitHub contents metadata, and SHA-256 checksums are recorded in
[third-party/sources.json](third-party/sources.json).

Nasaq’s original code, documentation, and artwork are distributed under
[Apache License 2.0](https://github.com/MohamedEmbarak/nasaq/blob/main/LICENSE).
The brand kit includes the project LICENSE and NOTICE. Upstream font software
remains under its own SIL Open Font License; that license does not govern the
finished artwork. Keep the relevant notices with redistributed font sources.
The Aref Ruqaa notice reserves “EURM10”; the IBM notices reserve “Plex” for
modified fonts. No font software has been modified here.

The project license does not grant rights to use trademarks beyond its stated
terms. This guide provides no trademark clearance, official endorsement, or
DGA certification.

## Regeneration

From the Nasaq project directory:

```sh
python brand/build-assets.py
node brand/build-loader.mjs
python brand/build-kit.py
```

The `strokes` table in `build-loader.mjs` controls pen paths, pressure widths,
and timing. Each trace is clipped to its own original letter contour; the
generator checks the completed silhouette before encoding. Add `--proof` to
save frame images and a sequence sheet under `.artifacts/handwriting` for review.

The SVG generator needs Python fontTools and system HarfBuzz. The GIF generator
needs `@playwright/test`, Chromium and ffmpeg; `NASAQ_CHROMIUM` overrides the
browser path. These scripts work locally and make no network requests. The kit
generator includes current artwork, guide, previews, generators, and the font
sources/licenses they use. Only the current identity assets are distributed.
