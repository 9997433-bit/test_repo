import { heroById } from "../data/heroes.js";

let seq = 1;

export function makeDisciple(heroId, extras = {}) {
  const hero = heroById(heroId);
  return {
    id: extras.id ?? `d-${seq++}`,
    heroId,
    name: extras.name ?? hero?.name ?? "无名修士",
    diligent: extras.diligent ?? 12 + Math.floor(Math.random() * 8),
    force: extras.force ?? 10 + Math.floor(Math.random() * 10),
    profession: extras.profession ?? 1,
    xp: 0,
    buildingId: extras.buildingId ?? null,
    unlocked: true,
  };
}

export function trainCost(profession) {
  return { pills: 2 + profession * 3, herb: 8 + profession * 6 };
}

export function canTrain(resources, disciple) {
  const c = trainCost(disciple.profession);
  return resources.pills >= c.pills && resources.herb >= c.herb;
}

export function applyTrain(disciple) {
  return { ...disciple, profession: disciple.profession + 1, xp: 0 };
}

/** 传功还差多少材料，用于面板提示。 */
export function trainShortfall(resources, disciple) {
  const c = trainCost(disciple.profession);
  return {
    pills: Math.max(0, c.pills - (resources?.pills ?? 0)),
    herb: Math.max(0, c.herb - (resources?.herb ?? 0)),
  };
}

const PROFESSION_TITLES = ["杂役", "学徒", "执事", "匠师", "真传", "堂主", "长老", "府卿", "仙工"];

export function professionTitle(profession) {
  const i = Math.max(0, Math.min(PROFESSION_TITLES.length - 1, Math.floor(profession ?? 0)));
  return PROFESSION_TITLES[i];
}

const SPIRIT_ROOTS = ["金灵根", "木灵根", "水灵根", "火灵根", "土灵根"];
const TEMPERS = ["沉毅", "洒脱", "孤高", "温厚", "机敏", "刚烈"];

function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 由 id 稳定推导的风味标签：不入存档，老档亦可显示。 */
export function discipleFlavor(disciple) {
  const h = hashId(String(disciple?.id ?? disciple?.heroId ?? ""));
  return { root: SPIRIT_ROOTS[h % SPIRIT_ROOTS.length], temper: TEMPERS[(h >>> 8) % TEMPERS.length] };
}
