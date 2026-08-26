# R1-FABLE-3 — 设计 / 平衡 · Game Design & Balance

MODEL_SLUG: claude-fable-5-thinking-xhigh

Round 1, balance specialist. Base snapshot: commit `de082f8`. I integrate into the
shared seven-script layout (see DESIGN.md addendum) instead of shipping a parallel
game: the team already has a full engine/renderer/HUD, and the audit (R1-FABLE-1)
declared **balance the top P0 failure** — exactly my specialty lane.

## Scope (audit fix-list items I own)

| # | Item | Files |
|---|------|-------|
| 1 (P0) | Economy/wave curve rebalance + balance regression bots | `js/data.js`, `js/sim-core.js`, `js/game.js`, `tests/balance.mjs` |
| 2 (P0) | Lumber upgrade shop UI entry (Allies panel + action routing) | `js/hud.js`, `js/main.js` |
| 3 (P0) | slow/poison/root read tower data, not hard-coded magnitudes | `js/game.js` |
| 6 (P1) | Hero R ultimates → full Q/W/E/R kits | `js/data.js`, `js/game.js`, `js/hud.js` |
| 7 (P1) | Chain lightning: nearest hop, never re-hits a bounced target | `js/game.js` |
| 12 (P2) | IP hygiene: original hero names, title, README refresh | `js/data.js`, `js/hud.js`, `index.html`, `README.md` |

## Balance design

### Root cause (from audit, confirmed)
Bounty grew linearly (`4 + ⌊i/2⌋`) while wave EHP grew super-linearly
(`28 + 18i` × count × difficulty flat multiplier). Player DPS is proportional to
cumulative gold; a linear income against exponential-ish EHP guarantees collapse
(Normal died at waves 6–10 for every bot strategy).

### New curves (data.js `makeWaves`)
- Total wave HP budget: `250 × 1.16^i` for waves 1–20, softening to `×1.11`
  per wave after 20 (players run out of build space/upgrades late; the soft knee
  keeps waves 21–30 tense instead of impossible).
- Per-creep HP = budget × modifiers / count. Modifiers: flying ×0.80 (fewer
  towers hit air), spell-immune ×0.90 (magic lines go dark).
- Bounty is now **proportional to HP**: per-creep `hp / (12 + 0.25·wave)`.
  The slowly rising divisor makes interest and lumber tech matter late without
  starving the early game.
- Boss waves (5/10/15/20/25/30) are a **single consolidated boss**: HP =
  budget × 1.35, bounty ×1.25 payout, leak −3 lives. Multi-mini-boss packs read
  poorly and made stomp/frost telegraphs meaningless.

### Difficulty (sim-core DIFFICULTY)
| | hp | bounty | gold | lives | speed |
|---|---|---|---|---|---|
| easy | 0.70 | 1.20 | 180 | 30 | 0.92 |
| normal | 1.00 | 1.00 | 130 | 20 | 1.00 |
| hard | 1.30 | 0.90 | 110 | 15 | 1.06 |
| insane | 1.65 | 0.80 | 100 | 10 | 1.12 |

- HP multipliers **> 1 ramp in over the first 12 waves** (`waveHp(base, diff, waveNum)`),
  so Hard/Insane openings are survivable and the pressure arrives as the
  player's economy comes online. Easy's discount applies immediately.
- `speed` multiplies creep move speed — difficulty changes the *feel* (less
  tower uptime per pass), not just the HP sponge.

### Combat fidelity fixes that feed balance
- **Overkill prevention**: towers track expected in-flight damage per target
  (`creep.incoming`) and prefer targets not already doomed. Without this,
  measured effective DPS was wasted on dying creeps and the curves could not be
  tuned honestly.
- **Data-driven status effects**: `slow: 0.25/0.35` now means 25%/35% slower
  (bosses resist 50% of slow power), `poison: N` is N dps × tier for 2.4 s,
  `root` uses the tower's own duration. Tower differentiation knobs work again.
- **Chain lightning** hops to the nearest un-hit creep (audit item 7).

### Hero ultimates (R)
- Paladin — 天罚圣光 / Holy Wrath: 240 spell nova around the hero, full self-heal.
- Blademaster — 钢铁旋风 / Steel Cyclone: 6 s spin, immune, hero-type AoE dps.
- Demon Hunter — 混沌裂隙 / Chaos Rift: chaos damage (pierces spell immunity
  and every armor type ×1.0) to nearby creeps + armor shred. The designed
  answer to late spell-immune ancients.
- Death Knight — 亡者军团 / Legion of the Dead: 6 skeletons, 20 s.
Ultimates cost 100–110 mana (max pools 140–200, 6 mana/s regen) with 40–50 s
cooldowns: roughly one cast per 1–2 waves, a decision not a rotation.

## Balance targets (tests/balance.mjs gates)
- Mixed-counter bot **wins Easy with ≥ 10 lives** (first-timer proxy).
- Upgrade-focused bot **wins Normal**.
- Hard: bot reaches **≥ wave 18** (audit gate; goal is winnable-but-tight).
- Insane: survives the early ramp (≥ wave 8) and is allowed to lose.
- Whole suite deterministic (seeded) and < 60 s.

## Tuning log
- **v1** (BOSS_HP 1.35, boss armor +2, boss speed ×0.85, regen 0.7%/s):
  Easy mixed WIN 15 lives; Normal t3 dead @26, mixed dead @29; Hard t3 @24;
  Insane @16. Diagnosis from per-wave traces: regular waves nearly leak-free,
  but **every single boss leaked 3 lives** (6 bosses ≈ the whole Normal pool).
  Concentrated HP + regen + slow resist + armor premium made bosses unkillable
  for spread damage.
- **v2** (BOSS_HP 1.05, boss armor +1, boss speed ×0.75, regen 0.45%/s; mixed
  bot reserve no longer blocks counter-building): Easy WIN 24; Normal mixed WIN
  3 lives; Normal t3 still dead @26 — leaks isolated to hero-armor bosses
  (15/25) and the immune boss (20): its rotation had zero normal-attack towers,
  i.e. the designed counter. Added o_watch/n_ancient to the t3 rotation (a
  legitimate build fix, not a curve change).
- **v3 final**: Easy mixed **WIN 24/30 lives**; Normal t3 **WIN 5 lives**,
  Normal mixed **WIN 3 lives**; Hard t3 dead @19, mixed dead @21 (gate ≥18);
  Insane t3 dead @17. Strict monotonic difficulty order, suite ≈ 6 s.
  Bots are deliberately mediocre (static hero park, no mazing, no
  sell-repositioning), so Hard remains winnable for a strong human while
  Insane stays a leaderboard fight.

## IP hygiene
Title 艾泽拉斯要塞塔防/Azeroth Keep TD → 边境要塞塔防 / Frontier Keep TD.
Heroes: 乌瑟尔/Uther→奥德里克/Aldric, 格罗玛什/Grom→卡尔加/Karghal,
伊利丹/Illidan→西尔萨/Sylthar, 阿尔萨斯/Arthas→莫尔文/Morvane.
Nerubian Ziggurat→Spider Ziggurat; 天灾→入侵 in the victory line; storage keys
and `window.AzerothApp` renamed. DESIGN.md untouched (design doc credits the
inspiration; the shipped game itself carries no Blizzard proper nouns).

## Deliberate non-goals this round
- Wave preview chips / minimap pulses (#4), FPS proof (#5), a11y (#8), cursors
  (#9), score screens (#10), test-layout split (#11) — other lanes.
