// 渲染器主体。sim 只交给它一个纯 JSON view，它负责把 view 变成画面。
// 这里不碰 DOM HUD，不读输入，不写游戏状态。

import {
  Clock,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLOBAL_DPR_CAP, QUALITY, resolveTier } from './config.js';
import { createCamera } from './camera.js';
import { createCharacters } from './characters.js';
import { createIsland } from './island.js';
import { createLighting } from './lighting.js';
import { createPost } from './postfx.js';
import { SUN_DIRECTION, createSky } from './sky.js';
import { createTextureLib } from './textures.js';
import { createVfx } from './vfx.js';

const SLAP_EVENTS = new Set(['slap', 'hit', 'strike', 'punch', 'impact', 'contact']);
const HEAVY_EVENTS = new Set([
  'heavy',
  'smash',
  'slam',
  'skill',
  'quake',
  'shatter',
  'tilebreak',
  'tiledestroyed',
  'crack',
  'meteor',
  'land',
  'groundpound',
]);
const FALL_EVENTS = new Set(['fall', 'death', 'out', 'ringout', 'ko', 'eliminated']);
const AWAKEN_EVENTS = new Set(['awaken', 'awakened', 'burst']);
const UP = new Vector3(0, 1, 0);

function eventKind(e) {
  const raw = e?.type ?? e?.kind ?? e?.name ?? e?.event ?? '';
  return String(raw).toLowerCase().replace(/[_\-\s]/g, '');
}

function eventPos(e, out) {
  if (!e) return null;
  if (Number.isFinite(e.x) && Number.isFinite(e.z)) {
    out.set(e.x, Number.isFinite(e.y) ? e.y : 1.1, e.z);
    return out;
  }
  const p = e.pos ?? e.position ?? e.at ?? e.point;
  if (p) {
    if (Array.isArray(p) && p.length >= 3) {
      out.set(p[0], p[1], p[2]);
      return out;
    }
    if (Number.isFinite(p.x)) {
      out.set(p.x, Number.isFinite(p.y) ? p.y : 1.1, Number.isFinite(p.z) ? p.z : 0);
      return out;
    }
  }
  return null;
}

function eventPower(e) {
  const p = e?.power ?? e?.strength ?? e?.force ?? e?.damage ?? e?.impulse;
  if (Number.isFinite(p)) return p > 6 ? p / 12 : p;
  return 1;
}

function pickLocalId(view, opts) {
  if (opts?.localId != null) return opts.localId;
  const direct = view?.localId ?? view?.playerId ?? view?.selfId ?? view?.you;
  if (direct != null) return direct;
  const players = view?.players ?? [];
  const human = players.find((p) => p && (p.kind === 'human' || p.isLocal || p.local));
  return human?.id ?? players[0]?.id ?? null;
}

export class YizhangRenderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.tier = resolveTier(opts.quality ?? 'high');
    this.quality = QUALITY[this.tier];
    this.mobile = !!opts.mobile;
    this.seed = Number.isFinite(opts.seed) ? opts.seed : 20240501;
    this.arenaRadius = Number.isFinite(opts.arenaRadius) ? opts.arenaRadius : 20;
    this.localId = opts.localId ?? null;
    this.spectator = !!opts.spectator;
    this.disposed = false;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false, // MSAA 交给 HDR render target，avoid 双份开销
      alpha: false,
      powerPreference: opts.powerPreference ?? 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: !!opts.preserveDrawingBuffer,
    });
    this.renderer.toneMapping = NoToneMapping; // 色调映射在合成着色器里手做
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 1);
    // 一帧有主渲染 + 自发光通道 + 模糊 + 合成好几次 render()，统计要手动归零才有意义
    this.renderer.info.autoReset = false;

    this.clock = new Clock();
    this.time = 0;
    this.frame = 0;
    this.lastView = null;
    this.lastEventsRef = null;
    this.lastEventCount = 0;
    this.seenEventIds = new Set();

    this.scene = new Scene();
    this.cameraRig = createCamera({ mobile: this.mobile });
    this.camera = this.cameraRig.camera;

    this._focus = new Vector3(0, 0, 0);
    this._vel = new Vector3();
    this._tmp = new Vector3();
    this._tmp2 = new Vector3();
    this._tmp3 = new Vector3();

    this._buildWorld();

    const w = opts.width ?? canvas.clientWidth ?? canvas.width ?? 960;
    const h = opts.height ?? canvas.clientHeight ?? canvas.height ?? 540;
    this.resize(w, h, opts.pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1));
  }

  _buildWorld() {
    const q = this.quality;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = q.softShadows ? PCFSoftShadowMap : PCFShadowMap;

    this.textures = createTextureLib(q, this.seed);
    this.sky = createSky({
      scene: this.scene,
      renderer: this.renderer,
      quality: q,
      textures: this.textures,
      sunDir: SUN_DIRECTION,
    });
    this.lighting = createLighting({ scene: this.scene, quality: q, sunDir: SUN_DIRECTION });
    this.island = createIsland({
      scene: this.scene,
      quality: q,
      textures: this.textures,
      arenaRadius: this.arenaRadius,
      seed: this.seed,
    });
    this.characters = createCharacters({ scene: this.scene, quality: q, textures: this.textures });
    this.vfx = createVfx({ scene: this.scene, quality: q, textures: this.textures, seed: this.seed });
    this.post = createPost({ renderer: this.renderer, scene: this.scene, quality: q });
    this.island.syncTiles(this.lastView?.tiles);
  }

  _teardownWorld() {
    this.post?.dispose();
    this.vfx?.dispose();
    this.characters?.dispose();
    this.island?.dispose();
    this.lighting?.dispose();
    this.sky?.dispose();
    this.textures?.dispose();
    this.post = null;
    this.vfx = null;
    this.characters = null;
    this.island = null;
    this.lighting = null;
    this.sky = null;
    this.textures = null;
  }

  setQuality(tier) {
    const next = resolveTier(tier);
    if (next === this.tier) return this.tier;
    this.tier = next;
    this.quality = QUALITY[next];
    this._teardownWorld();
    this._buildWorld();
    this.resize(this._w, this._h, this._dpr);
    if (this.lastView) this.sync(this.lastView, 0);
    return this.tier;
  }

  resize(width, height, dpr) {
    const w = Math.max(1, Math.floor(width || 1));
    const h = Math.max(1, Math.floor(height || 1));
    const requested = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    // DPR 双重封顶：全局 2，再按画质档收紧
    const ratio = Math.min(requested, this.quality.dprCap, GLOBAL_DPR_CAP);
    this._w = w;
    this._h = h;
    this._dpr = requested;
    this._ratio = ratio;

    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.cameraRig.resize(w / h);
    const bw = Math.floor(w * ratio);
    const bh = Math.floor(h * ratio);
    this.post?.setSize(bw, bh);
    // 点精灵尺寸按后备缓冲高度换算，换分辨率时尘埃不会突然变大变小
    const fovRad = (this.camera.fov * Math.PI) / 180;
    this.vfx?.setPixelScale(bh / (2 * Math.tan(fovRad / 2)));
    return { width: w, height: h, pixelRatio: ratio };
  }

  setMobile(v) {
    this.mobile = !!v;
    this.cameraRig.setMobile(this.mobile);
  }

  /** 观战 / 主菜单 / 结算：不跟人，绕着裂岛慢慢推轨。 */
  setSpectator(v) {
    this.spectator = !!v;
  }

  _processEvents(view) {
    const events = view?.events;
    if (!Array.isArray(events) || events.length === 0) {
      this.lastEventsRef = events ?? null;
      this.lastEventCount = 0;
      return;
    }
    // 同一个数组、同样长度：sim 这一帧没有新事件，别重复放特效
    const sameRef = events === this.lastEventsRef && events.length === this.lastEventCount;
    this.lastEventsRef = events;
    this.lastEventCount = events.length;
    if (sameRef) return;

    const pos = this._tmp;
    for (const e of events) {
      if (!e) continue;
      const id = e.id ?? e.seq ?? e.eventId ?? null;
      if (id != null) {
        const key = `${id}`;
        if (this.seenEventIds.has(key)) continue;
        this.seenEventIds.add(key);
        if (this.seenEventIds.size > 512) {
          this.seenEventIds = new Set(Array.from(this.seenEventIds).slice(-128));
        }
      }
      this._handleEvent(e, pos);
    }
  }

  _handleEvent(e, pos) {
    const kind = eventKind(e);
    const power = eventPower(e);
    const attackerId = e.attacker ?? e.attackerId ?? e.by ?? e.source ?? e.playerId ?? e.id;
    const targetId = e.target ?? e.targetId ?? e.victim ?? e.to;

    const attacker = attackerId != null ? this.characters.get(attackerId) : null;
    const target = targetId != null ? this.characters.get(targetId) : null;

    let at = eventPos(e, pos);
    if (!at) {
      const src = target ?? attacker;
      if (src) {
        pos.copy(src.pos);
        pos.y += 1.2;
        at = pos;
      }
    }

    const dir = this._tmp2;
    if (Number.isFinite(e.dx) && Number.isFinite(e.dz)) dir.set(e.dx, 0, e.dz);
    else if (attacker && target) dir.copy(target.pos).sub(attacker.pos);
    else if (attacker) dir.set(Math.sin(attacker.yaw), 0, Math.cos(attacker.yaw));
    else dir.set(0, 0, 1);

    const localHit = targetId != null && targetId === this.localId;
    const localSwing = attackerId != null && attackerId === this.localId;

    if (SLAP_EVENTS.has(kind)) {
      if (attacker) {
        const local = this._tmp3.copy(dir).applyAxisAngle(UP, -attacker.yaw);
        const side = local.x >= 0 ? 1 : -1;
        this.characters.playSlap(attackerId, power, side);
      }
      if (at) this.vfx.slap(at, dir, power);
      if (target) this.characters.playHit(targetId, dir, power);
      // 命中反馈：自己挨打最震，自己打中次之，别人互殴只有一点点
      const scale = localHit ? 0.55 : localSwing ? 0.34 : 0.12;
      this.cameraRig.impulse(scale * power, localHit ? 2.6 : 1.2);
      return;
    }

    if (HEAVY_EVENTS.has(kind)) {
      if (attacker && kind !== 'tilebreak') this.characters.playSlap(attackerId, power * 1.3);
      if (at) this.vfx.heavyImpact(at, power * 1.35, { dir });
      if (target) this.characters.playHit(targetId, dir, power * 1.3);
      const scale = localHit ? 0.95 : localSwing ? 0.62 : 0.28;
      this.cameraRig.impulse(scale * power, localHit ? 4.2 : 2.2);
      return;
    }

    if (FALL_EVENTS.has(kind)) {
      if (at) this.vfx.fallTrail(at.x, at.y, at.z);
      if (localHit || (attackerId != null && attackerId === this.localId)) {
        this.cameraRig.impulse(0.4, 1.5);
      }
      return;
    }

    if (AWAKEN_EVENTS.has(kind)) {
      const src = attacker ?? target;
      if (src) {
        for (let i = 0; i < 6; i++) this.vfx.awakenMotes(src.pos.x, src.pos.y + 1.2, src.pos.z);
      }
      this.cameraRig.impulse(localSwing ? 0.3 : 0.1, 1.2);
    }
  }

  /** 主入口：接收 sim 的 view 快照，推进渲染状态并出一帧。 */
  sync(view, dtOverride) {
    if (this.disposed) return;
    const dt = Math.min(
      0.05,
      Number.isFinite(dtOverride) ? dtOverride : this.clock.getDelta()
    );
    this.time += dt;
    this.frame++;
    this.renderer.info.reset();

    const v = view && typeof view === 'object' ? view : {};
    this.lastView = v;
    if (Number.isFinite(v.arenaRadius) && v.arenaRadius !== this.arenaRadius) {
      this.arenaRadius = v.arenaRadius;
    }
    this.localId = pickLocalId(v, this.opts);

    const players = Array.isArray(v.players) ? v.players.filter(Boolean) : [];
    this.characters.reconcile(players, this.localId);
    this.island.syncTiles(v.tiles);
    this._processEvents(v);

    this.characters.update(dt, this.time);
    this.island.update(dt, this.time);

    // 环境反馈：走得快扬尘，觉醒冒余烬，掉下去拖一条尘尾
    for (const p of players) {
      const c = this.characters.get(p.id);
      if (!c || p.alive === false) continue;
      if (c.speed > 3.2 && this.frame % 3 === 0) {
        this.vfx.footDust(c.pos.x, Math.max(0, c.pos.y), c.pos.z, c.speed);
      }
      if ((p.awakenedT ?? 0) > 0) {
        for (const arm of c.arms) {
          arm.glove.getWorldPosition(this._tmp);
          this.vfx.awakenMotes(this._tmp.x, this._tmp.y, this._tmp.z);
        }
      }
      if (c.pos.y < -1.5) this.vfx.fallTrail(c.pos.x, c.pos.y, c.pos.z);
    }

    const local = this.spectator || this.localId == null ? null : this.characters.get(this.localId);
    if (local) {
      this._focus.copy(local.pos);
      this._vel.set(
        (local.pos.x - local.prev.x) / Math.max(dt, 1e-4),
        0,
        (local.pos.z - local.prev.z) / Math.max(dt, 1e-4)
      );
      this.cameraRig.update(dt, this._focus, local.yaw, this._vel);
    } else {
      this.cameraRig.orbit(dt, this.time, this.arenaRadius * 1.35);
      this._focus.set(0, 0, 0);
    }

    this.vfx.update(dt, this.time);
    this.lighting.update(this.time, this._focus);
    this.sky.update(this.time, this.camera.position);

    this.post.render(this.camera);
  }

  /** 不带 view 的空转，主要给启动画面 / 暂停时用。 */
  renderIdle(dt) {
    this.sync(this.lastView ?? {}, dt);
  }

  getStats() {
    const info = this.renderer.info;
    return {
      tier: this.tier,
      pixelRatio: this._ratio,
      size: [this._w, this._h],
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      programs: info.programs?.length ?? 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      characters: this.characters?.chars.size ?? 0,
      plates: this.island?.plates.size ?? 0,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this._teardownWorld();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.lastView = null;
    this.seenEventIds.clear();
  }
}
