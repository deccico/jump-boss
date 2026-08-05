# Jump Boss — Decisions

The game is built from `jump-boss.pdf` — 8 notebook pages designed and drawn by Giulio
(age 6) — and `specs.md`. This file records the decisions taken while turning the
notebook into a working game, and why.

## Platform & stack

**Web game: TypeScript + Phaser 3 + Vite, tests with Vitest.**

- Must run on Mac. This project is developed and released from a Linux VPS, which
  cannot build native macOS binaries — a web build is fully buildable, testable and
  releasable from the VPS and runs on the Mac in any browser (and anywhere else).
- Phaser 3 is the most widely used 2D web game engine: scenes, arcade physics,
  sprites and input come built in. Phaser is pinned to 3.x (not 4.x): 3.90 is the
  mature long-term-support line with years of documentation and examples behind it.
- Deployed to GitHub Pages at https://deccico.github.io/jump-boss/ — free hosting,
  released by pushing to `master`.
- A native Mac wrapper (e.g. Tauri) can be added later without changing the game.

## Art: Giulio's drawings are the sprites

The in-game art is extracted straight from the PDF scans — monsters, tombstone,
trophy, title lettering, even the body-texture swatches on the character-select
screen. Nothing looks closer to the designs than the designs themselves.

- `tools/extract-sprites.sh` (run via `npm run sprites`) renders the PDF pages,
  flattens the photo lighting, makes the paper transparent and crops each sprite.
  It is repeatable: crop coordinates are a table in the script, expressed as
  fractions of the page so they survive DPI changes.
- The extracted PNGs under `public/assets/sprites/` are committed, so CI does not
  need poppler/ImageMagick. To replace any sprite with polished art later, just
  drop in a new PNG with the same name.
- Everything not scanned (paper background, platforms, HUD, the player body) is
  drawn programmatically in a matching "living notebook" style: ruled paper,
  wobbly marker outlines, marker-style fills.
- The player is assembled at runtime from the character-select choices (eye count
  1–3, body texture from the five drawn swatches, the striped legs), so it is
  generated as a texture rather than extracted as one fixed sprite.

## Game flow

Title → Character Select → Platform level (power-ups) → Monster A → Monster B →
Huggie Wagye → RIP cutscene → Monster Mayhem → Victory → back to Title.

- The notebook places the "Huggie Wagye dies" tombstone page after the Monster
  Mayhem fight; its connection to the flow was explicitly uncertain in the specs.
  Decision (confirmed with Adrian): play it as Huggie Wagye's defeat cutscene,
  right before the Monster Mayhem final fight, which connects the story naturally.
- "Big Jumps — double as usual / (two times)" is interpreted as a power-up that
  makes jumps exactly twice as high (jump velocity × √2).
- "Special (turns into a monster)" / "X turns into Muscle Mayhem": X pickups fill
  a special meter; when full, the player transforms into the Monster Mayhem
  drawing for a few seconds — big, invincible, damaging on contact.

## Gameplay tuning

The primary player is 6 years old, so everything is forgiving by design: 5 hearts,
long invulnerability after a hit, coyote time and jump buffering, generous
hitboxes, and death simply restarts the current screen with full hearts — there is
no game-over screen and no losing progress.

## Testing & architecture

All game rules (screen flow, character validation, physics numbers, health and
i-frames, power-up timers, boss data, attack scheduling, the player-sprite draw
plan) live in pure TypeScript modules under `src/game/` with **zero Phaser
imports**, taking time and randomness as explicit parameters. Vitest tests them
deterministically in Node with no browser or WebGL. Phaser scenes under
`src/scenes/` are thin shells that render that logic. Sound is synthesized with
WebAudio (no audio assets) and no-ops safely where AudioContext doesn't exist.

## Release cycle

Tests run before every commit (`npm run check` = typecheck + tests + production
build). Every commit is pushed; GitHub Actions mirrors the same check and deploys
`master` to GitHub Pages. Commits are authored by Adrián Deccico only.
