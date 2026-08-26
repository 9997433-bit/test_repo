/**
 * 境界表：修士的等级主轴。
 * - `exp`：该境界每一层需要的修为（吐纳一次 +6+境界序号 修为，耗 4 灵气）。
 * - `atk/hp/def`：该境界的基准三维，realmPower 按层数在基准的 70%~110% 间插值。
 * - `title/desc`：境界雅号与风味文案，供修炼页与 GDD 使用。
 * - `perk`：该境界的经营侧红利说明（天地灵气底产 = 0.15 + 0.08×境界序号，见 production.ambientQi）。
 * 兼容性：id 永不删除；只增字段。
 */
export const REALMS = [
  { id: "qi", name: "练气", title: "引气入体", layers: 9, exp: 60, atk: 12, hp: 180, def: 6, desc: "吐纳天地灵气，洗练肉身凡胎。", perk: "开府之基，可建灵田、木坊、石坊、聚灵阵。" },
  { id: "foundation", name: "筑基", title: "道基初成", layers: 9, exp: 140, atk: 22, hp: 320, def: 12, desc: "灵力入髓，寿元倍增，可御器而行。", perk: "丹房、锻造房解锁，天地灵气底产 +0.08/秒。" },
  { id: "gold", name: "金丹", title: "金丹大道", layers: 9, exp: 260, atk: 40, hp: 560, def: 22, desc: "丹成一颗，我命由我不由天。", perk: "破境率开始吃丹药加成，塔中章主可稳定应对。" },
  { id: "infant", name: "元婴", title: "婴变化生", layers: 9, exp: 460, atk: 70, hp: 920, def: 38, desc: "元婴出窍，神识千里，兵解可再生。", perk: "第三章塔层（21+）的入场券。" },
  { id: "spirit", name: "化神", title: "神游太虚", layers: 9, exp: 760, atk: 120, hp: 1500, def: 62, desc: "以神驭气，一念山河动。", perk: "撑过 30 层后的压力曲线要靠此境打底。" },
  { id: "void", name: "炼虚", title: "虚实相生", layers: 9, exp: 1200, atk: 200, hp: 2400, def: 100, desc: "身融虚空，法则初窥。", perk: "34 层前的主力境界。" },
  { id: "union", name: "合体", title: "三花聚顶", layers: 9, exp: 1850, atk: 330, hp: 3800, def: 160, desc: "神、气、身三者合一，肉身即法宝。", perk: "第四章深层（36+）的门槛。" },
  { id: "mahayana", name: "大乘", title: "大乘圆满", layers: 9, exp: 2800, atk: 520, hp: 6000, def: 250, desc: "人间无敌，静待天劫。", perk: "40 层章主战的推荐境界。" },
  { id: "tribulation", name: "渡劫", title: "九重天劫", layers: 9, exp: 4200, atk: 820, hp: 9400, def: 400, desc: "雷劫淬体，一步登天，一步成灰。", perk: "45 层之后仍有压力：天塔无尽环等你。" },
  // 飞升仅 1 层，层内插值停在 70%，故基准值抬高以保证强于渡劫满层。
  { id: "ascend", name: "飞升", title: "白日飞升", layers: 1, exp: 99999, atk: 1520, hp: 17600, def: 760, desc: "霞举飞升，此界之行至此功成。", perk: "通关立碑：仙府名录留名。" },
];

export function realmAt(index) {
  return REALMS[Math.max(0, Math.min(REALMS.length - 1, index))];
}

/** 层内成长插值：第 1 层为基准值的 70%，满层（第 9 层）为 110%，跨境不塌陷。 */
export const REALM_LAYER_BASE = 0.7;
export const REALM_LAYER_SPAN = 0.45;

export function realmPower(index, layer) {
  const r = realmAt(index);
  const t = (Math.max(1, layer) - 1) / Math.max(1, r.layers);
  const mul = REALM_LAYER_BASE + t * REALM_LAYER_SPAN;
  return {
    atk: Math.round(r.atk * mul),
    hp: Math.round(r.hp * mul),
    def: Math.round(r.def * mul),
  };
}

/** 修满一层大约需要的吐纳次数与灵气，给 UI 做进度预估。 */
export function layerBudget(index) {
  const r = realmAt(index);
  const perTap = 6 + index;
  const taps = Math.ceil(r.exp / perTap);
  return { taps, qi: taps * 4, exp: r.exp };
}
