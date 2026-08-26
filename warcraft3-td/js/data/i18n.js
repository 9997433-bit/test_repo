/*
 * Tiny i18n helper. `t(key, params)` falls back zh -> en -> key so a missing
 * translation can never blank out the HUD.
 */
(function (global) {
  'use strict';

  var I18N = {
    lang: 'zh',
    listeners: [],

    setLang: function (lang) {
      if (lang !== 'zh' && lang !== 'en') return;
      this.lang = lang;
      for (var i = 0; i < this.listeners.length; i++) this.listeners[i](lang);
    },

    onChange: function (fn) { this.listeners.push(fn); },

    t: function (key, params) {
      var table = global.WC3.Strings[this.lang] || global.WC3.Strings.en;
      var s = table[key];
      if (s === undefined) s = (global.WC3.Strings.en[key] !== undefined ? global.WC3.Strings.en[key] : key);
      if (params) {
        s = s.replace(/\{(\w+)\}/g, function (m, k) {
          return (params[k] !== undefined) ? params[k] : m;
        });
      }
      return s;
    },

    /** Localised display name for any data object with nameZh/nameEn. */
    name: function (def) {
      if (!def) return '';
      return this.lang === 'zh' ? (def.nameZh || def.nameEn) : (def.nameEn || def.nameZh);
    },

    desc: function (def) {
      if (!def) return '';
      return this.lang === 'zh' ? (def.descZh || def.descEn || '') : (def.descEn || def.descZh || '');
    },

    attack: function (type) { return this.t(type + 'Atk'); },
    armor: function (type) { return this.t(type + 'Arm'); }
  };

  global.WC3.I18N = I18N;
  global.WC3.t = function (k, p) { return I18N.t(k, p); };
})(typeof globalThis !== 'undefined' ? globalThis : this);
