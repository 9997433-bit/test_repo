# Azeroth Keep TD — Warcraft III Tower Defense Design Bible

SOTA-grade HTML5 tribute to Blizzard Warcraft III custom TDs
(Element TD, Wintermaul, Circumnavigation, classic maze TD).
**No copyrighted Blizzard assets.** All art/audio is original canvas + WebAudio.

## Product Fantasy
You are a commander on a Kalimdor border keep. Creeps pour from a dark portal
along a winding dirt road. You spend gold and lumber to raise race-themed
towers, exploit WC3 attack/armor tables, and hold 30 waves. The HUD, portrait
frame, command card, minimap, resource bar, and selection rings must feel like
Warcraft III: Frozen Throne — not a generic mobile TD.

## Hard Constraints
- Live only under `warcraft3-td/`
- Vanilla HTML/CSS/JS. No bundler, no npm game engine, no CDN frameworks
- Playable by opening `index.html` or any static server
- 60 FPS target on 1280×720+, usable at 960×540
- Keyboard + mouse. Touch-friendly hit targets on the command card
- Chinese + English UI strings (default zh-CN)

## Canonical WC3 TD Systems (must implement)

### 1. Warcraft III attack × armor table
Attack types: `normal`, `pierce`, `siege`, `magic`, `chaos`, `hero`, `spells`
Armor types: `unarmored`, `light`, `medium`, `heavy`, `fortified`, `hero`, `divine`

Use a readable damage-factor table close to TFT 1.30+ constants:

| atk \ arm | unarm | light | medium | heavy | fort | hero | divine |
|-----------|-------|-------|--------|-------|------|------|--------|
| normal    | 1.00  | 1.00  | 1.50   | 1.00  | 0.70 | 1.00 | 0.05   |
| pierce    | 1.50  | 2.00  | 0.75   | 1.00  | 0.35 | 0.50 | 0.05   |
| siege     | 1.00  | 1.00  | 0.50   | 1.00  | 1.50 | 0.50 | 0.05   |
| magic     | 1.00  | 1.25  | 0.75   | 1.50  | 0.35 | 0.50 | 0.05   |
| chaos     | 1.00  | 1.00  | 1.00   | 1.00  | 1.00 | 1.00 | 1.00   |
| hero      | 1.00  | 1.00  | 1.00   | 1.00  | 0.50 | 1.00 | 0.05   |
| spells    | 1.00  | 1.00  | 1.00  | 1.00  | 1.00 | 0.70 | 0.05   |

Display attack/armor icons and multipliers in the selection panel like WC3.

### 2. Economy
- Start: 120 gold, 0 lumber, 20 lives (difficulty-scaled)
- Kill bounty + last-hit floating gold text
- Interest: every 15s, `floor(gold * rate)` extra gold (start 2%, cap 8%)
- Lumber: +1 every 5 waves (Element TD style) for race/tech unlocks
- Sell: 75% of total gold invested (instant)
- Build cost refunded 100% if cancelled before placement

### 3. Waves (30)
- Spawn from portal, follow polyline path, leak at the keep = -1 life
- Wave 5/10/15/20/25/30 are bosses (larger, more HP, special armor)
- Mix of: footmen, grunts, ghouls, huntresses, catapults (siege/fort),
  air wyverns (flying — only pierce/magic/chaos can hit if flying flag set),
  spell immune ancients, chaos demons
- Leak leftovers do NOT respawn (cleaner than Element TD survivor)
- Next wave button + auto-wave after 12s clear
- Wave preview in top bar and minimap

### 4. Towers (4 races × 3 lines × 3 tiers)
Human: Guard Tower (pierce), Cannon (siege splash), Arcane (magic slow)
Orc: Watch Tower (normal), Troll Burrow (pierce poison), Spirit Lodge (magic chain)
Night Elf: Ancient Protector (normal root), Chimaera roost-style (siege splash poison),
  Moon Well battery (magic stars, mana burn visual)
Undead: Spirit Tower (pierce), Nerubian Ziggurat (magic web slow), Slaughterhouse
  meat wagon analog (siege splash, bonus vs heavy/fort)

Each line: T1 cheap, T2 mid, T3 expensive ultimate.
Placement: snap to buildable grass tiles; cannot block the path.
Range circle on hover/select. Attack while creeps in range (lead target).

### 5. Hero (optional commander)
One hero: Paladin / Blademaster / Demon Hunter / Death Knight (pick at start).
Hero walks a short patrol near the keep, can be micro'd with right-click.
Abilities on command card (Q/W/E/R). Costs mana. Hero leak death = 3 lives.

### 6. HUD (non-negotiable WC3 chrome)
- Top resource bar: gold coin, lumber, food/lives, game time, wave
- Menu buttons: Menu / Allies / Log / Menu (styled like TFT)
- Bottom-left: 3D-ish portrait frame, unit name, level stars
- Bottom-center-left: stats (HP bar, ATK, ARM, RNG, SPD) with WC3 fonts
- Bottom-center-right: 4×3 command card, hotkeys A/S/D / Q/W/E / Z/X/C / idle
- Bottom-right: ornate minimap with fog-less terrain, unit dots, camera rect
- Selection: green ring allies, red ring enemies, yellow build preview
- Tooltips on hover (delay 250ms) with gold/lumber cost and damage table
- Cursor: custom pointer + target + build / invalid
- Chat/log strip for wave announcements (“A pack of Grunts has entered…”)

### 7. Presentation
- Camera: tilted faux-isometric canvas (2.5D): ground tiles + height-sorted sprites
- Day/night tint cycle every 4 waves
- Trees, rocks, banners, portal swirl, keep, doodads
- Projectiles, impact sparks, blood/dust puffs, floating combat text
- Death fade + bones/ash
- Build placement ghost + red X if invalid
- Speed: 1x / 1.5x / 2x / pause
- Victory / defeat cinematics (short, WC3 quest-complete feel)

### 8. Audio (original WebAudio)
Procedural: build, upgrade, sell, shoot per race, leak horn, wave horn,
button click, victory fanfare, defeat dirge. Master/SFX sliders.

### 9. Meta
- Difficulty: Easy / Normal / Hard / Insane (HP, bounty, start gold, leak lives)
- Settings: language zh/en, volume, show damage numbers, show range, colorblind
- Pause menu, restart, surrender
- LocalStorage high score: waves cleared, lives, gold earned, difficulty

## Technical Architecture
```
warcraft3-td/
  index.html
  README.md
  DESIGN.md
  css/wc3.css
  js/
    main.js            # boot
    config.js          # constants, balance
    engine/
      loop.js          # fixed update + render interpolation
      input.js
      camera.js
      path.js          # polyline + flying bypass
      spatial.js       # grid / hash for targeting
      audio.js
    entities/
      entity.js
      creep.js
      tower.js
      projectile.js
      hero.js
      fx.js
    data/
      races.js
      towers.js
      waves.js
      damageTable.js
      strings.zh.js
      strings.en.js
    ui/
      hud.js
      commandCard.js
      minimap.js
      tooltip.js
      menus.js
    sim/
      game.js
  tests/
    damageTable.test.js
    path.test.js
    economy.test.js
    combat.test.js
    waves.test.js
    run.mjs            # node test runner, no deps
```

- Game loop: `update(dt)` 1/60 accumulator, render interpolated
- Deterministic sim seed for tests (`config.seed`)
- No `eval`. Modules via ES modules (or IIFE if file:// compatibility needed).
  Prefer ES modules + a tiny `npx serve` note; also provide `file://` fallback
  by using non-module scripts concatenated in index.html if required.
- **Preferred**: single `index.html` + deferred classic scripts (file:// works)

## SOTA Acceptance Bar
1. First-time player understands build → kill → leak in 15 seconds
2. WC3 player recognizes HUD/command card/minimap immediately
3. All 4 races × 3 lines placeable and upgradable
4. Damage table visibly changes DPS vs armor (UI shows ×)
5. 30 waves completable on Easy; Hard is a real challenge
6. 60 FPS with 80+ creeps + 40 towers
7. Automated tests cover table, path leak, bounty, splash, flying rules
8. No Blizzard IP assets; README credits inspiration only
9. README in zh-CN explains how to run and how it maps to WC3 TD
10. Visual quality: painted tiles, not flat colored rectangles

## Non-goals
- Multiplayer / netcode
- Actual WC3 map file (.w3x)
- Copyrighted models, icons, music
