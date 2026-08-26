export const HEROES = [
  {
    id: "zhaoyun",
    name: "赵云",
    glyphs: ["赵", "云"],
    quality: "gold",
    atk: 46,
    rate: 1.05,
    range: 2,
    skill: { id: "qijin", name: "七进七出", cd: 12, desc: "路线贯穿" },
  },
  {
    id: "zhangfei",
    name: "张飞",
    glyphs: ["张", "飞"],
    quality: "gold",
    atk: 40,
    rate: 0.8,
    range: 1,
    skill: { id: "dangyang", name: "当阳爆喝", cd: 14, desc: "击退眩晕" },
  },
  {
    id: "huangzhong",
    name: "黄忠",
    glyphs: ["黄", "忠"],
    quality: "gold",
    atk: 42,
    rate: 0.95,
    range: 3,
    skill: { id: "baibu", name: "百步穿杨", cd: 16, desc: "全屏射击" },
  },
  {
    id: "guanyu",
    name: "关羽",
    glyphs: ["关", "羽"],
    quality: "gold",
    atk: 44,
    rate: 0.85,
    range: 1,
    skill: { id: "wenjiu", name: "温酒斩华雄", cd: 15, desc: "扇形斩" },
  },
  {
    id: "liubei",
    name: "刘备",
    glyphs: ["刘", "备"],
    quality: "gold",
    atk: 16,
    rate: 0.7,
    range: 1,
    skill: { id: "rende", name: "仁德", cd: 18, desc: "全体攻速" },
  },
  {
    id: "machao",
    name: "马超",
    glyphs: ["马", "超"],
    quality: "gold",
    atk: 38,
    rate: 1.25,
    range: 1,
    skill: { id: "xiliang", name: "西凉铁骑", cd: 14, desc: "冲锋撞击" },
  },
];

export const GLYPH_POOL = HEROES.flatMap((h) => h.glyphs);

export function findHeroByGlyphs(a, b) {
  return HEROES.find(
    (h) => (h.glyphs[0] === a && h.glyphs[1] === b) || (h.glyphs[0] === b && h.glyphs[1] === a),
  );
}

export function heroById(id) {
  return HEROES.find((h) => h.id === id) || null;
}
