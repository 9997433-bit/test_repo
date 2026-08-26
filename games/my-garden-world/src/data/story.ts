export type TutorialGoal = "plant" | "water" | "harvest" | "order";

export interface StoryBeat {
  id: string;
  title: string;
  body: string;
  cta: string;
  /** 有 goal 的节点：先弹故事折子，收起后化为引导横幅，等待玩家真实完成该动作。 */
  goal?: TutorialGoal;
  /** 本折的目标一句话（折子与横幅共用）。 */
  objective?: string;
  /** goal 进行中，引导横幅上的操作提示。 */
  hint?: string;
  /** 本步骤新解锁的 dock 按钮 id（累积生效）。 */
  allow?: string[];
}

export const TUTORIAL: StoryBeat[] = [
  {
    id: "wake",
    title: "荒园来信",
    body: "一封旧信引你回到这座荒废的花园。院门半掩，泥土还记得花香。管家临行留下一壶清水、几粒花种，只嘱咐一句：土还是好土，只欠一双肯侍弄它的手。",
    cta: "接过花锄",
    allow: [],
  },
  {
    id: "sow",
    title: "下一粒种",
    body: "开下方「花种」匣，挑一粒小雏菊——它性子最温和，田埂边最先醒来的就是它。选中后，点任意一块空圃播下。",
    cta: "这就去种",
    goal: "plant",
    objective: "在空圃里种下一粒花种",
    hint: "开「花种」选小雏菊，再点空圃播下",
    allow: ["seed"],
  },
  {
    id: "water",
    title: "引一瓢水",
    body: "点下方「洒水」换上水壶，按住拖过花圃。水到之处，芽才肯抬头；缸里的水会慢慢回满，急不得。",
    cta: "去浇水",
    goal: "water",
    objective: "给花圃浇一次水",
    hint: "选中「洒水」，按住拖过花圃",
    allow: ["water"],
  },
  {
    id: "harvest",
    title: "剪一枝花",
    body: "花开到盛处，换「收获」轻轻一剪。拖得久了花会蔫，蔫花不值几个钱——趁盛开时收进花匣，最是划算。",
    cta: "静候花开",
    goal: "harvest",
    objective: "收获一枝盛开的花",
    hint: "等花盛放，用「收获」点下它",
    allow: ["harvest", "fert"],
  },
  {
    id: "order",
    title: "接头一单",
    body: "打开「订单」，客人已在门外。花匣里有什么便接什么单；对不上的可婉拒换客，或照单再种一茬。交付换金币与经验，还能回一点水。",
    cta: "迎客去",
    goal: "order",
    objective: "交付一份订单",
    hint: "开「订单」，把花材交付给客人",
    allow: ["order", "bag"],
  },
  {
    id: "open",
    title: "自此看花",
    body: "园子活了。往后四季轮转、花艺插瓶、花灵驻园、庭院装扮，都由你做主。去吧，把这里种成你的花园世界。",
    cta: "开园",
    // "visit" 为访邻 dock 按钮预留门控位：按钮落地后自动随尾折解锁（见 docs/UX.md 六）。
    allow: ["workshop", "decor", "spirit", "plot", "visit"],
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

// ---------- 可选剧情折（番外） ----------
// 与主教程完全解耦：不占 tutorialStep、不参与 dock 门控、不推进 tutorialDone。
// 由邻访/摆放等玩法系统在对应时机首次发生时调用 renderSideStory（ui/tutorial.ts）弹出一次。

/** 番外折的触发时机，供玩法系统对号入座（详见 docs/UX.md 八）。 */
export type SideStoryTrigger = "visit-first" | "visit-pick-first" | "place-first";

export interface SideStory {
  id: string;
  trigger: SideStoryTrigger;
  title: string;
  body: string;
  cta: string;
}

export const SIDE_STORIES: SideStory[] = [
  {
    id: "fence",
    trigger: "visit-first",
    title: "篱外人家",
    body: "篱笆那头传来剪刀声——邻家阿姊也在侍弄园子。她隔篱招手：「进来坐坐？帮我浇两瓢水，看中哪枝花，尽管摘去。」串门自有礼数：水按她园里的缺处浇，花只摘盛开的，一日莫贪多。",
    cta: "串门去",
  },
  {
    id: "borrow",
    trigger: "visit-pick-first",
    title: "借花一枝",
    body: "你在阿姊园里剪下一枝开得正盛的花。她笑着摆手：「花开堪折直须折，拿去拿去。」借花要记情——回头替她多浇两瓢水，或等自家花开了给她留一枝，往来才长久。",
    cta: "记下这份情",
  },
  {
    id: "settle",
    trigger: "place-first",
    title: "一物得其所",
    body: "货郎把你购置的物件送进园来，问摆在哪。檐下、径旁、池畔各有讲究：物件放对了地方，园子的气韵才顺。泛着微光的位置就是空位，看好了再落座；不合心意，随时可挪。",
    cta: "亲手安置",
  },
];

export function sideStory(id: string): SideStory | undefined {
  return SIDE_STORIES.find((s) => s.id === id);
}
