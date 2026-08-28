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
} from './gfx.js';
import { GLOBAL_DPR_CAP, QUALITY, resolveTier } from './config.js';
import { BASE_PITCH, CAMERA_SNAP_TELEPORT, PITCH_LIMIT, createCamera } from './camera.js';
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

/** 固定人物视角 / 自由视角。缺省锁视角（GOAL：产品默认钉在角色背后）。 */
const LOOK_MODES = ['locked', 'free'];
const DEFAULT_LOOK_MODE = 'locked';

/** 认不出来的值一律当成「没说」，返回 null 由调用点决定要不要改。 */
function normalizeLookMode(mode) {
  if (typeof mode !== 'string') return null;
  const m = mode.trim().toLowerCase();
  return LOOK_MODES.includes(m) ? m : null;
}

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
    // 镜头朝向，**sim 空间**（yaw = 0 面向 -Z）。相机系角不许进这个字段，见 setLook。
    // null = 壳层没喂朝向，镜头跟角色自己的 yaw。
    this.lookYaw = Number.isFinite(opts.lookYaw ?? opts.simYaw) ? (opts.lookYaw ?? opts.simYaw) : null;
    this.lookMode = normalizeLookMode(opts.lookMode) ?? DEFAULT_LOOK_MODE;
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
    // 过门 / 换人 / 开局：下一帧把机位直接架到目标身后，不走弹簧（见 _followCamera）
    this._snapPending = true;
    this._lastPhase = null;
    this._following = false;
    this._prevFocusX = 0;
    this._prevFocusZ = 0;

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
    const next = !!v;
    // 从环绕机位切回跟随：镜头这会儿在岛外的轨道上，弹簧回来就是一段飞越
    if (this.spectator && !next) this._snapPending = true;
    this.spectator = next;
  }

  /** 主循环换人（分屏、观战某个 bot）时用；不给就回到 view 自己的判断。 */
  setLocalId(id) {
    const next = id ?? null;
    if (next !== this.forcedLocalId) this._snapPending = true;
    this.forcedLocalId = next;
    return this.forcedLocalId;
  }

  /**
   * 下一帧把镜头瞬时架到跟随目标身后（过门、结算回程、壳层显式重置）。
   *
   * 渲染层自己也会在 hub ↔ arena 切换、焦点整跳（> CAMERA_SNAP_TELEPORT）时自动 snap，
   * 这个方法是给壳层用的显式入口：它比渲染层更早知道「这一帧要传送」。
   */
  snapCamera() {
    this._snapPending = true;
    return true;
  }

  /** snapCamera 的别名（壳层语义：重新架机位跟人）。 */
  resetFollow() {
    return this.snapCamera();
  }

  /**
   * 固定人物视角开关。
   *
   *   'locked' —— 镜头钉在角色**背后**，用角色自己的 yaw（locked 时它与视线一致，
   *               见 GOAL：人物水平面向 ≡ 相机水平前向），镜头永远绕不到正脸：
   *               快速转身时也有硬顶兜着（camera.js 的 LOCKED_YAW_SPAN）；
   *   'free'   —— 用壳层喂进来的 lookYaw（**sim 空间**），没喂就跟角色 yaw。角色
   *               面朝走向、镜头面朝视线，所以画面里角色可以露出侧面。
   *
   * 切模式**不吸附机位**：人还站在原地，镜头顺着弹簧转过去就好（snap 只给传送，
   * 见 _followCamera / ADR-39）。运行期权威仍在输入层，这里只是随帧收（ADR-38）。
   *
   * 切模式**不武装 snap**：人还站在原地，只是机位改绕另一个角，弹簧会自己把镜头
   * 荡过去。这里若顺手 `_snapPending = true`，按一下 V 画面就会硬跳一格 —— snap 是
   * 留给「世界位置整个换了一处」的（过门 / 换人 / 开局，见 snapCamera）。
   *
   * 真换了模式才通知镜头松一下背后闸（`camera.js releaseBehind`）：两个跟随角在真链路
   * 上本来是连着的（locked 下人跟镜头 1:1），但 free 里人朝的是移动方向，切回 locked
   * 的那一帧 sim 还没把人扭过来，落差可以到 π —— 闸这时硬按就等于 snap。
   *
   * @param {'locked'|'free'} mode 认不出来的值不改现状
   * @returns {'locked'|'free'} 生效后的模式
   */
  setLookMode(mode) {
    const next = normalizeLookMode(mode);
    if (next && next !== this.lookMode) {
      this.lookMode = next;
      this.cameraRig.releaseBehind();
    }
    return this.lookMode;
  }

  /** @returns {'locked'|'free'} */
  getLookMode() {
    return this.lookMode;
  }

  /** main.js 的旧名字。语义与 setLocalId 相同。 */
  setFollow(id) {
    return this.setLocalId(id);
  }

  /**
   * 抬头 / 低头（以及可选的镜头朝向、视角模式）。壳层每帧调一次即可：
   *
   *   renderer.setLook(input.getLook());          // 只有 { yaw, pitch } 的老壳
   *   renderer.setLook(lookPayload(getLook()));   // { yaw, pitch, simYaw }（core/look.js）
   *
   * pitch 与 `src/input` 同一套约定：**正 = 往下看**，镜头随之抬高、视点压低；
   * 单位弧度，内部夹在 ±PITCH_LIMIT。不调用就维持静止机位的俯角。
   *
   * 朝向只认一套空间：**sim 空间**，yaw = 0 面向 -Z，与 `sim/math.js` 的
   * forwardX/forwardZ 一致。字段取用顺序：
   *
   *   1. `simYaw` —— `core/look.js` 已经用 `cameraYawToSimYaw` 换算好的那份，**优先**；
   *   2. `yaw`    —— 只在没有 simYaw 时用，此时它**必须已经是 sim 空间**。
   *
   * 输入层内部维护的是**相机方位角**（水平前向 = (cos yaw, sin yaw)），那个角原样
   * 丢进来会把机位拧到角色脸前 / 左右镜像 —— 相机系角请先过 `cameraYawToSimYaw`。
   * 两个字段都不给时镜头跟角色自己的朝向，那条路一直是对的。
   *
   * `lookMode` 一起收：payload 带了就等价于调一次 setLookMode。
   *
   * @param {{pitch?: number, yaw?: number, simYaw?: number, lookMode?: 'locked'|'free'}|number} look
   * @returns {{pitch: number|null, yaw: number|null, lookMode: 'locked'|'free'}}
   */
  setLook(look = {}) {
    const o = typeof look === 'number' ? { pitch: look } : look || {};
    if (Number.isFinite(o.pitch)) {
      this.lookPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, o.pitch));
    } else if (o.pitch === null) {
      this.lookPitch = null;
    }
    // simYaw 在场就以它为准：同一份 payload 里的 yaw 是相机系的，用它会把镜头拧反
    if (Number.isFinite(o.simYaw)) this.lookYaw = o.simYaw;
    else if (o.simYaw === null) this.lookYaw = null;
    else if (Number.isFinite(o.yaw)) this.lookYaw = o.yaw;
    else if (o.yaw === null) this.lookYaw = null;
    if (o.lookMode !== undefined) this.setLookMode(o.lookMode);
    return { pitch: this.lookPitch, yaw: this.lookYaw, lookMode: this.lookMode };
  }

  /** setLook 的单值写法。 */
  setPitch(pitch) {
    return this.setLook({ pitch }).pitch;
  }

  /**
   * 当前实际用掉的俯角与朝向，主要给探针与冒烟台读。
   *
   * `yaw` / `simYaw` 是同一个数：镜头朝向只有 sim 空间一套，这里报的就是喂进来
   * 那份（没喂就是 null，此时镜头跟角色 yaw，实读走 `cameraYaw`）。
   */
  getLook() {
    return {
      pitch: this.lookPitch ?? BASE_PITCH,
      yaw: this.lookYaw,
      simYaw: this.lookYaw,
      lookMode: this.lookMode,
      cameraPitch: this.cameraRig.state.pitchOut,
      // 机位这一帧真正绕着的 sim yaw（阻尼后的值）
      cameraYaw: this.cameraRig.state.yaw,
    };
  }

  /** 本帧要喂给相机的抬头量：绝对俯角减去静止机位基准。 */
  _pitchBias() {
    return this.lookPitch == null ? 0 : this.lookPitch - BASE_PITCH;
  }

  /**
   * 本帧机位该绕着哪个朝向转（**sim 空间**）。
   *
   * locked：角色自己的 yaw —— 固定人物视角下人物面向 ≡ 视线，用它镜头必在背后，
   *         绝不会绕到正脸；壳层没接线时它也正好是原来那条对的路。
   * free  ：壳层喂的 lookYaw；没喂同样退回角色 yaw。
   *
   * 两条路的分野就在这里：free 下 `lookYaw` 与 `local.yaw` 是**两个独立的角**
   * （角色面朝走向、镜头面朝视线，见 ADR-38），所以画面里角色可以露出侧面甚至正脸；
   * locked 下它们是同一个角，镜头恒在背后。
   */
  _followYaw(local) {
    const charYaw = Number.isFinite(local?.yaw) ? local.yaw : 0;
    if (this.lookMode === 'locked') return charYaw;
    return this.lookYaw == null ? charYaw : this.lookYaw;
  }

  /**
   * locked 的背后半平面硬顶要拿哪个朝向当基准。free 恒不给：自由视角不夹。
   *
   * locked 下 `_followYaw` 返回的**就是**角色面向，所以跟随用的 yaw 与硬顶的基准
   * 是同一个数 —— 这不是巧合式的复用，是「固定人物视角」的定义本身。
   *
   * 落后得太多的那一帧不夹（见 camera.js 的 LOCKED_HOLD_RATE）：切 V 那一帧壳层还
   * 没把角色转到视线上、重生改写朝向，都属于「朝向被瞬移」，硬顶下去就是一帧甩镜。
   */
  _behindYaw(yaw) {
    return this.lookMode === 'locked' && Number.isFinite(yaw) ? yaw : undefined;
  }

  /**
   * 过门检测：hub ↔ arena 两区在世界里隔着 ~120m，phase 一变机位必须吸附过去。
   *
   * 从 sync 里拆出来是为了能在没有 WebGL 的地方单独锁测 —— 「过门仍 snap」与
   * 「切视角模式不许 snap」是同一枚硬币的两面，两条都要有测（见 look-camera.test.js）。
   *
   * @param {'hub'|'arena'} phase 本帧实际画的是哪一区
   * @returns {boolean} 这一帧是不是过门
   */
  _phaseChanged(phase) {
    const changed = this._lastPhase !== null && phase !== this._lastPhase;
    if (changed) this._snapPending = true;
    this._lastPhase = phase;
    return changed;
  }

  /**
   * 跟随机位。传送（过门 / 结算回程 / 换人 / 开局第一帧）走 snap，其余走弹簧。
   *
   * **切视角模式不在 snap 名单里**：locked ↔ free 换的是「机位绕谁转」，角色还站在
   * 原地，镜头该顺着弹簧转过去；这里硬吸一下就成了过门那种瞬移（ADR-39 只给传送）。
   *
   * @param {Vector3} focus 本帧焦点（已经写进 this._focus）
   * @param {number} yaw    本帧跟随朝向（locked = 角色面向，free = 壳层喂的视线）
   */
  _followCamera(dt, focus, yaw) {
    const jumped =
      this._following &&
      Math.hypot(focus.x - this._prevFocusX, focus.z - this._prevFocusZ) > CAMERA_SNAP_TELEPORT;
    this._prevFocusX = focus.x;
    this._prevFocusZ = focus.z;
    this._following = true;
    if (this._snapPending || jumped) {
      this._snapPending = false;
      this.cameraRig.snap(focus, yaw, { pitchBias: this._pitchBias() });
      return true;
    }
    this.cameraRig.update(dt, focus, yaw, this._vel, {
      pitchBias: this._pitchBias(),
      behindYaw: this._behindYaw(yaw),
    });
    return false;
  }

  /**
   * 过门（hub ↔ arena）就武装一次吸附。
   *
   * 两区在世界里隔着 ~120m，弹簧跟过去是一秒钟的空镜飞越。同一区里反复调用不产生
   * 副作用 —— 「换了个区」是唯一的触发条件，视角模式、画质、换皮肤都不算。
   *
   * 包装 `_phaseChanged`：过门语义共用一份 `_lastPhase` 记账，返回值按 R2 契约
   * 是 `_snapPending`（look.test.js），而 `_phaseChanged` 返回的是「这一帧是不是过门」
   * （look-camera.test.js）。
   *
   * @param {'hub'|'arena'} phase
   * @returns {boolean} 本帧是否处于「待吸附」状态
   */
  _notePhase(phase) {
    this._phaseChanged(phase);
    return this._snapPending;
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
        // 前摇就起手（sim 的 slapStart），出掌的加速段才对得上判定生效的那一刻。
        // 这是一记掌唯一的起手处：hit / slap 到的时候动画已经在飞了，它们只改朝向与分量
        if (actor) this.characters.playSlap(e.actorId, power);
        break;
      }

      case 'slap': {
        // 判定结束的这条不许再起手：slapT 归零会把整段前摇重放一遍，
        // 还会顺手冲掉同一 tick 里 hit 刚算出来的击退侧（sim 把 hit 排在 slap 前面）。
        // 没有前摇事件的路子（combat 的 slapWhiff / ghostSlap）才在这里补一次起手
        if (actor && !this.characters.steerSlap(e.actorId, { power })) {
          this.characters.playSlap(e.actorId, power);
        }
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
          // 挥的是哪只手：把击退方向转回角色自身坐标系看左右。
          // 前摇起手时还不知道这个方向，所以这一侧要能盖过起手用的槽位默认值
          const local = this._tmp3.copy(dir).applyAxisAngle(UP, -actor.yaw);
          const side = local.x >= 0 ? 1 : -1;
          if (!this.characters.steerSlap(e.actorId, { side, power })) {
            this.characters.playSlap(e.actorId, power, side);
          }
        }
        if (target) this.characters.playHit(e.targetId, dir, power);
        // 命中反馈：自己挨打最震，自己打中次之，别人互殴只有一点点。
        // 「自己打中」这档要吃满 camera.js 那条 clamp（shake ≤ 1.4）又不撞上去：
        // 单记最重的 power 是 2.6（view.js 的 eventPower），0.46 × 2.6 ≈ 1.2 还没削顶，
        // 一掌比一掌重仍然读得出来。挨打那档故意留在会削顶的位置 —— 最重的一记就该顶死
        const scale = localHit ? 0.55 : localActed ? 0.46 : 0.12;
        this.cameraRig.impulse(scale * power, localHit ? 2.6 : localActed ? 2 : 1.2);
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
    // 过门（hub ↔ arena）：两区在世界里隔着 ~120m，机位必须吸附过去，不许弹簧飞越
    // `_notePhase` 包装 `_phaseChanged`：过门仍 snap、切 V 不 snap，两套测各吃各的返回值
    this._notePhase(inHub ? 'hub' : 'arena');
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
      this._followCamera(dt, this._focus, this._followYaw(local));
    } else {
      this.cameraRig.orbit(dt, this.time, this.arenaRadius * 1.35);
      this._focus.set(0, 0, 0);
      // 观战 / 无本地玩家：下次跟人时机位还在岛外轨道上，得重新架
      this._following = false;
      this._snapPending = true;
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
