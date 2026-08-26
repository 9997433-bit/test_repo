# 我的花园世界

独立目录中的国风花艺师模拟经营（致敬《我的花园世界》核心循环）。与仓库内其他游戏隔离，自包含 Vite + TypeScript。

## 玩法

播种 → 浇水/施肥 → 收获花材 → 花艺作坊插花（凡/雅/精/神）→ 交付订单与「百花盛会」剧情单 → 装扮庭院（八锚位摆放）→ 请花灵驻园 → 访邻帮浇/借花。

离园最多按 2 小时墙钟补算；静音偏好与花园存档分开保存。

## 本地运行

```bash
cd games/my-garden-world
npm install
npm run dev
```

测试：`npm test`  
探针：`npm run probe`  
构建：`npm run build`

## 文档

- `docs/GDD.md` 数值与内容
- `docs/ARCHITECTURE.md` 模块边界
- `docs/UX.md` 教程 / 访邻 / 摆放
- `docs/VISUAL.md` 国风令牌
- `docs/SOTA_AUDIT.md` 验收
- `docs/PERF.md` 性能预算
