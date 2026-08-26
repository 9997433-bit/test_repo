import { closeAudio, setMuted } from "../audio/index.js";

/**
 * 存档设置 → 音频总线的单向接线。
 *
 * 音频模块不认识 store，静音状态只有这一条推送路径：
 * 任何地方改了 `settings.mute`（开关、读档、以后的设置屏）都会被这里同步到总线，
 * 不需要各个发声点自己记得查存档。
 */
export function bindAudioSettings(store) {
  const read = () => Boolean(store.get()?.settings?.mute);
  let last = read();
  setMuted(last);
  const unsubscribe = store.subscribe((state) => {
    const next = Boolean(state?.settings?.mute);
    if (next === last) return;
    last = next;
    setMuted(next);
  });
  return () => {
    unsubscribe();
    closeAudio();
  };
}
