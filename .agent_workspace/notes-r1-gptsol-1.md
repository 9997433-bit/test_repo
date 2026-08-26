# R1-GPTSOL-1 test-harness notes

- Expanded `warcraft3-td/tests/run.mjs` with deterministic no-dependency integration coverage.
- Added tests for chain-lightning bounce damage, splash radius damage, overlap rejection, two upgrades followed by sale, 15-second interest, lumber on waves 5 and 10, and hero cast mana rules.
- Combat tests drive the existing headless `Game` projectile pipeline directly; no production JavaScript was changed.
- Validation command: `cd warcraft3-td && node tests/run.mjs`.
