import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/mansion.css";
import "./styles/combat.css";
import { createStore } from "./core/store.js";
import { startEngine } from "./core/engine.js";
import { createUI } from "./ui/app.js";

const store = createStore();
store.dispatch({ type: "BOOT", now: Date.now() });
const ui = createUI(store);
startEngine({ store, render: ui.frame });
ui.paint(store.get());
