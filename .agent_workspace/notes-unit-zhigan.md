# Unit 质感 + Particle VFX — implementation notes

Branch: `cursor/warcraft3-td-737d` · Scope: `warcraft3-td/js/render.js` only (per file ownership).
Follow-up to d60bd56 which added the volume helpers (`_ball/_rim/_spec/_plate/_head/_legs/_hitWash/_hitBurst`)
and upgraded footman/grunt/ghoul/huntress.

## What changed

### 1. All remaining `_creepBody` species finished (same volume language)

Every species now has: dark outline (`_rim`), top-left key light (`_ball` /
gradients), metal specular (`_spec`), a readable face/eyes, and equipment shine.

- **catapult** — plank chassis with grain + iron bracket, iron-shod wheels with
  turning spokes and bright hubs, lit throwing arm, winch rope, sling cup,
  boulder with specular + smoldering coal, chassis jolt as it rolls.
- **wyvern** — dark far wing with bone fingers, whipping tail with pale barb,
  shaded body with belly-scale ridges, dorsal spines, open jaw with fang,
  glossy eye, lit near wing.
- **gargoyle** — stone-tone far/near wings with vein struts, weathering cracks,
  dangling claw legs, horned head with snarling muzzle, fangs, glowing red eyes.
- **acolyte** — layered robe (dark base + gradient front fold + fold shadows),
  rope belt with a glinting sickle, hooded shadow face with fel eyes, and a
  pulsing ritual orb cupped in the sleeve.
- **knight** — 4-beat gait with hooves, tail, barded horse with caparison in the
  wave color + gold studs, lit armored neck, chamfroned head with ears and eye
  spec, plated rider with kite shield, plumed visored helm, couched lance with
  bright steel tip.
- **ancient** — stomping root legs, bark trunk with cross-light gradient, grain
  lines + knothole, lit branch arms, burning amber wedge eyes, mouth crack,
  3-tone swaying canopy with a hanging vine, whole body leans with the gait.
- **doom** — digitigrade legs with cloven hooves, twin bat wings with rib veins,
  muscled torso (pec highlights + ab shadow), armored belt plate, ram horns
  with pale tips, burning eyes + fangs, animated flaming sword with brass
  guard, white-hot core, and fire glow.
- **infernal** — two-layer animated fel-flame envelope, six floating rock plates
  with lit top-left edges and glowing fel cracks, white-hot eyes, bobbing
  fists; leaves fel-ember trail while walking (see particles).
- **default** — proper fallback beast (shaded body + snout head + horns +
  glossy eye) instead of the old flat two-circle blob.

### 2. `_heroBody` fully rewritten (4 commanders, shared `_cape` helper)

All heroes scaled 1.18 internally; hp/mana bars in `_drawHero` moved up to fit.
Every hero: plate/boot legs, layered cape (dark inner + lit outer edge + fold
shadow, waves faster while moving), specular pauldrons, distinct face, weapon
with shine and an eased attack-swing pose driven by `h._rSwingT`.

- **paladin (Uther)** — silver breastplate + gold trim, blue tabard with holy
  diamond, gold-rimmed pauldrons, white beard + gold crown, warhammer that
  slams on attack with a holy glow, ambient aura.
- **blademaster (Grom)** — green orc skin with pec highlights, red bandana +
  whipping topknot, tusks, spiked leather pauldron, red sash, sashimono war
  banner, long two-tone katana with a wide additive slash arc on attack,
  wind-walk afterimage shimmer while `frenzyUntil` is up.
- **demonhunter (Illidan)** — purple skin with glowing fel tattoos, flowing
  hair, horns, blindfold leaking fel light, twin crescent warglaives with fel
  edges that spin outward on attack; metamorphosis unfurls veined demon wings
  and swaps the palette to violet.
- **deathknight (Arthas)** — saronite plate with glowing rune etchings, skull
  belt buckle, spiked pauldrons, pale face with flowing white hair and icy eye
  glow, Frostmourne (skull crossguard, icy gradient blade, lit fuller + runes),
  frost mist pooling at the feet.

### 3. Particles made unmissable (cap 520 → 900, O(1) overflow)

- `_spawnP` now rotate-overwrites the oldest slot at the cap instead of O(n)
  `shift()`.
- **Denser hit bursts** — 10 additive sparks + 5 chips + 4-point flash star +
  glow + 2 blood drops per hit (`_hitBurst`, still triggered once per game
  spark fx).
- **New particle kinds** — `flash` (additive 4-point star) and `ringp`
  (expanding shockwave ring); `spark` is now drawn additive (`lighter`).
- **Projectile trails for ALL attack types** — pierce gets aligned wake streaks
  + glow motes, normal gets stone streaks + dust, magic trail densified
  (0.045→0.03s) with extra sparks, siege smoke densified plus an ember glow.
- **Death explosions** — `_trackDeaths` records species and emits: dust ring,
  material-correct debris (wood chips for catapult/ancient, stone for
  gargoyle/infernal, colored chips + blood for flesh), flash star, expanding
  `ringp` shockwave, and a bigger glow; bosses get ~2x counts + screen shake.
- **Hero attack flashes** — `_drawHero` detects `attackCd` jumping upward,
  stamps `h._rSwingT` (drives the weapon swing pose) and fires `_swingBurst`:
  a directional fan of 7 sparks + flash star + glow in the facing direction.
- **Walk dust** — every moving ground creep kicks up dust puffs behind it
  (~4/s each, randomized phase); infernals leave rising fel-ember glows
  instead.
- **Status motes** — slowed creeps shed falling ice crystals + soft blue glows,
  poisoned creeps bubble rising fel-green glows, rooted creeps scatter soil
  crumbs (single shared per-creep timer, `c._rStatT`).

### 4. Portrait fixes

`drawPortrait` still reuses the body painters (tower/hero/creep) and now adds a
color rim-light glow behind the subject, better framing for the taller hero
bodies (scale w/52, baseline 0.74h), and larger creep scale (w/48, w/60 boss).
The default species fallback means unknown units no longer render as flat
circles anywhere, including the portrait.

## Verification

- `node --check js/render.js` — clean.
- `node tests/run.mjs` — 94 passed, 0 failed (tests untouched).
- `node tests/bench.mjs` — 0.19 ms/tick sim-side, edge probes ok.
- Headless render harness (temp, /tmp, not committed): stubbed 2D context,
  real `Game` with 40 towers / 80 creeps, 900 frames of `update`+`draw`:
  **1.0 ms/frame JS-side**, particle cap respected (hit 900 exactly under max
  load), swing detection fired for all 4 heroes, all 13 species + null/tower
  portraits painted without throwing, no NaNs.
- Headless Chrome screenshots (saved to /opt/cursor/artifacts):
  `unit_gallery.png` (all heroes + species + boss + meta-Illidan portraits),
  `battle_vfx.png` (mixed army under fire at z2.6 — spark showers, arrow
  trails, death flashes clearly visible), `hero_swing_closeup.png` (paladin
  strike: flash star, spark fan, kill ring, blood, slow-motes on grunts).

## Leftovers / ideas for later

- Renderer-only fields are stamped on game objects (`c._rDustT`, `c._rStatT`,
  `h._rSwingT`, `h._rPrevCd`, `p._rtl`) following the existing `_rtl` pattern;
  a side-table keyed by id would be cleaner if game.js ever serializes state.
- Particle draw order is spawn order; at the 900 cap the rotate-overwrite can
  briefly replace a young particle. Invisible in practice, but a ring buffer
  with age priority would be strictly correct.
- Boss variants reuse the base species body at 1.5x; unique boss silhouettes
  (crown/trim layer) would be a nice next step.
- Tower muzzle flashes still use the old single-glow approach; they could
  adopt `_swingBurst`-style directional sparks.
- At very high zoom (>4x) the 1.15px `_rim` outlines get chunky; could scale
  outline width by 1/cam.z if close-up inspection matters.
