# Round 2 派发简报 · 蚀核要塞

把《Round 1 结论简报》全文当作前置上下文。所有权表不变。本轮靶向修缺陷，不新开玩法。

## 必读

- `.agent_workspace/shihe-yaosai/round1/CONCLUSION.md`
- `.agent_workspace/shihe-yaosai/OWNERSHIP.md`

## 本轮完成定义

- `npm test` 全绿（含 world.test + 契约测）
- `npm run probe` 5 波 leaks≤2 且 coreHp>0，exit 0
- `npm run build` exit 0
- getView 无 `-0`；data 正式导出名被 sim 使用；shots 只 combat 画
