/** 英雄表脚手架。Fable-3 负责填满 18 只。 */
export const HEROES = {
  dash_duck: {
    id: "dash_duck",
    name: "冲鸭",
    race: "duck",
    school: "combo",
    atk: 14,
    skill: "dash_crit",
  },
  sun_bird: {
    id: "sun_bird",
    name: "日轮鸟",
    race: "bird",
    school: "brute",
    atk: 18,
    skill: "solar_burn",
  },
  thunder_chick: {
    id: "thunder_chick",
    name: "雷神鸡",
    race: "chick",
    school: "elemental",
    atk: 16,
    skill: "shock_bounce",
  },
  heal_duck: {
    id: "heal_duck",
    name: "治愈鸭",
    race: "duck",
    school: "support",
    atk: 8,
    skill: "yolk_heal",
  },
  guard_duck: {
    id: "guard_duck",
    name: "守护鸭",
    race: "duck",
    school: "support",
    atk: 9,
    skill: "shell_guard",
  },
};

export const HERO_LIST = Object.values(HEROES);
