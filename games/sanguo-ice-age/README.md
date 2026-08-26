# 三国：冰河时代（网页致敬作）

独立目录网页 SLG，致敬《三国：冰河时代》：极寒生存城建 + 武将招募养成 + 编队讨伐流寇。
纯 ES Modules，无构建步骤、无运行时依赖；本目录与仓库内其他游戏隔离，可单独运行。

详细玩法、面板导览与数值口径见 **[docs/PLAYGUIDE.md](docs/PLAYGUIDE.md)**。

## 运行

游戏用原生 ES Modules 动态加载，`file://` 直接打开会被浏览器拦截，必须起一个静态 HTTP 服务：

```bash
cd games/sanguo-ice-age
python3 -m http.server 4176 --bind 127.0.0.1   # 或 npm start
```

浏览器打开 `http://127.0.0.1:4176/`。首次进入会自动播放新手引导（可按 `H` 重看）。

## 测试

需要 Node.js（仅测试用，游戏本体不依赖 Node）：

```bash
node tests/runner.mjs   # 单元 + 集成测试（npm test），当前 24/24 通过
node tests/bench.mjs    # 性能基准（npm run bench）
node tests/probes.mjs   # 冒烟探针，输出 JSON 报告（npm run probe）
```

## 核心循环

1 倍速下每 250ms 一个 tick，16 tick 为一天（约 4 秒）。

1. **火炉是全城心脏**：每级供热 3.2°，持续烧木/煤；火炉等级封顶其他建筑等级，升火炉又要求特定建筑先达标，形成「炉—矿」交替升级。
2. **囤资源抗寒潮**：约每 7 天一次寒潮（−14° 上下，持续约 2 天，燃料消耗 ×1.4）。发展伐木场 / 猎人小屋 / 煤矿 / 铁矿，用仓库扩容。
3. **保民心保人口**：气温、饥饿拉低民心；厨房 / 诊所 / 民居保温回稳。民心 ≤15 或人口归零即败亡（无胜利结局，尽量活得久）。
4. **招贤养将**：招贤馆用招募令抽将（120 肉食 + 60 精铁一张，十连保底紫），同阵营 ≥3 人有加成。
5. **练兵讨伐**：兵营派工练兵，点将 + 拨兵讨伐流寇；步克骑、骑克弓、弓克步，吴克蜀、蜀克魏、魏克吴。胜得物资 / 招募令 / 武将经验。

左上「功业簿」12 条主线任务是前中期的行动指南，达成后点「领赏」入账。

## 操作键位

- 鼠标：拖拽平移 · 滚轮缩放 · 悬停看提示 · 点击建筑打开升级面板 · 右下 `◎` 回正视角
- `空格` 暂停/继续 · `1` / `2` / `3` 对应 1x / 2x / 4x
- `Esc` 关闭面板 · `R` 回正视角 · `H` 重看教程 · `N` 败亡后重开一局
- 顶栏「导出 / 导入」按钮可将存档下载为 JSON 文件或从文件载入

## 权威建筑 id

`js/data/buildings.js` 是唯一权威（17 个，snake_case）；`config.BUILDING_IDS` 列其中 16 个槽位，火炉单独存 `city.furnaceLevel`：

```
furnace  lumber  hunter  coal_mine  iron_mine  house  warehouse  kitchen  clinic
barracks_inf  barracks_arch  barracks_cav  hospital  academy  tavern  wall  embassy
```

旧写法（`lumberyard` / `coalmine` / `warmhouse` / `storage` / `barracks` / `recruit` …）只作为读档迁移与画布别名存在于 `config.BUILDING_ID_ALIASES`，**新代码一律使用权威 id**。

## 已知限制

- 弓兵营 / 骑兵营 / 伤兵营 / 使馆（`barracks_arch` / `barracks_cav` / `hospital` / `embassy`）未接入画布映射，UI 里无法营建——实际只能练步兵，伤兵康复只靠诊所。
- 存档只有 localStorage 单键 `sanguo-ice-age-save-v1`，校验失败按新游戏处理、不留备份。
- 武将驻守加成有数值通道但没有指派 UI。
- 无胜利结局；主线任务领完后进入无尽生存。

完整清单与说明见 [docs/PLAYGUIDE.md](docs/PLAYGUIDE.md) 的「已知限制」。

## 文档

- [docs/PLAYGUIDE.md](docs/PLAYGUIDE.md) — 玩家指南：运行 / 玩法 / 键位 / 建筑表 / 已知限制
- [docs/DESIGN.md](docs/DESIGN.md) · [docs/UX.md](docs/UX.md) — 设计与交互稿
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/INTEGRATION.md](docs/INTEGRATION.md) — 架构与合并记录
- [docs/ROUND2_AUDIT.md](docs/ROUND2_AUDIT.md) · [docs/SOTA.md](docs/SOTA.md) · [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) — 审计与验收
