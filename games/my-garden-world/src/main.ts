import { boot } from "./app";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app missing");
boot(root);
