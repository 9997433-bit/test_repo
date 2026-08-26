// 壳层：只做三件事——装样式、把存档水合成 store、把 render 注入引擎主循环。
// render 由这里显式传给 boot，core/engine.js 的兜底动态 import 不再有人依赖。
import "./styles/tokens.css";
import "./styles/layout.css";
import { createStore, loadState } from "./core/store.js";
import { boot } from "./core/engine.js";
import { render } from "./ui/app.js";

const saved = typeof localStorage !== "undefined" ? loadState() : null;
// 读档一律停在标题页：让老大自己决定是继续漂还是重开。
const store = createStore(saved ? { ...saved, meta: { ...saved.meta, started: false } } : undefined);

boot(document.getElementById("app"), store, { render });
