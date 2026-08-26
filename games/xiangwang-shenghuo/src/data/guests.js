/** @type {{ id: string, name: string, specialty: string, buff: { target: string, factor: number }, favorite: string }[]} */
export const GUESTS = [
  { id: "uncle_hearth", name: "灶台叔叔", specialty: "掌勺", buff: { target: "kitchen", factor: 0.8 }, favorite: "bread" },
  { id: "brother_lantern", name: "灯哥", specialty: "张罗心愿", buff: { target: "wish", factor: 0.85 }, favorite: "soymilk" },
  { id: "aunt_grove", name: "林婶", specialty: "侍弄田亩", buff: { target: "farm", factor: 0.85 }, favorite: "strawberry" },
  { id: "kid_bamboo", name: "竹仔", specialty: "逗牲口", buff: { target: "livestock", factor: 1.1 }, favorite: "egg" },
];

export const guestById = (id) => GUESTS.find((g) => g.id === id);
