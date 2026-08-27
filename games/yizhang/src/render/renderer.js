// 渲染器主体。sim 只交给它一个纯 JSON view，它负责把 view 变成画面。
// 这里不碰 DOM HUD，不读输入，不写游戏状态。
//
// view 的解析全部收在 ./view.js：真实契约见那个文件头部的字段清单。

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
import { BASE_PITCH, PITCH_LIMIT, createCamera } from './camera.js';
import { createCharacters } from './characters.js';
import { skinTable } from './skins.js';
import { combatVfxKind, createCombatVfx, skillVfxKind } from './combat-vfx.js';
import { createHubScene } from './hub.js';
import { createIsland } from './island.js';
import { createLighting } from './lighting.js';
import { createPost } from './postfx.js';
import { SUN_DIRECTION, createSky } from './sky.js';
import { createTextureLib } from './textures.js';
import { createVfx } from './vfx.js';
import { forwardFromYaw, readView } from './view.js';

const UP = new Vector3(0, 1, 0);

function forwardOf(yaw, out) {
  const f = forwardFromYaw(yaw);
  return out.set(f.x, 0, f.z);
}

export class YizhangRenderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.tier = resolveTier(opts.quality ?? opts.tier ?? 'high');
    this.quality = QUALITY[this.tier];
    this.mobile = !!opts.mobile;
    this.seed = Number.isFinite(opts.seed) ? opts.seed : 20240501;
    this.arenaRadius = Number.isFinite(opts.arenaRadius) ? opts.arenaRadius : 20;
    // 本地玩家：opts 优先，其次 view 自报，最后按 view.js 的默认（p0）
    this.forcedLocalId = opts.localId ?? null;
    this.followId = opts.followId ?? null;
    this.localId = this.forcedLocalId;
    this.spectator = !!opts.spectator;
    this.disposed = false;
    // 抬头 / 低头。null = 壳层还没接线，镜头维持静止机位的俯角（camera.js 的 BASE_PITCH）。
    // 语义与 src/input 的 getLook().pitch 一致：正 = 往下看。
    this.lookPitch = Number.isFinite(opts.pitch) ? opts.pitch : null;
    this.lookYaw = Number.isFinite(opts.lookYaw) ? opts.lookYaw : null;
    // 皮肤表：壳层把已经 resolveSkins 过的表、或 data 命名空间喂进来。
    // 不喂就用兜底表，冒烟台 / 单测不必绑 src/data。
    this.skins = opts.skins || skinTable(opts.data ?? null);

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
    // 阴影贴图一帧只烘一次。默认的 autoUpdate 是「每次 render() 都重烘」，而一帧里
    // 主渲染与自发光通道各调一次 render()，第二次那趟阴影是纯粹白付的
    // （中档实测 55 个 drawcall / 32k 三角形）。改成每帧开工前手动置一次脏。
    this.renderer.shadowMap.autoUpdate = false;

    this.clock = new Clock();
    this.time = 0;
    this.frame = 0;
    /** 最近一次解析出来的 view（./view.js 的形状）。 */
    this.view = null;
    this.lastRawEvents = null;
    this.lastTick = null;

    this.scene = new Scene();
    this.cameraRig = createCamera({ mobile: this.mobile });
    this.camera = this.cameraRig.camera;

    this._focus = new Vector3(0, 0, 0);
    /** 角色距离剔除的圆心，见 update() 里的赋值。 */
    this._cullAt = new Vector3(0, 0, 0);
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
    this.characters = createCharacters({
      scene: this.scene,
      quality: q,
      textures: this.textures,
      skins: this.skins,
    });
    // 安全区：phase === 'hub' 时才可见，裂岛那一套完全不受影响
    this.hub = createHubScene({
      scene: this.scene,
      quality: q,
      textures: this.textures,
      seed: this.seed,
    });
    this.vfx = createVfx({ scene: this.scene, quality: q, textures: this.textures, seed: this.seed });
    // 每掌一套的战斗特效：分派键是 gloveId / skillId，见 ./combat-vfx.js
    this.combatVfx = createCombatVfx({
      scene: this.scene,
      quality: q,
      textures: this.textures,
      seed: this.seed,
    });
    this.post = createPost({ renderer: this.renderer, scene: this.scene, quality: q });
    if (this.view) {
      this.island.syncTiles(this.view.tiles, this.view.arena);
      this.characters.reconcile(this.view.players, this.localId);
      this.island.setActive(!this.hub.sync(this.view.hub, 1 / 60, this.time));
    }
  }

  _teardownWorld() {
    this.post?.dispose();
    this.combatVfx?.dispose();
    this.combatVfx = null;
    this.vfx?.dispose();
    this.hub?.dispose();
    this.characters?.dispose();
    this.island?.dispose();
    this.lighting?.dispose();
    this.sky?.dispose();
    this.textures?.dispose();
    this.post = null;
    this.vfx = null;
    this.hub = null;
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
    const pixelScale = bh / (2 * Math.tan(fovRad / 2));
    this.vfx?.setPixelScale(pixelScale);
    this.combatVfx?.setPixelScale(pixelScale);
    this.hub?.setPixelScale(pixelScale);
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

  /** 主循环换人（分屏、观战某个 bot）时用；不给就回到 view 自己的判断。 */
  setLocalId(id) {
    this.forcedLocalId = id ?? null;
    return this.forcedLocalId;
  }

  /** main.js 的旧名字。语义与 setLocalId 相同。 */
  setFollow(id) {
    return this.setLocalId(id);
  }

  /**
   * 抬头 / 低头（以及可选的镜头朝向）。壳层每帧调一次即可：
   *
   *   renderer.setLook(input.getLook());     // { yaw, pitch }
   *
   * pitch 与 `src/input` 同一套约定：**正 = 往下看**，镜头随之抬高、视点压低；
   * 单位弧度，内部夹在 ±PITCH_LIMIT。不调用就维持静止机位的俯角。
   *
   * yaw 是可选的，且必须是**项目唯一那套朝向约定**：yaw = 0 面向 -Z，与
   * `sim/math.js` 的 forwardX/forwardZ 一致。壳层的输入 yaw 走的是相机系
   * （`simYawToCameraYaw`），别原样丢进来 —— 不给 yaw 时镜头跟角色自己的朝向，
   * 那条路一直是对的。
   *
   * `core/look.js` 每帧给的那份 payload 会额外带一个 `simYaw`。**它优先**：
   * 相机系的角度混进 `yaw` 时机位会与角色面向、扇击锥分家，玩家对着画面里的人
   * 出掌会打向另一边。
   *
   * @param {{pitch?: number, yaw?: number, simYaw?: number}|number} look
   * @returns {{pitch: number|null, yaw: number|null}}
   */
  setLook(look = {}) {
    const o = typeof look === 'number' ? { pitch: look } : look || {};
    if (Number.isFinite(o.pitch)) {
      this.lookPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, o.pitch));
    } else if (o.pitch === null) {
      this.lookPitch = null;
    }
    const yaw = o.simYaw === undefined ? o.yaw : o.simYaw;
    if (Number.isFinite(yaw)) this.lookYaw = yaw;
    else if (yaw === null) this.lookYaw = null;
    return { pitch: this.lookPitch, yaw: this.lookYaw };
  }

  /** setLook 的单值写法。 */
  setPitch(pitch) {
    return this.setLook({ pitch }).pitch;
  }

  /** 当前实际用掉的俯角（含静止机位基准），主要给探针与冒烟台读。 */
  getLook() {
    return {
      pitch: this.lookPitch ?? BASE_PITCH,
      yaw: this.lookYaw,
      cameraPitch: this.cameraRig.state.pitchOut,
    };
  }

  /** 本帧要喂给相机的抬头量：绝对俯角减去静止机位基准。 */
  _pitchBias() {
    return this.lookPitch == null ? 0 : this.lookPitch - BASE_PITCH;
  }

  _arenaChanged(radius) {
    if (!Number.isFinite(radius) || Math.abs(radius - this.arenaRadius) < 0.01) return;
    // 岩体的几何是按半径烘出来的，半径真的变了就得重建一次（一局只会发生一次）
    this.arenaRadius = radius;
    this._teardownWorld();
    this._buildWorld();
    this.resize(this._w, this._h, this._dpr);
  }

  /**
   * 事件去重。
   *
   * sim 每个 step 都会清空并重填 state.events，getView 又会拷成新数组，所以
   * 「同一批事件」的唯一稳定标识是 view.tick：一个 tick 的事件只放一次特效，
   * 中间那些插值帧不会把同一记耳光放三遍。没有 tick 的 view 退回比对原始数组引用。
   */
  _consumeEvents(v, rawEvents) {
    if (v.tick != null) {
      if (v.tick === this.lastTick) return;
      this.lastTick = v.tick;
    } else {
      if (rawEvents === this.lastRawEvents) return;
      this.lastRawEvents = rawEvents;
    }
    if (v.events.length === 0) return;
    for (const e of v.events) this._handleEvent(e);
  }

  _eventPos(e, actor, target, out) {
    if (e.x != null && e.z != null) {
      out.set(e.x, e.y != null ? e.y : 1.1, e.z);
      return out;
    }
    const src = target ?? actor;
    if (src) {
      out.copy(src.pos);
      out.y += 1.2;
      return out;
    }
    return null;
  }

  /**
   * 这一记是哪只掌打的。
   *
   * sim 的 `slap` / `slapStart` / `skill` 事件自带 gloveId，`hit` 没有 —— 那就问动手
   * 的那个人现在拿的是哪只掌（渲染层本来就跟着 `activeGloveId` 在换识别色）。
   */
  _gloveOf(e, actor) {
    return e.gloveId ?? actor?.activeGloveId ?? null;
  }

  /** 出掌的识别色，用来给特效做点缀（不整片染色，见 combat-vfx 的纪律）。 */
  _tintOf(actor) {
    return actor ? actor.mats.paint.color : null;
  }

  _strike(e, actor, at, dir, power, opts = {}) {
    if (!at || !this.combatVfx) return null;
    const gloveId = this._gloveOf(e, actor);
    const kind = opts.skill ? skillVfxKind(e.skillId, gloveId) : combatVfxKind(gloveId);
    this.combatVfx.strike(kind, at, dir, power, { ...opts, tint: this._tintOf(actor) });
    return kind;
  }

  _handleEvent(e) {
    const actor = e.actorId != null ? this.characters.get(e.actorId) : null;
    const target = e.targetId != null ? this.characters.get(e.targetId) : null;
    const power = e.power;
    const localHit = e.targetId != null && e.targetId === this.localId;
    const localActed = e.actorId != null && e.actorId === this.localId;

    const dir = this._tmp2;
    if (actor && target) dir.copy(target.pos).sub(actor.pos);
    else if (e.yaw != null) forwardOf(e.yaw, dir);
    else if (actor) forwardOf(actor.yaw, dir);
    else dir.set(0, 0, -1);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);

    switch (e.kind) {
      case 'swing': {
        // 前摇就起手，出掌的加速段才对得上判定生效的那一刻
        if (actor) this.characters.playSlap(e.actorId, power);
        break;
      }

      case 'slap': {
        if (actor) this.characters.playSlap(e.actorId, power);
        // hits 是 sim 数出来的命中数：一掌扇空只有掌风，不该有冲击。
        // 但「哪只掌扇空的」还是要看得出来，所以走的是这只掌自己的形，只是没有残留。
        if (e.hits === 0 && actor) {
          const at = this._tmp.copy(actor.pos).addScaledVector(dir, 1.4);
          at.y += 1.15;
          this._strike(e, actor, at, dir, power * 0.7, { whiff: true });
        }
        break;
      }

      case 'hit': {
        const at = this._eventPos(e, actor, target, this._tmp);
        // 通用的接触感（激波 + 尘）之上再叠这只掌自己的形：谁打的一眼可辨
        if (at) this.vfx.slap(at, dir, power);
        if (at) this._strike(e, actor, at, dir, power);
        if (actor) {
          // 挥的是哪只手：把击退方向转回角色自身坐标系看左右
          const local = this._tmp3.copy(dir).applyAxisAngle(UP, -actor.yaw);
          this.characters.playSlap(e.actorId, power, local.x >= 0 ? 1 : -1);
        }
        if (target) this.characters.playHit(e.targetId, dir, power);
        // 命中反馈：自己挨打最震，自己打中次之，别人互殴只有一点点
        const scale = localHit ? 0.55 : localActed ? 0.34 : 0.12;
        this.cameraRig.impulse(scale * power, localHit ? 2.6 : 1.2);
        break;
      }

      case 'heavy': {
        const at = this._eventPos(e, actor, target, this._tmp);
        if (at) this.vfx.heavyImpact(at, power * 1.3, { dir });
        if (at) this._strike(e, actor, at, dir, power * 1.3, { skill: true });
        if (target) this.characters.playHit(e.targetId, dir, power * 1.3);
        const scale = localHit ? 0.95 : localActed ? 0.62 : 0.28;
        this.cameraRig.impulse(scale * power, localHit ? 4.2 : 2.2);
        break;
      }

      case 'skill': {
        const at = this._eventPos(e, actor, target, this._tmp);
        if (actor) this.characters.playSlap(e.actorId, power * 1.2);
        const kind = at ? this._strike(e, actor, at, dir, power * 1.15, { skill: true }) : null;
        // 只有真的砸地的两套（岩楔 / 陨坑）另外要一圈贴地压环与裂纹：
        // 霜弧、磁弧、错位并不「砸」，再叠一层通用重击就把八掌又抹平了
        if (at && (kind === 'slab' || kind === 'cinder')) {
          this.vfx.heavyImpact(at, power * 1.15, { dir, crack: false });
        }
        this.cameraRig.impulse(localActed ? 0.5 : 0.16, localActed ? 2.4 : 1);
        break;
      }

      case 'ko': {
        const at = this._eventPos(e, actor, target, this._tmp);
        if (at) this.vfx.fallTrail(at.x, at.y, at.z);
        // ko 的 id 是掉下去的人，by 才是凶手
        if (localActed || localHit) this.cameraRig.impulse(0.4, 1.5);
        break;
      }

      case 'awaken': {
        const src = actor ?? target;
        if (src) {
          for (let i = 0; i < 8; i++) this.vfx.awakenMotes(src.pos.x, src.pos.y + 1.2, src.pos.z);
        }
        this.cameraRig.impulse(localActed ? 0.3 : 0.1, 1.2);
        break;
      }

      case 'dash': {
        if (e.x != null) this.vfx.footDust(e.x, Math.max(0, e.y ?? 0) + 0.05, e.z, 6);
        break;
      }

      case 'jump':
      case 'respawn': {
        if (e.x != null) this.vfx.footDust(e.x, Math.max(0, e.y ?? 0) + 0.05, e.z, 5);
        break;
      }

      case 'tileCrack': {
        const rec = this.island.crackTile(e, 0.45);
        const x = e.x ?? rec?.x;
        const z = e.z ?? rec?.z;
        if (x != null) this.vfx.footDust(x, 0.08, z, 6);
        break;
      }

      case 'tileBreak': {
        const rec = this.island.breakTile(e);
        const x = e.x ?? rec?.x;
        const z = e.z ?? rec?.z;
        if (x == null) break;
        // 塌一块台面：碎屑往下掉、尘从洞口涌上来，然后画面上真的少一块地
        this._tmp.set(x, 0.1, z);
        this.vfx.spawnDebris(this._tmp, 1.5);
        this.vfx.heavyImpact(this._tmp, 1.2, { dir: UP, crack: false });
        const local = this.characters.get(this.localId);
        const near = local ? Math.hypot(local.pos.x - x, local.pos.z - z) : 99;
        this.cameraRig.impulse(near < 8 ? 0.5 : 0.18, near < 8 ? 2 : 0.8);
        break;
      }

      default:
        break;
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

    const raw = view && typeof view === 'object' ? view : {};
    const v = readView(raw, { localId: this.forcedLocalId, followId: this.followId });
    this.lastRaw = raw;
    this.view = v;
    this.localId = v.localId;
    this._arenaChanged(v.arena.radius);

    this.characters.reconcile(v.players, this.localId);
    // 分身残影：sim 每帧给一份存活的快照，这里照着画半透复本（空数组就是没有）
    this.characters.syncGhosts(v.ghosts);
    this.island.syncTiles(v.tiles, v.arena);
    // 安全区与裂岛在世界坐标里错开（走道在 z ≈ -120，裂岛在原点）。两区从来不同框，
    // 所以谁都别替对方付钱：phase === 'hub' 时裂岛整棵关掉，phase === 'arena' 时
    // 安全区整棵关掉。台面那块 InstancedMesh 是 frustumCulled = false 的，
    // 不显式关掉的话，人在走道上时它照样每帧画满一整座岛。
    const inHub = this.hub.sync(v.hub, dt, this.time);
    this.island.setActive(!inHub);
    this._consumeEvents(v, raw.events);

    // 距离剔除的圆心取本帧本地玩家在 sim 里的坐标 —— this._focus 是上一帧算完镜头才写的，
    // 第一帧还停在原点（= 裂岛），拿它当圆心会把岛上的 Bot 全判进圈、走道上一个都不留。
    // 观战时没有本地玩家，圆心退回镜头焦点（绕岛环绕，本来就该看见岛上的人）。
    const localView =
      this.spectator || this.localId == null ? null : v.players.find((p) => p.id === this.localId);
    if (localView) this._cullAt.set(localView.x ?? 0, 0, localView.z ?? 0);
    else this._cullAt.set(this._focus.x, 0, this._focus.z);
    this.characters.update(dt, this.time, this._cullAt);
    this.island.update(dt, this.time);

    // 环境反馈：走得快扬尘，觉醒冒余烬，掉下去拖一条尘尾
    for (const p of v.players) {
      const c = this.characters.get(p.id);
      // 被距离剔除掉的人（另一个区里的 Bot）不该往粒子池里挤尘
      if (!c || !p.alive || !c.rootGroup.visible) continue;
      if (c.speed > 3.2 && p.grounded && this.frame % 3 === 0) {
        this.vfx.footDust(c.pos.x, Math.max(0, c.pos.y), c.pos.z, c.speed);
      }
      if (p.awakenedT > 0) {
        for (const arm of c.arms) {
          arm.glove.getWorldPosition(this._tmp);
          this.vfx.awakenMotes(this._tmp.x, this._tmp.y, this._tmp.z);
        }
      }
      // 掉进破洞 / 出岛：一路拖尘，观众才知道人去哪了
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
      const yaw = this.lookYaw == null ? local.yaw : this.lookYaw;
      this.cameraRig.update(dt, this._focus, yaw, this._vel, { pitchBias: this._pitchBias() });
    } else {
      this.cameraRig.orbit(dt, this.time, this.arenaRadius * 1.35);
      this._focus.set(0, 0, 0);
    }

    this.vfx.ambientDrift(dt, this._focus);
    this.vfx.update(dt, this.time);
    this.combatVfx.update(dt, this.time);
    this.lighting.update(this.time, this._focus);
    this.sky.update(this.time, this.camera.position);

    // 一帧一次：post.render 里的自发光通道不该再烘一遍同一张阴影贴图
    this.renderer.shadowMap.needsUpdate = this.quality.shadows;
    this.post.render(this.camera);
  }

  /** 不带 view 的空转，主要给启动画面 / 暂停时用。 */
  renderIdle(dt) {
    this.sync(this.lastRaw ?? {}, dt);
  }

  getStats() {
    const info = this.renderer.info;
    const hub = this.hub?.getStats() ?? null;
    return {
      tier: this.tier,
      phase: this.view?.hub?.active ? 'hub' : 'arena',
      hub,
      pixelRatio: this._ratio,
      size: [this._w, this._h],
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      programs: info.programs?.length ?? 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      characters: this.characters?.chars.size ?? 0,
      ghosts: this.characters?.ghostCount ?? 0,
      combat: this.combatVfx?.getStats() ?? null,
      pitch: this.cameraRig.state.pitchOut,
      tiles: this.island?.tileCount ?? 0,
      localId: this.localId,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this._teardownWorld();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.view = null;
  }
}
