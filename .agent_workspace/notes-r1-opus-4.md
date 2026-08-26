# R1-OPUS-4 — waves / economy / hero
model slug: `claude-opus-5-thinking-high-fast`

## Scope (file ownership respected)
Edited only:
- `warcraft3-td/js/game.js`
- `warcraft3-td/js/data.js`
- this note

Untouched: `tests/*`, `hud.js`, `render.js`, `main.js`, `sim-core.js`, `css/`, `index.html`.
No costs, tower stats, wave HP/count/bounty or difficulty multipliers were changed.

## What changed

### 1. Hero kits now play differently (`data.js` HEROES + `game.js` cast/_heroAttack)
Every ability carries its numbers in data, and the sim reads them:

| Hero | Q | W | E |
|------|---|---|---|
| Paladin (Uther) | Holy Light: 95 spell dmg + 50% nova in 70px, heals 150 | Devotion Aura: passive **+15% damage to towers within 200**, cast → +40% for 8s | Divine Shield: 5s immunity + double attack speed, small self heal |
| Blademaster (Grom) | Crit Stance: 5s of 2.2× crits **and 35% cleave** | Mirror Image: 6s, strikes up to 3 targets (images at 45%) | Wind Walk: 3s untouchable sprint, next strike deals 3× (ambush) |
| Demon Hunter (Illidan) | Mana Burn: 75 spell dmg, **-5 armor for 8s**, +60 vs bosses | Immolation: real toggle, 16 dps in 82px while mana drains 7/s | Metamorphosis: 8s, +50% damage, +70 range, attacks splash |
| Death Knight (Arthas) | Death Coil: 90 spell dmg, drains 130 hp back | Unholy Aura: passive **+12% tower attack speed within 200**, cast → +35% for 8s | Animate Dead: raises 2 skeletons for 14s (real attackers) + 15 gold |

Supporting sim work:
- Tower auras are applied in `_tickTowers` (damage/rate multipliers at fire time), never inside
  `_hitCreep`, so the projectile/splash/chain unit tests keep their exact expected numbers.
- Armor shred and boss armor buffs go through `_effectiveArmor(creep)`, which defaults to the
  creep's plain armor when the new fields are absent (test creeps stay unaffected).
- Skeletons are `temp` towers with an `expire` time: they render and shoot like towers, cannot be
  upgraded, and are excluded from `snapshot().towers`.
- Ground creeps within 30px now damage the hero (`3 + wave*0.5`, bosses +12, capped 60 dps).
  A downed hero is out for 22s and revives at the keep. No lives are lost, so Easy stays safe.
  Divine Shield / Wind Walk grant `invulnUntil` and block this damage.

### 2. Wave announcements
- Wave start: `Wave 7/30: 9× Wyvern · armor: light · flying · counter with pierce`
  (`D.armorLabel` + `D.counterHint` map the WC3 armor table to a recommended attack type).
- Wave cleared → `Wave n cleared. Next in 12s.` plus `Up next: …` preview.
- 5s countdown line before the auto-start.
- `game.wavePreview(offset)` returns a structured preview (name, count, armor, counter,
  ability text, scaled hp) for the HUD to consume.
- All strings live in `D.MSG` with `{token}` slots, zh + en, resolved by `D.msg(key, lang, params)`.
- `game.banner()` writes to the log **and** pushes a floating text FX over the lane, so the
  existing renderer shows it without any render.js change.

### 3. Lumber spend
`game.spendLumber(id)` + `game.lumberUpgradeState(id)`, data in `D.LUMBER_UPGRADES`:

| id | cost | max | effect |
|----|------|-----|--------|
| `interest` | 1 lumber | 3 | +2% interest per level (uses `SimCore.nextInterestRate`, caps at 8%) |
| `armory` | 2 lumber | 3 | +8% damage for every tower |
| `sentry` | 2 lumber | 2 | +8% range for every tower |
| `repair` | 2 lumber | 3 | +3 lives immediately |

Lumber income is unchanged (+1 every 5 waves) so the existing lumber test still sees
`[0,0,0,0,1,1,1,1,1,2]`.

### 4. Bosses are telegraphed
Four mechanics in `D.BOSS_ABILITIES`, assigned per boss in `D.BOSS_PROFILES`
(wave 5 stomp, 10 regen, 15 frost, 20 shroud, 25 stomp+regen, 30 frost+shroud+stomp):
- **War Stomp** — warns 1.3s ahead with a ring the size of its radius, then stuns towers 1.6s.
- **Stone Regeneration** — heals 0.7% max hp/s.
- **Frost Aura** — nearby towers attack 25% slower.
- **Shadow Shroud** — +3 armor to escorting creeps.
- Every boss enrages at 50% hp (+25% speed) with a banner.

Telegraph chain: scout report two waves out → "the portal shudders" banner when the boss is next
→ 18s build phase instead of 12 → 5s countdown → portal charge pulses → 1.8s spawn delay →
"strides onto the field" banner → per-cast warnings.

## Verification
- `node tests/run.mjs` → 45 passed, 0 failed
- `node tests/edges.mjs` → 6 passed, 0 failed
- `node tests/bench.mjs` → 0.17 ms/tick with 40 towers + 80 creeps (unchanged), edge probes ok
- Ad-hoc harness (`/tmp/verify.mjs`, kept out of the repo since tests are owned elsewhere) →
  73 checks covering every ability, all four boss mechanics, all four lumber upgrades,
  announcement text, hero death/revive and determinism per hero.
- **Easy completable**: scripted auto-player (coverage-ranked placement, upgrades, lumber tech,
  abilities on cooldown) wins all 30 waves with every hero: 23–26 lives left.
  The same bot on the pre-change build finished Easy with 24–30 lives, so bosses cost a few
  lives but the difficulty target holds.
- Real UI walkthrough recorded in Chrome (see the PR artifacts).

## Public API (unchanged plus additions)
`tryBuild, upgradeSelected, sellSelected, startNextWave, update, snapshot, cast` all keep their
signatures and return values. Added: `spendLumber(id)`, `lumberUpgradeState(id)`,
`wavePreview(offset)`, `waveLabel(wave)`, `banner(msg, color)`.

## Leftovers for other agents
- The lumber shop has no HUD surface yet — `D.LUMBER_UPGRADES` + `game.spendLumber(id)` +
  `game.lumberUpgradeState(id)` are ready for a command-card page or a panel (hud.js owner).
- `banner()` FX are tagged `banner: true` and boss telegraph rings are plain `ring` FX; render.js
  could draw them larger / with a distinct font.
- `wavePreview()` is ready for a top-bar "next wave" widget.
