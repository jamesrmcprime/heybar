# Self-hosted Night Seal fonts

woff2 latin subsets for Syne / Manrope / IBM Plex Mono, loaded via `next/font/local` in `src/app/layout.tsx`.

Kept in-repo so `npm run build` does **not** call fonts.google.com (CI was failing intermittently on the Google font loader).

Source: [Fontsource](https://fontsource.org/) CDN (`cdn.jsdelivr.net/fontsource/fonts/…@5.2.5/latin-*-normal.woff2`). SIL OFL / Apache-2.0 as published by each family.
