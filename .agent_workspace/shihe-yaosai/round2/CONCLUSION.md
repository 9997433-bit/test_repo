# 《Round 2 结论简报》· 蚀核要塞

主调度器整理。10/10 回收并合入 `cursor/shihe-yaosai-f69e`。
父 PR：https://github.com/9997433-bit/test_repo/pull/50

## 演进对比

| 项 | Round 1 | Round 2 |
| --- | --- | --- |
| `npm test` | 30/32 | **84/84 全绿** |
| JSON `-0` / 首波 | 红 | 首怪 1.53s，view JSON 纯净 |
| data 导出名 | 别名警告 | sim 只读正式名 |
| 弹道双画 | world+combat | world 已删 shots.js |
| 主循环签名 | 多形态探测 | 单签名 + frameEvents |
| `npm run probe` | 5 波 8 漏 exit 0 | **仍红**：布局太弱，17 漏波 3 败 |
| `sim smoke --waves=5` | 有 | **0 漏通关** seed=7 |
| build | 359kB gzip | 472kB gzip 主 chunk |

## 已修

- O3：`-0`、首波、确定性、过载×2.2、棱镜两段 beam、升级/出售
- O2：world 不再画 shots
- O1：冻结 API 接线、相机交接、frameEvents
- O4：单签名 HUD/输入；漏敌/胜负 toast
- F1/F2/F3/F4：契约 v2、过热橙/漏敌红、firstWaveDelay 0.5、SOTA 记分
- G1：契约测现已全绿

## 潜在边界 / SOTA 差距

1. **P0 probe 门槛** `leaks<=2` 未达标（17 漏）。smoke bot 能 0 漏，G2 必须改用均匀 5 塔布局（0/4/8/12/16/20 循环 rail/prism/scatter/well/star），不要挤在 0/3/6。
2. **双 GlowLayer**：engine 与 world 各建一层，high/mid 可能过亮。world 删除自建 GlowLayer，交给 engine。
3. **包体** 主 chunk 1.85MB / gzip 472kB，可接受；R3 父调度器可改 vite manualChunks（共享只读，子代理勿改 vite.config）。
4. **浏览器整包验收**未在父机做；R3 必须 :4182 真机放塔+过载+漏敌 toast。
5. **Pages 目录**仍未接。

## Round 3 冲刺（注入全部 10 代理）

1. probe 5 波 leaks≤2 且 exit 0（照抄 smoke 的分散布局，禁止改门槛放水）。
2. world 去掉 GlowLayer；combat 弹道可辨。
3. SOTA 清单按 84/84 与新 probe 记分；L1 目标全绿。
4. 补棱镜折射 / 过载伤害的单测（G1）。
5. 不要改其它游戏、不要改 `.github`（catalog 由父调度器接）。
