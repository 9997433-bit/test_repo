/*
 * Guards the two hard constraints that are easy to break by accident:
 *   1. no trademarked names anywhere in the shipped files;
 *   2. the game stays loadable straight from file:// (classic scripts only,
 *      no external requests, no ES-module imports in the browser bundle).
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Deliberately narrow: only names that are specific to one publisher's games.
// Generic fantasy vocabulary (knight, ghoul, ziggurat, ...) is fair game.
const TRADEMARKS = [
  'warcraft', 'blizzard', 'azeroth', 'lordaeron', 'quel\'thalas', 'northrend',
  'arthas', 'illidan', 'thrall', 'sylvanas', 'kel\'thuzad', 'archimonde',
  'nerubian', 'the scourge', 'frozen throne', 'burning legion', 'night elf',
  'nightelf', 'lich king', 'moon well', 'ancient of war', 'demon hunter',
  'blademaster', 'batrider', 'headhunter', 'farseer', 'starcraft', 'diablo',
  '\u9b54\u517d\u4e89\u9738',   // Warcraft
  '\u66b4\u96ea',               // Blizzard
  '\u6d1b\u4e39\u4f26',         // Lordaeron
  '\u963f\u5c14\u8428\u65af',   // Arthas
  '\u4f0a\u5229\u4e39',         // Illidan
  '\u5929\u707e',               // Scourge
  '\u86db\u9b54',               // Nerubian
  '\u9ed1\u6697\u4e4b\u95e8'    // Dark Portal
];

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function shippedFiles() {
  return walk(ROOT, []).filter(function (f) {
    // DESIGN.md is the upstream brief and names its inspiration on purpose.
    if (path.basename(f) === 'DESIGN.md') return false;
    return /\.(js|mjs|html|css|md|json)$/.test(f);
  });
}

module.exports = function (t) {
  t.test('no trademarked names survive in any shipped file', function () {
    const hits = [];
    for (const file of shippedFiles()) {
      const rel = path.relative(ROOT, file);
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach(function (line, i) {
        // The guard list itself obviously contains the words it looks for.
        if (rel === path.join('tests', 'assets.test.js')) return;
        // The containing directory name is fixed by the task brief.
        const low = line.toLowerCase().split('warcraft3-td').join('');
        for (const term of TRADEMARKS) {
          if (low.indexOf(term) !== -1) hits.push(rel + ':' + (i + 1) + ' "' + term + '"');
        }
      });
    }
    t.eq(hits.length, 0, 'trademark hits ->\n       ' + hits.join('\n       '));
  });

  t.test('index.html only loads local classic scripts', function () {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    t.eq(/type\s*=\s*["']module["']/.test(html), false, 'no ES modules (file:// blocks them)');
    t.eq(/(src|href)\s*=\s*["'](https?:)?\/\//.test(html), false, 'no remote assets');
    t.eq(/<img\b/i.test(html), false, 'no image files: every sprite is canvas-drawn');
  });

  t.test('every script index.html loads actually exists', function () {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const re = /<script[^>]*\ssrc\s*=\s*["']([^"']+)["']/g;
    let m;
    let n = 0;
    while ((m = re.exec(html))) {
      t.ok(fs.existsSync(path.join(ROOT, m[1])), 'missing script ' + m[1]);
      n++;
    }
    t.gt(n, 20, 'expected the full script list to be present');
  });

  t.test('the runner loads the same sources index.html does', function () {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const runner = fs.readFileSync(path.join(ROOT, 'tests', 'run.mjs'), 'utf8');
    const re = /<script[^>]*\ssrc\s*=\s*["'](js\/(?:config|engine|data|entities|sim)\/?[^"']*)["']/g;
    let m;
    // input and audio need a live DOM / WebAudio context, so they stay out of
    // the headless runner; everything the simulation touches must be in.
    const BROWSER_ONLY = ['js/engine/input.js', 'js/engine/audio.js'];
    while ((m = re.exec(html))) {
      if (/\/(render|ui)\//.test(m[1]) || m[1] === 'js/main.js') continue;
      if (BROWSER_ONLY.indexOf(m[1]) !== -1) continue;
      t.ok(runner.indexOf("'" + m[1] + "'") !== -1, m[1] + ' is missing from tests/run.mjs');
    }
  });
};
