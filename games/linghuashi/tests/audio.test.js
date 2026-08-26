import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeAudio, isMuted, playCue, playStroke, setMuted, toggleMuted, withBus } from "../src/audio/index.js";
import { bindAudioSettings } from "../src/ui/audio-bridge.js";
import { createStore, defaultSave } from "../src/core/store.js";

/** 够用的 WebAudio 替身：只记录接线与增益变化。 */
function fakeAudio() {
  const gains = [];
  const oscillators = [];
  const ctx = {
    state: "running",
    currentTime: 0,
    destination: { id: "destination" },
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createGain() {
      const node = {
        connectedTo: null,
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
          setTargetAtTime: vi.fn((target) => {
            node.gain.value = target;
          }),
        },
        connect: (dest) => {
          node.connectedTo = dest;
        },
        disconnect: vi.fn(),
      };
      gains.push(node);
      return node;
    },
    createOscillator() {
      const node = {
        type: "sine",
        frequency: { value: 0 },
        connectedTo: null,
        connect: (dest) => {
          node.connectedTo = dest;
        },
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(node);
      return node;
    },
  };
  return { ctx, gains, oscillators, master: () => gains[0] };
}

let audio;

beforeEach(() => {
  audio = fakeAudio();
  vi.stubGlobal("AudioContext", function AudioContextStub() {
    return audio.ctx;
  });
  setMuted(false);
});

afterEach(() => {
  closeAudio();
  setMuted(false);
  vi.unstubAllGlobals();
});

describe("audio bus", () => {
  it("routes every voice through the master gain", () => {
    playStroke("line");
    playCue("win");

    expect(audio.master().connectedTo).toBe(audio.ctx.destination);
    expect(audio.oscillators.length).toBe(3);
    for (const osc of audio.oscillators) {
      // 振荡器 → 包络 → master，没有任何一路直连 destination。
      expect(osc.connectedTo.connectedTo).toBe(audio.master());
    }
  });

  it("plays nothing at all while muted", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(withBus(() => {})).toBe(false);

    playStroke("line");
    playCue("win");
    playCue("lose");

    expect(audio.oscillators).toHaveLength(0);
  });

  it("pulls the master down and back up when mute is toggled mid-session", () => {
    playStroke("circle");
    expect(audio.master().gain.value).toBeGreaterThan(0);

    setMuted(true);
    expect(audio.master().gain.value).toBe(0);

    toggleMuted();
    expect(isMuted()).toBe(false);
    expect(audio.master().gain.value).toBeGreaterThan(0);
  });

  it("keeps honouring the explicit mute argument from older call sites", () => {
    playStroke("line", true);
    expect(audio.oscillators).toHaveLength(0);
  });

  it("stays silent without WebAudio instead of throwing", () => {
    closeAudio();
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    expect(() => playStroke("spiral")).not.toThrow();
    expect(() => playCue("win")).not.toThrow();
    expect(withBus(() => {})).toBe(false);
  });
});

describe("mute follows the save", () => {
  it("adopts the stored setting on boot and tracks later changes", () => {
    const store = createStore({ ...defaultSave(), settings: { mute: true, reducedMotion: false } });
    const unbind = bindAudioSettings(store);
    expect(isMuted()).toBe(true);

    store.set({ settings: { mute: false } });
    expect(isMuted()).toBe(false);
    playStroke("cloud");
    expect(audio.oscillators).toHaveLength(1);

    store.set({ settings: { mute: true } });
    expect(isMuted()).toBe(true);
    playStroke("cloud");
    expect(audio.oscillators).toHaveLength(1);

    unbind();
    store.set({ settings: { mute: false } });
    expect(isMuted()).toBe(true);
  });
});
