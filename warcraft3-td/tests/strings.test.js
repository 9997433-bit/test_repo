/*
 * The UI looks up localisation keys by name, so a typo or a rename shows up as
 * raw key text on screen rather than as a crash. These tests turn that class of
 * silent bug into a red test.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

module.exports = function (t, WC3) {
  const zh = WC3.Strings.zh;
  const en = WC3.Strings.en;

  t.test('both languages define exactly the same keys', function () {
    const onlyZh = Object.keys(zh).filter(function (k) { return !(k in en); });
    const onlyEn = Object.keys(en).filter(function (k) { return !(k in zh); });
    t.eq(onlyZh.join(',') + '|' + onlyEn.join(','), '|', 'key sets differ');
    t.gt(Object.keys(zh).length, 80, 'the tables should be substantial');
  });

  t.test('no string is left empty', function () {
    [['zh', zh], ['en', en]].forEach(function (pair) {
      Object.keys(pair[1]).forEach(function (k) {
        t.ok(typeof pair[1][k] === 'string' && pair[1][k].length > 0,
          pair[0] + '.' + k + ' is empty');
      });
    });
  });

  t.test('placeholders match between languages', function () {
    const holes = function (s) {
      return (s.match(/\{(\w+)\}/g) || []).sort().join(',');
    };
    Object.keys(zh).forEach(function (k) {
      t.eq(holes(zh[k]), holes(en[k]), 'placeholder mismatch in "' + k + '"');
    });
  });

  t.test('every t() key used by the UI exists', function () {
    const missing = [];
    walk(path.join(ROOT, 'js'), []).forEach(function (file) {
      const src = fs.readFileSync(file, 'utf8');
      // Trailing `)` or `,` keeps concatenated keys like t('t' + mode) out.
      const re = /\b(?:I18N\.t|WC3\.t|t)\(\s*'([A-Za-z][\w]*)'\s*[),]/g;
      let m;
      while ((m = re.exec(src))) {
        if (!(m[1] in zh)) missing.push(path.relative(ROOT, file) + ' -> ' + m[1]);
      }
    });
    t.eq(missing.length, 0, 'unknown keys ->\n       ' + missing.join('\n       '));
  });

  t.test('every data-i18n attribute in index.html exists', function () {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const re = /data-i18n\s*=\s*"([^"]+)"/g;
    let m;
    let n = 0;
    while ((m = re.exec(html))) {
      t.ok(m[1] in zh, 'index.html uses unknown key "' + m[1] + '"');
      n++;
    }
    t.gt(n, 4, 'expected the static HUD labels to be localised');
  });

  t.test('every targeting mode has a localised label', function () {
    WC3.Tower.TARGET_MODES.forEach(function (mode) {
      const key = 't' + mode.charAt(0).toUpperCase() + mode.slice(1);
      t.ok(key in zh, 'targeting mode ' + mode + ' has no label (' + key + ')');
    });
  });

  t.test('every hero ability key resolves to a real string', function () {
    const heroes = WC3.Hero.HEROES;
    Object.keys(heroes).forEach(function (id) {
      const h = heroes[id];
      t.ok(h.qKey in zh, id + ' Q ability key "' + h.qKey + '" is not localised');
      t.ok(h.wKey in zh, id + ' W ability key "' + h.wKey + '" is not localised');
      t.ok(h.nameZh && h.nameEn, id + ' is missing a display name');
    });
  });

  t.test('every attack and armor type has a localised label', function () {
    WC3.Damage.ATTACK_TYPES.forEach(function (a) {
      t.ok((a + 'Atk') in zh, 'attack type ' + a + ' has no label');
    });
    WC3.Damage.ARMOR_TYPES.forEach(function (a) {
      t.ok((a + 'Arm') in zh, 'armor type ' + a + ' has no label');
    });
  });

  t.test('every tower and creep carries both localisations', function () {
    WC3.TowerData.TOWER_LIST.forEach(function (d) {
      t.ok(d.nameZh && d.nameEn, d.id + ' is missing a name');
      t.ok(d.descZh && d.descEn, d.id + ' is missing a description');
    });
    const creeps = WC3.WaveData.CREEPS;
    Object.keys(creeps).forEach(function (id) {
      t.ok(creeps[id].nameZh && creeps[id].nameEn, 'creep ' + id + ' is missing a name');
    });
  });

  t.test('i18n falls back instead of blanking the HUD', function () {
    const I18N = WC3.I18N;
    const before = I18N.lang;
    I18N.setLang('zh');
    t.eq(I18N.t('gold'), zh.gold, 'zh lookup');
    t.eq(I18N.t('__nope__'), '__nope__', 'unknown key returns the key itself');
    t.eq(I18N.t('logLumber', { n: 7 }), zh.logLumber.replace('{n}', '7'), 'params interpolate');
    I18N.setLang('en');
    t.eq(I18N.t('gold'), en.gold, 'en lookup');
    I18N.setLang(before);
  });
};
