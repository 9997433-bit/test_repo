# R1-FABLE-2 — WC3 HUD authenticity notes

MODEL_SLUG: claude-fable-5-thinking-xhigh

## Scope
Make the HUD feel like Warcraft III: Frozen Throne (original CSS art, no Blizzard
IP): thicker gold stone frames, resource icons, darker inset panels, more readable
command card, better start-menu typography. Layout must keep working at 1280×720
and ~960 width.

## Files changed
- `warcraft3-td/css/wc3.css` — full rewrite (styling only, all selectors JS relies
  on kept: `.cmd-btn`, `.hk`, `.ready`, `.active`, `.hidden`, `.show`, all IDs).
- `warcraft3-td/index.html` — chrome/copy only; all element IDs and every
  `<script>` tag untouched.

## What was done

### Frames & panels
- Shared "gold stone frame" for portrait / minimap / menu panels: gradient
  `border-image` bevel + stacked ring `box-shadow` (dark seam, bronze, inner
  shadow) + drop shadow.
- Riveted gold corner caps (`.fc` elements, pure CSS radial gradients) added to
  portrait, minimap and all three overlay panels (decorative `<b>` tags,
  aria-hidden).
- Top/bottom HUD bars: stone texture via layered `repeating-linear-gradient`s,
  and a layered gold rail (dark seam / bronze / bright gold / bronze / dark)
  drawn with stacked box-shadows along the edge facing the battlefield.
- Info panel and command-card tray are now clearly *sunken*: near-black gradient
  base, thin bronze inner ring, deep inset shadows.

### Resource bar
- Each resource is a dark inset "chip" (`.res-item`) with tabular numerals and a
  CSS-drawn icon (`.ricon`): gold coin (radial gradient + rim), lumber log with
  end grain, footman helm with crest and visor slit, red war banner for the wave
  counter (clip-path pennant), hourglass for the game clock (clip-path).
- Color-coded values: gold / green lumber / red-ish lives, WAVE small-caps label.

### Command card
- 4×3 grid clamped with `minmax(0, 1fr)` on both `.bottom` and `.cmd` — see
  "Bugs found" below.
- Buttons: gold gradient `border-image` bevel, top-sheen + inner shadow, hotkey
  as a gold corner tab (`.hk`), labels bottom-anchored so 3-line tower names
  never collide with the hotkey tab, `overflow: hidden` safety.
- States: hover = bright gold border + glow; `:active` = pressed inset;
  `:disabled` = grayscale/dim; `.ready` = pulsing gold glow animation.

### Menus / typography
- Title: gold embossed text-shadow + gradient divider rule (h1::after), centered
  subtitle, uppercase-letterspaced row labels, how-to text in a parchment inset
  box, choice buttons with lit "active" state, big primary CTA with gold bevel
  frame and glow, hotkey hint line under the start button.
- Overlays: radial darkening, `overflow: auto` + `margin: auto` on the panel so
  it scrolls instead of bleeding over the HUD when the stage area is short.
- Settings widgets (select / checkbox / range) themed via accent-color + dark
  select styling. Tooltip restyled as dark parchment with bronze border.

### Responsive
- ≤1180px: tighter chips/buttons.
- ≤980px: minimap column and 盟友/日志 buttons hidden (buttons have no JS
  listeners; hud.js only sets their textContent, safe), WAVE label hidden,
  3-column bottom grid.
- ≤620px height: 168px bottom bar, compact menu panel (fits fully at 960×540),
  smaller command-card type, hint hidden.

## Bugs found & fixed while testing
- `.bottom` had a fixed height but its single grid row was sized by the
  command-card buttons' min-content (3-line labels → 62px/button), stretching
  every bottom panel to 211px and clipping row 3 + the portrait nameplate at
  720p. Fix: `grid-template-rows: minmax(0, 1fr)` on `.bottom` and
  `repeat(3, minmax(0, 1fr))` on `.cmd` rows/cols.
- Long tower names (奇美拉栖木 etc.) wrapped to 3 lines and collided with the
  hotkey badge; fixed by bottom-anchoring labels (`align-items: flex-end`) and
  tuning font/line-height so 3 lines fit in a 52px button.

## How verified
- `node tests/run.mjs` → 45 passed, 0 failed (JS untouched).
- Headless Chrome (puppeteer-core + system google-chrome, file:// URL):
  screenshots of menu / in-game / settings at 1280×720 and 960×540, plus 2×-DPI
  crops of the command card and resource bar. Zero console/page errors.
- Programmatic layout measurement (getBoundingClientRect) confirms bottom HUD
  ends exactly at viewport bottom (bottom=720, all panels 180px, buttons 52px).
- Screenshots uploaded to run artifacts (hud_menu_1280x720.png,
  hud_ingame_1280x720.png, hud_ingame_960x540.png, hud_command_card_closeup.png,
  hud_resource_bar_closeup.png).

## Leftovers / notes for later rounds
- Minimap *interior* rendering (tiny map in the frame corner, camera rect) is
  `render.js` territory — the canvas is stretched by CSS but the drawing is
  owned by the render agent; frame styling is done on my side.
- Portrait art is a flat blue blob from `render.js drawPortrait`; the gold frame
  is ready for better art.
- Command-card buttons are text-only; when render/data agents add painted icons,
  drop the label to a cost-only line and keep the `.hk` tab as is.
- WC3-like cursor variants (build/invalid/target) from DESIGN.md §6 not done
  (needs render.js cooperation for state classes on the canvas).
- `.res-item` chips have `title` attributes for hover hints; could be swapped to
  the styled tooltip later if desired.
