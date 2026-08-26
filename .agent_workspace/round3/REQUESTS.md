# Round 3 接口请求（追加写入）

> 各代理发现契约缺口时在此追加，勿改他人代码。

## gpt-sol-1 · 测试链扩展（2026-08-26）

- **P1 · 开局礼包需接入新档**：`data/balance.js` 的 `STARTER_KIT` 足够 3 次精铁锻，但 `createBoundGame()` 的实际新档仍沿用 `core/state.js` 的 200 铜钱、30 精铁，只够 1 次。请由组合根或统一的新档初始化器应用 `STARTER_KIT`，避免“数据表声明充足、玩家实得不足”。
- **P2 · 空体力失败缺少稳定原因码**：`challengeStage()` 当前仅返回 `{ ok:false, error:'体力不足' }`。请补充稳定的 `reason`（如 `insufficient_stamina`），让测试与 UI 不必匹配中文文案。
