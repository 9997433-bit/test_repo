/**
 * 全部为原创人物，禁止使用真人姓名。
 * buff.factor 语义：< 1 为对应环节耗时乘数（越小越快）；> 1 为产出/售价乘数。
 * @type {{ id: string, name: string, specialty: string, buff: { target: string, factor: number }, favorite: string }[]}
 */
export const GUESTS = [
  { id: "uncle_hearth", name: "灶台叔叔", specialty: "掌勺", buff: { target: "kitchen", factor: 0.8 }, favorite: "bread" },
  { id: "brother_lantern", name: "灯哥", specialty: "张罗心愿", buff: { target: "wish", factor: 0.85 }, favorite: "soymilk" },
  { id: "aunt_grove", name: "林婶", specialty: "侍弄田亩", buff: { target: "farm", factor: 0.85 }, favorite: "strawberry" },
  { id: "kid_bamboo", name: "竹仔", specialty: "逗牲口", buff: { target: "livestock", factor: 1.1 }, favorite: "egg" },
  { id: "granny_teapot", name: "茶婆婆", specialty: "煮茶唠嗑", buff: { target: "stall", factor: 1.1 }, favorite: "milk_tea" },
  { id: "sister_reed", name: "苇姐", specialty: "纺线织衣", buff: { target: "weavery", factor: 0.85 }, favorite: "cabbage_tofu" },
];

export const guestById = (id) => GUESTS.find((g) => g.id === id);
