/** 烟测：js/ 下所有 ESM 模块在 Node 中均可导入（渲染/UI 模块导入时不得触碰 DOM）。 */
import { suite, test, assert } from "../harness.mjs";
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const jsRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "js");

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

suite("modules：全模块导入烟测", () => {
  const files = collect(jsRoot);
  test(`发现 ${files.length} 个模块`, () => {
    assert(files.length >= 15, "模块数量应完整");
  });
  for (const file of files) {
    const rel = file.slice(jsRoot.length + 1);
    test(`import js/${rel}`, async () => {
      await import(pathToFileURL(file).href);
    });
  }
});
