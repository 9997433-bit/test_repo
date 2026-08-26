/** 邻家花园（单机 NPC 互访，见 docs/UX.md 六）：邻居取自订单文案里已出场的人物。 */

export interface NeighborDef {
  id: string;
  name: string;
  /** 印章字（邻居卡头像） */
  seal: string;
  unlockLevel: number;
  /** 园子 4~8 块花圃 */
  plotCount: number;
  /** 偏好花池：园子生成从这里取（邻家自有奇花，不受玩家解锁限制）。 */
  favorites: string[];
  /** 问候语变体：下标 = min(友谊心数, 长度-1)，友谊越深话越亲。 */
  greetings: string[];
}

export const NEIGHBORS: NeighborDef[] = [
  {
    id: "a-zi",
    name: "邻家阿姊",
    seal: "姊",
    unlockLevel: 1,
    plotCount: 6,
    favorites: ["daisy", "peach", "orchid", "magnolia", "peony"],
    greetings: [
      "进来坐坐？帮我浇两瓢水，看中哪枝花，尽管摘去。",
      "又来啦？灶上煨着茶，园里自己转。",
      "你一来，园里的花都开得勤了些。",
      "自家人不说客气话——花开堪折直须折。",
    ],
  },
  {
    id: "tea-keeper",
    name: "茶寮掌柜",
    seal: "茶",
    unlockLevel: 3,
    plotCount: 5,
    favorites: ["jasmine", "lotus", "sunflower", "osmanthus", "waterlily"],
    greetings: [
      "稀客。后园的茉莉开了，替我照看一眼？",
      "茶沏上了，园子随你看。",
      "常来常往，这园子也有你一半功劳。",
    ],
  },
  {
    id: "east-hermit",
    name: "东篱客",
    seal: "篱",
    unlockLevel: 5,
    plotCount: 8,
    favorites: ["chrys", "maple", "amaranth", "spider-lily", "plum"],
    greetings: [
      "采菊东篱下——你来得正好，篱边正缺一瓢水。",
      "山中无历日，见花知节候。随意。",
      "知音来时，满篱秋色都是赠礼。",
    ],
  },
];

export const NEIGHBOR_MAP = Object.fromEntries(NEIGHBORS.map((n) => [n.id, n])) as Record<string, NeighborDef>;
