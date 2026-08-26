# notes-r1-opus-2 (Round 1 · Combat / towers / projectiles)

MODEL: claude-opus-5-thinking-high-fast
Branch: `cursor/warcraft3-td-combat-4e62`

## Scope
Ship a complete playable WC3-style TD under `warcraft3-td/` with a deep combat layer:
4 races × 3 lines × 3 tiers, WC3 attack×armor table, splash / chain / poison / slow /
root / web, projectile leading, flying targeting rules, range circles, sell + upgrade.

Status: **complete**. Vanilla HTML/CSS/JS, runs from `file://`, no external assets, no
Blizzard IP (all names, art and audio are original and generated procedurally).

## Layout

```
warcraft3-td/
  index.html            single entry point, plain <script> tags, no bundler
  css/wc3.css           gold-trim HUD chrome
  js/config.js          balance scalars, grid, path + air corridor waypoints
  js/i18n.js            zh-CN / en switch
  js/data/              damageTable, towers (36), creeps, waves (30), heroes (4), strings
  js/engine/            rng (mulberry32), path, spatial hash, camera, loop, input, audio
  js/sim/               combat resolution, headless Game
  js/entities/          tower, creep, projectile, hero, fx pool
  js/render/            baked terrain, procedural sprites, canvas icons, world renderer
  js/ui/                hud, commandCard, minimap, tooltip, menus
  js/main.js            App controller
  tests/                zero-dependency node runner + 8 suites (91 assertions groups)
```

## Combat model

**Damage pipeline** (`js/data/damageTable.js`, `js/sim/combat.js`), per hit:

1. roll base damage in `[min, max]` with the deterministic RNG
2. add `bonusVsArmor[armorType]` flat bonus
3. multiply by the attack × armour factor from the 7×7 table
4. subtract armour-value mitigation, `1 - (0.06·A)/(1 + 0.06·A)` for `A >= 0`
5. apply situational multipliers (splash ring, chain decay, crit)
6. clamp at zero

Attack types: `normal pierce siege magic chaos hero spells`.
Armour types: `unarmored light medium heavy fortified hero divine`.
`chaos` is 1.00 against everything; `divine` takes 0.05 from everything but chaos.

**Mechanics and which line owns them**

| mechanic | line |
| --- | --- |
| crit | `h_arrow` (Guard Tower), `o_watch` (Watch Tower) |
| siege splash + `bonusVsArmor.fortified` | `h_cannon` (Cannon Line) |
| magic splash, hits air | `h_arcane` (Arcane Line) |
| poison + slow, pierce, hits air | `o_troll` (Spear Line) |
| chain lightning, hits air | `o_spirit` (Totem Line) |
| root chance, ground only | `e_ancient` (Ancient Line) |
| acid splash + poison | `e_chimaera` (Roost Line) |
| multishot, hits air | `e_moon` (Moon Line) |
| ghost/magic | `u_spirit` (Spirit Line) |
| slow + web (grounds flyers), hits air | `u_zigg` (Web Line) |
| heavy/fortified bonus + poison splash | `u_meat` (Meat Line) |

**Flying rule** — a tower may engage air only when `targets` contains `air`
*and* its attack type is one of `pierce / magic / chaos`. `TowerData.canTargetAir`
is the single source of truth and is asserted over the whole roster in tests.
`web` drags a flyer to `z = 0` for its duration, after which ground-only towers
can hit it; `root` is refused against airborne units.

**Projectiles** lead their target by solving the intercept quadratic against the
creep's current velocity; when no positive root exists the shot falls back to a
direct line. Splash uses 100 / 50 / 25 percent rings and only damages targets
the firing tower is legally allowed to hit. Chain picks the nearest unvisited
legal target within the bounce radius and decays per hop.

**Status effects** never stack — the strongest poison / slow wins and refreshes
the duration. Spell-immune creeps take damage but ignore slow / poison / root.
Bosses take shortened crowd-control durations.

## Balance work

Global scalars live in `Config.balance` (`towerDamage`, `creepHp`, `bounty`) so the
whole curve can be moved without touching 36 tower entries. Creep HP follows
`42 · 1.135^(wave-1)`, armour value `armorBase + floor(wave/4)`.

`tests/balance.test.js` plays whole 30-wave campaigns headlessly with a simple
scripted commander: Easy and Normal are cleared, Hard costs lives, Insane defeats
that same play pattern, and doing nothing always loses. `tests/report.mjs` prints
a per-wave table for manual tuning.

## Renderer bugs found and fixed while capturing footage

- `Sprites.box` built each face gradient ending on a *transparent* colour stop
  (`rgba(0,0,0,0.42)`), so every tower and the keep were see-through. Faces are
  now filled opaque and then washed with a translucent gradient.
- `Sprites.platform` had no skirt, so buildings floated over their shadow.
- The day/night pass multiplied red and green down while holding blue at 255,
  which washed the whole board violet. All three channels are now dimmed, blue
  least, and the amplitude dropped from 0.42 to 0.30.

## Tests

`node warcraft3-td/tests/run.mjs` — 91 passing, zero dependencies.
Suites: `damageTable combat flying towers waves economy path balance`.

## Leftovers / not done

- Only one map. `Config.waypoints` / `airWaypoints` would need a map registry.
- No save/resume, no leaderboard, no replay playback (the RNG is seeded and
  deterministic, so replays are possible but nothing records the input stream).
- Hero pathing is direct-to-point; no obstacle avoidance around towers.
- Sound is procedural WebAudio only; no music bed.
