/**
 * 五店小游戏的聚合出口。app.js 仍按 `SHOP_VIEWS` 逐个 import 具体文件，
 * 这里只是给后续路由/测试一个稳定入口，顺带把可在 Node 里断言的纯逻辑集中导出。
 */

export { renderFastfood, orderTip, orderMs, rollOrder } from "./fastfood.js";
export { renderFresh, freshPayout } from "./fresh.js";
export { renderBoutique, boutiqueScore, buildBoard } from "./boutique.js";
export { renderBlindbox, drawBox, drawRun, tierClass } from "./blindbox.js";
export { renderFortune, fortuneResult, spinOmens, expectedSpin, OMENS } from "./fortune.js";
export { payouts, poolExpectation, pickWeighted, chanceOf } from "./payouts.js";
