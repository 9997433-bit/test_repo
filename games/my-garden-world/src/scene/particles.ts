import type { Season } from "../data/flowers";

function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimate(): boolean {
  return typeof Element !== "undefined" && "animate" in Element.prototype;
}

export interface AmbientController {
  set(season: Season, night: boolean): void;
}

interface ParticleSpec {
  cls: string;
  count: number;
  colors: string[];
  minDur: number;
  maxDur: number;
}

const WEATHER: Record<Season, { day: ParticleSpec; night: ParticleSpec }> = {
  spring: {
    day: { cls: "p-petal", count: 16, colors: ["#f7cad0", "#ffe3ea", "#f4e7b5", "#fffdf4"], minDur: 9, maxDur: 16 },
    night: { cls: "p-petal", count: 8, colors: ["#e8b7c4", "#d9c6de"], minDur: 12, maxDur: 18 },
  },
  summer: {
    day: { cls: "p-mote", count: 8, colors: ["#fff7d6", "#e4f2c8"], minDur: 10, maxDur: 16 },
    night: { cls: "p-fly", count: 12, colors: ["#ffe58a", "#d4f2a0"], minDur: 5, maxDur: 9 },
  },
  autumn: {
    day: { cls: "p-leaf", count: 14, colors: ["#e76f51", "#e5a04c", "#c9862a", "#9b2226"], minDur: 8, maxDur: 14 },
    night: { cls: "p-leaf", count: 7, colors: ["#a4553a", "#8a6a3a"], minDur: 10, maxDur: 16 },
  },
  winter: {
    day: { cls: "p-snow", count: 20, colors: ["#ffffff", "#e8eef4"], minDur: 10, maxDur: 18 },
    night: { cls: "p-snow", count: 20, colors: ["#dfe8f2", "#cfd8e2"], minDur: 12, maxDur: 20 },
  },
};

/** 季节 × 昼夜的环境粒子：春瓣 / 夏萤 / 秋叶 / 冬雪，纯 CSS 动画。 */
export function mountAmbient(host: HTMLElement): AmbientController {
  const layer = document.createElement("div");
  layer.className = "petals";
  layer.setAttribute("aria-hidden", "true");
  host.append(layer);
  let key = "";

  const set = (season: Season, night: boolean): void => {
    const k = `${season}|${night ? 1 : 0}`;
    if (k === key) return;
    key = k;
    layer.replaceChildren();
    if (reducedMotion()) return;
    const spec = WEATHER[season][night ? "night" : "day"];
    for (let i = 0; i < spec.count; i++) {
      const p = document.createElement("i");
      p.className = `particle ${spec.cls}`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = spec.colors[i % spec.colors.length] ?? "#fff";
      const dur = spec.minDur + Math.random() * (spec.maxDur - spec.minDur);
      p.style.animationDuration = `${dur.toFixed(1)}s`;
      p.style.animationDelay = `${(-Math.random() * dur).toFixed(1)}s`;
      if (spec.cls === "p-fly") p.style.top = `${30 + Math.random() * 55}%`;
      layer.append(p);
    }
  };

  return { set };
}

/** 收获 / 升级的迸发粒子。 */
export function burst(host: HTMLElement, x: number, y: number, color: string): void {
  if (reducedMotion() || !canAnimate()) return;
  for (let i = 0; i < 10; i++) {
    const d = document.createElement("i");
    const size = 5 + Math.random() * 4;
    d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50% 4px;background:${color};pointer-events:none;z-index:20;`;
    host.append(d);
    const dx = (Math.random() - 0.5) * 110;
    const dy = -30 - Math.random() * 70;
    d.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${dx * 3}deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 250, easing: "cubic-bezier(.2,.7,.4,1)" },
    ).onfinish = () => d.remove();
  }
}

/** 浇水水花：蓝色水珠溅起后受重力回落。 */
export function splash(host: HTMLElement, x: number, y: number): void {
  if (reducedMotion() || !canAnimate()) return;
  for (let i = 0; i < 7; i++) {
    const d = document.createElement("i");
    const size = 4 + Math.random() * 3;
    d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size * 1.3}px;border-radius:50% 50% 60% 60%;background:#8ecbe6;pointer-events:none;z-index:20;opacity:.9;`;
    host.append(d);
    const dx = (Math.random() - 0.5) * 56;
    const up = -14 - Math.random() * 22;
    d.animate(
      [
        { transform: "translate(0,0)", opacity: 0.95 },
        { transform: `translate(${dx * 0.6}px,${up}px)`, opacity: 0.9, offset: 0.4 },
        { transform: `translate(${dx}px,${-up * 1.6}px)`, opacity: 0 },
      ],
      { duration: 480 + Math.random() * 160, easing: "ease-out" },
    ).onfinish = () => d.remove();
  }
}
