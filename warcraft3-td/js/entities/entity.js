/*
 * Entity lifecycle primitives: monotonic ids, object pools and in-place
 * compaction. Every per-tick list in the sim is a plain array that gets
 * compacted once per tick, so there are no holes and no allocation churn.
 */
(function (global) {
  'use strict';

  function IdSource(start) {
    this.value = start || 0;
  }
  IdSource.prototype.next = function () {
    this.value += 1;
    return this.value;
  };
  IdSource.prototype.reset = function (v) {
    this.value = v || 0;
  };

  /**
   * Fixed-shape object pool. `factory` builds a blank instance; the caller is
   * responsible for (re)initialising it after obtain().
   */
  function Pool(factory, prealloc) {
    this.factory = factory;
    this.free = [];
    this.created = 0;
    this.peak = 0;
    for (var i = 0; i < (prealloc || 0); i++) {
      this.free.push(this._make());
    }
  }

  Pool.prototype._make = function () {
    this.created++;
    return this.factory();
  };

  Pool.prototype.obtain = function () {
    var o = this.free.length ? this.free.pop() : this._make();
    o.alive = true;
    return o;
  };

  Pool.prototype.release = function (o) {
    o.alive = false;
    this.free.push(o);
  };

  /**
   * Drop dead entities from `list`, returning them to `pool`.
   * Order-preserving so iteration stays deterministic.
   */
  Pool.prototype.sweep = function (list) {
    var j = 0;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.alive) {
        list[j++] = e;
      } else {
        this.free.push(e);
      }
    }
    if (list.length > this.peak) this.peak = list.length;
    list.length = j;
    return list;
  };

  function compact(list) {
    var j = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].alive) list[j++] = list[i];
    }
    list.length = j;
    return list;
  }

  var API = { IdSource: IdSource, Pool: Pool, compact: compact };

  global.WC3.Entity = API;

  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
