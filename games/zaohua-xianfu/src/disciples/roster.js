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
