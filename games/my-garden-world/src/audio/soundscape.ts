import type { Season } from "../data/flowers";

/** 静音偏好独立持久化（与存档分离）：清档重开、跨会话都记得玩家的耳朵。 */
const MUTE_KEY = "my-garden-world:muted";

function loadMuted(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let ctx: AudioContext | null = null;
let muted = loadMuted();
/** 自动播放策略：首个用户手势之前不建 AudioContext，也就不会有控制台告警。 */
let gestured = false;

export function toggleMute(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* 隐私模式写不进就只在本次会话生效 */
  }
  if (muted) stopAmbient();
  else startAmbient();
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (typeof AudioContext === "undefined") return null;
  ctx ??= new AudioContext();
  return ctx;
}

export type ChimeKind = "ok" | "warn" | "rare" | "water" | "spirit";

const CHIME_HZ: Record<ChimeKind, number> = { ok: 523, warn: 196, rare: 784, water: 392, spirit: 659 };

export function chime(kind: ChimeKind = "ok"): void {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  o.frequency.value = CHIME_HZ[kind];
  o.type = kind === "water" ? "sine" : "triangle";
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  o.start(now);
  o.stop(now + 0.3);
  if (kind === "spirit") {
    // 花灵另起一声上五度泛音，像檐下风铃搭了个和音
    const o2 = c.createOscillator();
    const g2 = c.createGain();
    o2.connect(g2);
    g2.connect(c.destination);
    o2.type = "sine";
    o2.frequency.value = CHIME_HZ.spirit * 1.5;
    g2.gain.setValueAtTime(0.0001, now + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.03, now + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
    o2.start(now + 0.06);
    o2.stop(now + 0.64);
  }
}

export function resumeAudio(): void {
  gestured = true;
  void ac()?.resume();
  startAmbient();
}

// ---------------------------------------------------------------------------
// 四季底噪：三声部五声音阶长音 + 低通 + 极慢的呼吸，随季节 / 昼夜 / 花灵换调。
// ---------------------------------------------------------------------------

export interface AmbientVoicing {
  /** 三声部频率（Hz） */
  partials: number[];
  /** 低通截止（Hz） */
  cutoff: number;
  /** 总音量 0~1 */
  gain: number;
  /** 呼吸频率（Hz） */
  tremoloHz: number;
  wave: OscillatorType;
}

interface SeasonMode {
  partials: [number, number, number];
  cutoff: number;
  gain: number;
  tremoloHz: number;
  wave: OscillatorType;
}

/** 五声音阶取调：春角、夏徵、秋商、冬羽。 */
const MODES: Record<Season, SeasonMode> = {
  spring: { partials: [164.81, 246.94, 329.63], cutoff: 900, gain: 0.05, tremoloHz: 0.14, wave: "sine" },
  summer: { partials: [196.0, 293.66, 392.0], cutoff: 1250, gain: 0.054, tremoloHz: 0.24, wave: "triangle" },
  autumn: { partials: [146.83, 220.0, 293.66], cutoff: 760, gain: 0.046, tremoloHz: 0.11, wave: "sine" },
  winter: { partials: [110.0, 164.81, 220.0], cutoff: 520, gain: 0.038, tremoloHz: 0.07, wave: "sine" },
};

const VOICE_MIX = [0.62, 0.34, 0.2];
const DETUNE = [0, -6, 7];
/** 换季不切歌，两秒半的渐变里把频率、音色、亮度一起挪过去 */
const RAMP_S = 2.4;

const r3 = (n: number): number => Math.round(n * 1000) / 1000;

/** 纯函数：季节 / 昼夜 / 随行花灵 → 一份配器。夜里更暗更轻，有灵相伴则微亮。 */
export function ambientVoicing(season: Season, night = false, spirit: string | null = null): AmbientVoicing {
  const m = MODES[season];
  const gain = m.gain * (night ? 0.68 : 1) * (spirit ? 1.12 : 1);
  const cutoff = m.cutoff * (night ? 0.6 : 1) * (spirit ? 1.15 : 1);
  return {
    partials: m.partials.map((f) => r3(f)),
    cutoff: Math.round(cutoff),
    gain: r3(gain),
    tremoloHz: r3(m.tremoloHz * (night ? 0.7 : 1)),
    wave: m.wave,
  };
}

interface Drone {
  master: GainNode;
  filter: BiquadFilterNode;
  oscs: OscillatorNode[];
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let drone: Drone | null = null;
let target: { season: Season; night: boolean; spirit: string | null } = { season: "spring", night: false, spirit: null };

function currentVoicing(): AmbientVoicing {
  return ambientVoicing(target.season, target.night, target.spirit);
}

export function startAmbient(): void {
  if (drone || !gestured) return;
  const c = ac();
  if (!c) return;
  const v = currentVoicing();
  const t = c.currentTime;

  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.connect(c.destination);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(v.cutoff, t);
  filter.Q.value = 0.55;
  filter.connect(master);

  const oscs = v.partials.map((f, i) => {
    const o = c.createOscillator();
    o.type = v.wave;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = DETUNE[i] ?? 0;
    const g = c.createGain();
    g.gain.setValueAtTime(VOICE_MIX[i] ?? 0.2, t);
    o.connect(g);
    g.connect(filter);
    o.start();
    return o;
  });

  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(v.tremoloHz, t);
  const lfoGain = c.createGain();
  lfoGain.gain.setValueAtTime(v.gain * 0.35, t);
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();

  master.gain.linearRampToValueAtTime(v.gain, t + RAMP_S);
  drone = { master, filter, oscs, lfo, lfoGain };
}

export function stopAmbient(): void {
  const d = drone;
  drone = null;
  if (!d || !ctx) return;
  const t = ctx.currentTime;
  d.master.gain.cancelScheduledValues(t);
  d.master.gain.setValueAtTime(Math.max(0.0001, d.master.gain.value), t);
  d.master.gain.linearRampToValueAtTime(0.0001, t + 0.4);
  for (const o of d.oscs) o.stop(t + 0.45);
  d.lfo.stop(t + 0.45);
}

function retune(): void {
  if (!drone || !ctx) return;
  const v = currentVoicing();
  const t = ctx.currentTime;
  drone.filter.frequency.linearRampToValueAtTime(v.cutoff, t + RAMP_S);
  drone.master.gain.linearRampToValueAtTime(v.gain, t + RAMP_S);
  drone.lfo.frequency.linearRampToValueAtTime(v.tremoloHz, t + RAMP_S);
  drone.lfoGain.gain.linearRampToValueAtTime(v.gain * 0.35, t + RAMP_S);
  v.partials.forEach((f, i) => {
    const o = drone?.oscs[i];
    if (!o) return;
    o.type = v.wave;
    o.frequency.linearRampToValueAtTime(f, t + RAMP_S);
  });
}

/** 设定当前景致；静音、无 WebAudio、未发生手势时都安全地什么都不做。 */
export function syncAmbient(season: Season, night: boolean, spirit: string | null = null): void {
  const changed = season !== target.season || night !== target.night || spirit !== target.spirit;
  if (changed) target = { season, night, spirit };
  if (!drone) startAmbient();
  else if (changed) retune();
}

const SEASONS = new Set<string>(["spring", "summer", "autumn", "winter"]);

/**
 * 把底噪挂到根节点上：app 每帧写的 data-season / data-night，以及 HUD 写的 data-spirit，
 * 音景直接观察这三个属性，于是不必侵入游戏循环，也不必知道 GameState。
 */
export function mountSoundscape(root: HTMLElement): () => void {
  const read = (): void => {
    const raw = root.dataset.season ?? "spring";
    const season = (SEASONS.has(raw) ? raw : "spring") as Season;
    syncAmbient(season, root.dataset.night === "1", root.dataset.spirit || null);
  };
  read();
  if (typeof MutationObserver === "undefined") return () => {};
  const mo = new MutationObserver(read);
  mo.observe(root, { attributes: true, attributeFilter: ["data-season", "data-night", "data-spirit"] });
  return () => mo.disconnect();
}

export interface AmbientSnapshot {
  running: boolean;
  muted: boolean;
  gestured: boolean;
  season: Season;
  night: boolean;
  spirit: string | null;
  voicing: AmbientVoicing;
}

/** 调试与测试用的只读快照。 */
export function ambientSnapshot(): AmbientSnapshot {
  return { running: drone !== null, muted, gestured, ...target, voicing: currentVoicing() };
}
