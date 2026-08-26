import "./styles/tokens.css";
import "./styles/ink.css";
import "./styles/layout.css";
import { createStore } from "./core/store.js";
import { boot } from "./core/engine.js";

const store = createStore();
boot(document.getElementById("app"), store);
