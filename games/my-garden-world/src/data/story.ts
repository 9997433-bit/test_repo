export type TutorialGoal = "plant" | "water" | "harvest" | "order";

export interface StoryBeat {
  id: string;
  title: string;
  body: string;
  cta: string;
  /** 有 goal 的节点不再是阻断式弹窗，而是等待玩家真实完成该动作。 */
  goal?: TutorialGoal;
  /** goal 节点在场景底部显示的引导横幅文案。 */
  hint?: string;
  /** 本步骤新解锁的 dock 按钮 id（累积生效）。 */
  allow?: string[];
}

export const TUTORIAL: StoryBeat[] = [
  {
    id: "wake",
    title: "荒园信",
    body: "你自后世坠入这座废园。院门半掩，泥土还记得花香。管家留下一壶清水与几粒雏菊种子——他说，先让土地重新呼吸。",
    cta: "推开院门",
    allow: [],
  },
  {
    id: "sow",
    title: "第一粒种",
    body: "打开「花种」匣，选一粒小雏菊，再点选任意一块空地播下。每一种花都有脾性，先从温柔的雏菊开始。",
    cta: "去播种",
    goal: "plant",
    hint: "打开「花种」选小雏菊，再点空地播下",
    allow: ["seed"],
  },
  {
    id: "water",
    title: "浇一杯春",
    body: "选中「洒水」，按住并拖过花圃。水分足够，花才肯往下一段生长。水滴会缓慢回升，也可以用订单换取。",
    cta: "学会浇水",
    goal: "water",
    hint: "选中「洒水」，按住拖过花圃",
    allow: ["water"],
  },
  {
    id: "reap",
    title: "花开堪折",
    body: "花盛放时会轻轻呼吸。选中「收获」点下盛开的花，花材便会入匣。别等太久——花也会谢的。",
    cta: "等花开",
    goal: "harvest",
    hint: "等花盛放后，用「收获」点下它",
    allow: ["harvest", "fert"],
  },
  {
    id: "order",
    title: "第一位客人",
    body: "邻家阿姊来讨一束雏菊。打开「订单」，把匣中的花材交付出去，花园便有了第一笔活钱。",
    cta: "开始经营",
    goal: "order",
    hint: "打开「订单」，交付雏菊给邻家阿姊",
    allow: ["order", "bag"],
  },
  {
    id: "open",
    title: "花园由你",
    body: "自此，作坊、装扮、花灵与四时轮转都交给你了。插花可换定制高价，装点庭院能引来更阔绰的客人。愿这园子替你记住每个季节。",
    cta: "开始造园",
    allow: ["workshop", "decor", "spirit", "plot"],
  },
];

export function currentBeat(step: number): StoryBeat | undefined {
  return TUTORIAL[step];
}

/** dock 按钮在教程期是否可用：累计所有已到达步骤的 allow；这些 id 始终可用。 */
const ALWAYS_ALLOWED = new Set(["mute", "reset"]);

export function tutorialAllows(step: number, done: boolean, buttonId: string): boolean {
  if (done || ALWAYS_ALLOWED.has(buttonId)) return true;
  for (let i = 0; i <= Math.min(step, TUTORIAL.length - 1); i++) {
    if (TUTORIAL[i]?.allow?.includes(buttonId)) return true;
  }
  return false;
}
