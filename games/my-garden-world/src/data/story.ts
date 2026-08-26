/**
 * 教程门槛：带门槛的一折，玩家必须真正完成对应操作，按钮才会亮起。
 * 判定逻辑见 `src/ui/tutorial.ts` 的 GATE_CHECKS。
 */
export type TutorialGate = "sow" | "water" | "harvest" | "order";

export interface StoryBeat {
  id: string;
  title: string;
  body: string;
  /** 门槛达成（或本折无门槛）时的按钮文案 */
  cta: string;
  /** 门槛未达成时的置灰按钮文案 */
  waitCta?: string;
  /** 本折的目标一句话，仅门槛折展示 */
  goal?: string;
  /** 完成该操作后方可进入下一折 */
  gate?: TutorialGate;
}

export const TUTORIAL: StoryBeat[] = [
  {
    id: "wake",
    title: "荒园来信",
    body: "一封旧信引你回到这座荒废的花园。院门半掩，泥土还记得花香。管家临行留下一壶清水、几粒花种，只嘱咐一句：土还是好土，只欠一双肯侍弄它的手。",
    cta: "接过花锄",
  },
  {
    id: "sow",
    title: "下一粒种",
    body: "先点一块空圃选中，再开下方「花种」，挑一粒小雏菊——它性子最温和，田埂边最先醒来的就是它。",
    goal: "在空圃里种下一粒花种",
    waitCta: "待你下种……",
    cta: "种下了，继续",
    gate: "sow",
  },
  {
    id: "water",
    title: "引一瓢水",
    body: "点下方「洒水」换上水壶，再点一点花圃。水到之处，芽才肯抬头；缸里的水会慢慢回满，急不得。",
    goal: "给花圃浇一次水",
    waitCta: "待你浇水……",
    cta: "浇透了，继续",
    gate: "water",
  },
  {
    id: "harvest",
    title: "剪一枝花",
    body: "花开到盛处，换「收获」轻轻一剪。拖得久了花会蔫，蔫花不值几个钱——趁盛开时收进花匣，最是划算。",
    goal: "收获一枝盛开的花",
    waitCta: "静候花开……",
    cta: "收进花匣，继续",
    gate: "harvest",
  },
  {
    id: "order",
    title: "接头一单",
    body: "打开「订单」，客人已在门外。花匣里有什么便接什么单；对不上的可婉拒换客，或照单再种一茬。交付换金币与经验，还能回一点水。",
    goal: "交付一份订单",
    waitCta: "客人候着……",
    cta: "头一单成了",
    gate: "order",
  },
  {
    id: "open",
    title: "自此看花",
    body: "园子活了。往后四季轮转、花艺插瓶、花灵驻园、庭院装扮，都由你做主。去吧，把这里种成你的花园世界。",
    cta: "开园",
  },
];
