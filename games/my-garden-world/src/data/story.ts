export interface StoryBeat {
  id: string;
  title: string;
  body: string;
  cta: string;
}

export const TUTORIAL: StoryBeat[] = [
  {
    id: "wake",
    title: "荒园信",
    body: "你自后世坠入这座废园。院门半掩，泥土还记得花香。管家留下一壶清水与几粒雏菊种子——他说，先让土地重新呼吸。",
    cta: "推开院门",
  },
  {
    id: "sow",
    title: "第一粒种",
    body: "点选空地，播下种子。每一种花都有脾性：玫瑰耐旱，山茶怕积水。先从温柔的雏菊开始。",
    cta: "去播种",
  },
  {
    id: "water",
    title: "浇一杯春",
    body: "拖动洒水壶扫过花圃。水分足够，花才会肯往下一段生长。水滴会缓慢回升，也可以用订单换取。",
    cta: "学会浇水",
  },
  {
    id: "order",
    title: "第一位客人",
    body: "邻家阿姊来讨一束雏菊。收获花材，或在花艺作坊配一瓶作品，交付订单，花园便有了第一笔活钱。",
    cta: "开始经营",
  },
];
