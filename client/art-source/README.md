# Source art

Full-resolution originals for everything in `client/public`. **Nothing here is
served or bundled** — Vite only copies `public/`, so these stay out of the
build and off the wire.

They are kept so the shipped WebP can be regenerated at a different size or
quality without re-creating the art. To re-encode after editing an original,
resize to 768px wide for cards (1600px for the full-bleed backdrops) and
encode as WebP at quality 82 — see the commit that introduced this directory
for the exact settings.
