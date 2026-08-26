import "./styles/tokens.css";
import "./styles/ink.css";
import "./styles/layout.css";
import { createStore } from "./core/store.js";
import { boot } from "./core/engine.js";

const root = document.getElementById("app");
const store = createStore();
const app = boot(root, store);

if (import.meta.hot) {
  import.meta.hot.dispose(() => app.destroy());
}
