import { nextRealm, realmById } from "../data/realms.js";

export function breakthrough(save) {
  const cur = realmById(save.realmId);
  const next = nextRealm(save.realmId);
  if (next.id === cur.id) return { ...save, notice: "已至飞升，笔可通神。" };
  if (save.xp < cur.xp) return { ...save, notice: `修为未满，还需 ${cur.xp - save.xp}。` };
  return {
    ...save,
    realmId: next.id,
    xp: save.xp - cur.xp,
    notice: `突破成功，踏入${next.name}。`,
  };
}
