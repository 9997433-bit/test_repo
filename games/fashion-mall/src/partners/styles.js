const STYLE_ID = "fm-roster-style";

const CSS = `
.fm-team-head { position: relative; overflow: hidden; }
.fm-team-head h2 { margin: 0 0 4px; font-size: 19px; }
.fm-team-sub { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--ink-soft); }
.fm-team-sub b { color: var(--rose-deep); }

.fm-team-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 8px; }
.fm-team-stat { padding: 9px 6px; border-radius: 15px; text-align: center; background: linear-gradient(180deg, #fff, #fff3f8); box-shadow: 0 6px 14px rgba(199,59,111,.09); }
.fm-team-stat b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
.fm-team-stat span { display: block; margin-top: 1px; font-size: 10.5px; color: var(--ink-soft); }

.fm-legend { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.fm-legend span { padding: 3px 9px; border-radius: 999px; font-size: 10.5px; background: #fff2f7; color: var(--ink-soft); }
.fm-legend .match { background: linear-gradient(180deg, #fff6e2, #ffeac4); color: #7a5714; font-weight: 600; }

.fm-p-card { position: relative; overflow: hidden; transition: box-shadow .24s var(--ease), transform .24s var(--ease); }
.fm-p-card.owned { border-left: 3px solid var(--rose); }
.fm-p-card.new { border-left: 3px dashed var(--ink-200); }
.fm-p-card.new .fm-p-name b { color: var(--ink-soft); }
.fm-p-card.signing { animation: fmSign .7s var(--ease); }
@keyframes fmSign {
  0% { transform: scale(1); box-shadow: var(--shadow) }
  35% { transform: scale(1.015); box-shadow: 0 16px 34px rgba(199,59,111,.28) }
  100% { transform: scale(1); box-shadow: var(--shadow) }
}

.fm-p-top { display: flex; gap: 11px; align-items: flex-start; }
.fm-p-avatar { flex: 0 0 58px; width: 58px; height: 58px; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 16px rgba(58,36,51,.14); }
.fm-p-avatar svg { display: block; width: 100%; height: 100%; }
.fm-p-card.new .fm-p-avatar { filter: grayscale(.85) brightness(1.05); opacity: .78; }

.fm-p-id { min-width: 0; flex: 1; }
.fm-p-name { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.fm-p-name b { font-size: 16px; }
.fm-p-title { font-size: 11.5px; color: var(--ink-soft); }
.fm-p-story { margin: 5px 0 0; font-size: 11.5px; line-height: 1.55; color: var(--ink-soft); }

.fm-p-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.fm-tag { padding: 2px 8px; border-radius: 999px; font-size: 10.5px; background: #fff; box-shadow: 0 3px 8px rgba(58,36,51,.07); white-space: nowrap; }
.fm-tag.spec { background: linear-gradient(180deg, #fff6e2, #ffe8bf); color: #7a5714; font-weight: 600; }
.fm-tag.lv { background: linear-gradient(180deg, #ffe9f1, #ffd7e5); color: var(--rose-deep); font-weight: 600; }
.fm-tag.post { background: #eef7ff; color: #2f5d86; }
.fm-tag.post.match { background: linear-gradient(180deg, #e4fff5, #c4f5e4); color: var(--mint-600); font-weight: 600; }
.fm-tag.idle { background: #f4eef1; color: var(--ink-soft); }
.fm-tag.locked { background: #f2ecef; color: var(--ink-soft); }

.fm-shard { margin-top: 11px; }
.fm-shard-bar { height: 8px; border-radius: 99px; background: #f0e2e9; overflow: hidden; }
.fm-shard-bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--lilac), var(--rose)); transition: width .5s var(--ease); }
.fm-shard-txt { display: block; margin-top: 5px; font-size: 11px; color: var(--ink-soft); }
.fm-shard-txt b { color: var(--rose-deep); font-variant-numeric: tabular-nums; }

.fm-p-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 11px; }
.fm-p-actions .btn { font-size: 12.5px; padding: 9px 14px; min-height: 40px; }
.fm-p-actions .btn[disabled] { background: var(--btn-disabled-bg); color: var(--btn-disabled-text); box-shadow: none; cursor: not-allowed; }

.fm-posts-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 12px 0 6px; }
.fm-posts-head span { font-size: 11.5px; font-weight: 600; }
.fm-posts-head small { font-size: 10.5px; color: var(--ink-soft); }

.fm-posts { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.fm-post {
  position: relative; display: block; text-align: left; padding: 8px 10px; border-radius: 14px; background: #fff;
  border: 1.5px solid var(--line-soft); box-shadow: 0 5px 12px rgba(58,36,51,.07);
  transition: transform .18s var(--ease), box-shadow .18s var(--ease), border-color .18s var(--ease);
}
.fm-post:hover { transform: translateY(-2px); box-shadow: 0 10px 18px rgba(58,36,51,.12); }
.fm-post b { display: block; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fm-post small { display: block; margin-top: 1px; font-size: 10.5px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.fm-post.match { border-color: var(--gold); background: linear-gradient(180deg, #fffaef, #fff2d9); }
.fm-post.match small { color: #7a5714; }
.fm-post.match::after { content: "✦ 特长匹配"; position: absolute; top: -8px; right: 7px; padding: 1px 7px; border-radius: 999px; font-size: 9.5px; background: linear-gradient(180deg, var(--gold), var(--gold-deep)); color: #4a3413; box-shadow: 0 4px 9px rgba(209,159,72,.4); }
.fm-post.on { border-color: var(--rose); background: linear-gradient(180deg, #fff1f6, #ffe0ec); }
.fm-post.on b::before { content: "驻 · "; color: var(--rose-deep); }
.fm-post.on.match { border-color: var(--gold-deep); background: linear-gradient(180deg, #fff6e8, #ffe6c9); }
.fm-post.recall { grid-column: 1 / -1; text-align: center; border-style: dashed; color: var(--ink-soft); font-size: 11.5px; }

.fm-p-note { margin: 9px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--ink-soft); }
.fm-p-note b { color: var(--rose-deep); }
.fm-p-note.warn { color: var(--rose-deep); }

.fm-team-head :focus-visible, .fm-p-card :focus-visible { outline: none; box-shadow: var(--ring-focus); }

@media (min-width: 960px) {
  .fm-posts { grid-template-columns: repeat(3, 1fr); }
  .fm-post.recall { grid-column: 1 / -1; }
}

@media (prefers-reduced-motion: reduce) {
  .fm-p-card, .fm-post, .fm-shard-bar > i { transition: none; }
  .fm-p-card.signing { animation: none; }
}
`;

export function injectRosterStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}
