/* Tiny localisation helper. Default language is zh-CN per DESIGN.md. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const I18n = {
    lang: 'zh',
    listeners: [],
    set: function (lang) {
      if (!NS.STRINGS[lang]) return;
      this.lang = lang;
      this.listeners.forEach((fn) => fn(lang));
    },
    onChange: function (fn) { this.listeners.push(fn); },
    /** t('waveCleared', {n: 3, bonus: 30}) */
    t: function (key, vars) {
      const table = NS.STRINGS[this.lang] || NS.STRINGS.zh;
      let s = table[key];
      if (s === undefined) s = (NS.STRINGS.en && NS.STRINGS.en[key]) || key;
      if (vars && typeof s === 'string') {
        s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : vars[k]));
      }
      return s;
    },
    /** Localised name from a {zh,en} pair. */
    name: function (pair) {
      if (!pair) return '';
      return pair[this.lang] || pair.en || pair.zh;
    }
  };

  NS.I18n = I18n;
})(typeof globalThis !== 'undefined' ? globalThis : this);
