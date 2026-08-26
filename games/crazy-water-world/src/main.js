import "./styles/tokens.css";
import "./styles/layout.css";
import { createStore, loadState } from "./core/store.js";
import { boot } from "./core/engine.js";

const saved = typeof localStorage !== "undefined" ? loadState() : null;
const store = createStore(saved && saved.meta ? { ...saved, meta: { ...saved.meta, started: false } } : undefined);
boot(document.getElementById("app"), store);
