// 异掌 · 五拍旁白（P2 内容轮，F1）。说话的只有一个人（一只掌）：**木棉**——
// 教学掌兼引路人，短句、不训话，一拍三四句就闭嘴。
//
// 形状约定（story.test.js 锁死）：
//   · id       拍的稳定 id（登记见 GDD §16）
//   · trigger  触发时机词（事件线归 UI/core 接线，本轮只登记数据）：
//       hub_first_enter    第一次进安全区走道（初来）
//       glove_first_pickup 第一次在台座选定主掌（拾掌）
//       portal_first_cross 第一次穿过传送门（过门）
//       first_kill_or_fall 第一次击杀**或**第一次坠落，先到先触发（首杀/首坠共用一拍）
//       match_first_win    第一次胜场（首胜）
//   · lines    逐句上屏的台词，全线合计 ≤ 20 句、单句 ≤ 18 字
//   · once     true = 每份存档只放一次（已放列表由存档层记，本表不管状态）
//
// 纯数据红线（契约 §1-1）：禁 import three / DOM / Math.random，全字段 JSON
// 可序列化；深冻结，消费方拿到的是只读表。

function deepFreeze(obj) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return Object.freeze(obj);
}

export const STORY = deepFreeze([
  {
    id: "arrive",
    trigger: "hub_first_enter",
    once: true,
    lines: ["醒了？风把你吹到这儿的。", "这条走道尽头，有一扇门。", "先别急，一步一步来。"],
  },
  {
    id: "first_glove",
    trigger: "glove_first_pickup",
    once: true,
    lines: ["握紧。掌一暖，就认主了。", "别怕它重，重的是心事。", "台座上还有别的掌，回头再看。"],
  },
  {
    id: "portal",
    trigger: "portal_first_cross",
    once: true,
    lines: ["门后是裂岛，掉下去可不算数。", "记住脚下，比记住对手要紧。", "去吧，我陪着你。"],
  },
  {
    id: "first_blood",
    trigger: "first_kill_or_fall",
    once: true,
    lines: ["看见了吗，岛缘不讲情面。", "下去的人不是输，是学得慢。", "揉揉掌心，继续。"],
  },
  {
    id: "first_win",
    trigger: "match_first_win",
    once: true,
    lines: [
      "赢了。掌心还热着呢。",
      "胜负是浪，你是船。",
      "往后还有硬仗，今晚先歇。",
      "……我也有点想睡了。",
    ],
  },
]);

export const STORY_BY_ID = Object.freeze(
  Object.fromEntries(STORY.map((beat) => [beat.id, beat])),
);
