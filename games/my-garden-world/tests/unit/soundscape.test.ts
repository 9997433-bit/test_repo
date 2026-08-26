import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** 极简 WebAudio 替身：只实现底噪用到的那几个节点与参数。 */
class FakeParam {
  value: number;
  readonly ramps: number[] = [];
  constructor(v = 0) {
    this.value = v;
  }
  setValueAtTime(v: number): this {
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number): this {
    this.value = v;
    this.ramps.push(v);
    return this;
  }
  exponentialRampToValueAtTime(v: number): this {
    this.value = v;
    return this;
  }
  cancelScheduledValues(): this {
    return this;
  }
}

class FakeNode {
  connect(): this {
    return this;
  }
  disconnect(): void {}
}

class FakeOsc extends FakeNode {
  type = "sine";
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
  started = false;
  stoppedAt: number | null = null;
  start(): void {
    this.started = true;
  }
  stop(t = 0): void {
    this.stoppedAt = t;
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam(1);
}

class FakeFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam(350);
  Q = new FakeParam(1);
}

class FakeCtx {
  static created: FakeCtx[] = [];
  currentTime = 0;
  state = "suspended";
  destination = new FakeNode();
  oscs: FakeOsc[] = [];
  gains: FakeGain[] = [];
  filters: FakeFilter[] = [];
  resumed = 0;
  constructor() {
    FakeCtx.created.push(this);
  }
  createOscillator(): FakeOsc {
    const o = new FakeOsc();
    this.oscs.push(o);
    return o;
  }
  createGain(): FakeGain {
    const g = new FakeGain();
    this.gains.push(g);
    return g;
  }
  createBiquadFilter(): FakeFilter {
    const f = new FakeFilter();
    this.filters.push(f);
    return f;
  }
  resume(): Promise<void> {
    this.resumed += 1;
    this.state = "running";
    return Promise.resolve();
  }
}

type Sound = typeof import("../../src/audio/soundscape");

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

async function load(withAudio: boolean): Promise<Sound> {
  vi.resetModules();
  FakeCtx.created = [];
  if (withAudio) Reflect.set(globalThis, "AudioContext", FakeCtx);
  else Reflect.deleteProperty(globalThis, "AudioContext");
  return import("../../src/audio/soundscape");
}

function root(season = "spring", night = "0"): HTMLElement {
  const el = document.createElement("div");
  el.className = "app";
  el.dataset.season = season;
  el.dataset.night = night;
  document.body.append(el);
  return el;
}

const latest = (): FakeCtx => FakeCtx.created[FakeCtx.created.length - 1]!;

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "AudioContext");
});

describe("ambientVoicing", () => {
  it("gives每季一调，三声部齐备", async () => {
    const s = await load(false);
    const seasons = ["spring", "summer", "autumn", "winter"] as const;
    const roots = seasons.map((x) => {
      const v = s.ambientVoicing(x);
      expect(v.partials).toHaveLength(3);
      expect(v.partials.every((f) => f > 40 && f < 800)).toBe(true);
      expect(v.gain).toBeGreaterThan(0);
      expect(v.gain).toBeLessThan(0.1);
      return v.partials[0]!;
    });
    expect(new Set(roots).size).toBe(4);
  });

  it("夜里更暗更轻，白日更亮", async () => {
    const s = await load(false);
    const day = s.ambientVoicing("summer", false);
    const night = s.ambientVoicing("summer", true);
    expect(night.gain).toBeLessThan(day.gain);
    expect(night.cutoff).toBeLessThan(day.cutoff);
    expect(night.tremoloHz).toBeLessThan(day.tremoloHz);
  });

  it("有花灵随行时略提亮", async () => {
    const s = await load(false);
    const alone = s.ambientVoicing("autumn", false, null);
    const withSpirit = s.ambientVoicing("autumn", false, "juyue");
    expect(withSpirit.gain).toBeGreaterThan(alone.gain);
    expect(withSpirit.cutoff).toBeGreaterThan(alone.cutoff);
    expect(withSpirit.partials).toEqual(alone.partials);
  });

  it("冬天最沉，夏天最亮", async () => {
    const s = await load(false);
    expect(s.ambientVoicing("winter").cutoff).toBeLessThan(s.ambientVoicing("summer").cutoff);
  });
});

describe("底噪生命周期", () => {
  it("没有 WebAudio 时全程静默且不报错", async () => {
    const s = await load(false);
    const dispose = s.mountSoundscape(root());
    s.resumeAudio();
    s.chime("spirit");
    expect(s.ambientSnapshot().running).toBe(false);
    dispose();
  });

  it("用户手势之前不建 AudioContext", async () => {
    const s = await load(true);
    s.mountSoundscape(root());
    expect(FakeCtx.created).toHaveLength(0);
    expect(s.ambientSnapshot().running).toBe(false);
  });

  it("手势之后起声：三声部 + 一路呼吸 LFO，按当季配器", async () => {
    const s = await load(true);
    s.mountSoundscape(root("autumn", "0"));
    s.resumeAudio();
    const ctx = latest();
    const v = s.ambientVoicing("autumn");
    expect(s.ambientSnapshot().running).toBe(true);
    expect(ctx.oscs).toHaveLength(4);
    expect(ctx.oscs.slice(0, 3).map((o) => o.frequency.value)).toEqual(v.partials);
    expect(ctx.filters[0]!.frequency.value).toBe(v.cutoff);
    expect(ctx.oscs[3]!.frequency.value).toBe(v.tremoloHz);
    expect(ctx.oscs.every((o) => o.started)).toBe(true);
    expect(ctx.resumed).toBeGreaterThan(0);
  });

  it("静音时不起声，也不建 AudioContext", async () => {
    const s = await load(true);
    expect(s.toggleMute()).toBe(true);
    s.mountSoundscape(root());
    s.resumeAudio();
    expect(FakeCtx.created).toHaveLength(0);
    expect(s.ambientSnapshot().running).toBe(false);
  });

  it("静音掐掉正在响的底噪，解除静音再起", async () => {
    const s = await load(true);
    s.mountSoundscape(root());
    s.resumeAudio();
    const first = latest();
    expect(s.ambientSnapshot().running).toBe(true);

    s.toggleMute();
    expect(s.ambientSnapshot().running).toBe(false);
    expect(first.oscs.every((o) => o.stoppedAt !== null)).toBe(true);
    const silenced = first.gains[0]!.gain.ramps.at(-1)!;
    expect(silenced).toBeLessThanOrEqual(0.0001);

    s.toggleMute();
    expect(s.ambientSnapshot().running).toBe(true);
    expect(latest().oscs.filter((o) => o.stoppedAt === null).length).toBe(4);
  });
});

describe("跟随根节点上的季节 / 昼夜 / 花灵", () => {
  it("换季只做渐变，不重建节点", async () => {
    const s = await load(true);
    const el = root("spring", "0");
    s.mountSoundscape(el);
    s.resumeAudio();
    const ctx = latest();

    el.dataset.season = "winter";
    await flush();
    const winter = s.ambientVoicing("winter");
    expect(s.ambientSnapshot().season).toBe("winter");
    expect(ctx.oscs).toHaveLength(4);
    expect(ctx.oscs.slice(0, 3).map((o) => o.frequency.value)).toEqual(winter.partials);
    expect(ctx.filters[0]!.frequency.value).toBe(winter.cutoff);
    expect(FakeCtx.created).toHaveLength(1);
  });

  it("入夜压暗，花灵随行提亮", async () => {
    const s = await load(true);
    const el = root("summer", "0");
    s.mountSoundscape(el);
    s.resumeAudio();
    const ctx = latest();
    const dayCut = ctx.filters[0]!.frequency.value;

    el.dataset.night = "1";
    await flush();
    expect(s.ambientSnapshot().night).toBe(true);
    expect(ctx.filters[0]!.frequency.value).toBeLessThan(dayCut);

    el.setAttribute("data-spirit", "suideng");
    await flush();
    expect(s.ambientSnapshot().spirit).toBe("suideng");
    expect(s.ambientSnapshot().voicing.gain).toBe(s.ambientVoicing("summer", true, "suideng").gain);

    el.setAttribute("data-spirit", "");
    await flush();
    expect(s.ambientSnapshot().spirit).toBeNull();
  });

  it("认不得的季节退回春天，卸载后不再跟随", async () => {
    const s = await load(true);
    const el = root("nonsense", "0");
    const dispose = s.mountSoundscape(el);
    s.resumeAudio();
    expect(s.ambientSnapshot().season).toBe("spring");
    dispose();
    el.dataset.season = "winter";
    await flush();
    expect(s.ambientSnapshot().season).toBe("spring");
  });
});
