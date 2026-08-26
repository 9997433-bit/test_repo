# 艾泽拉斯要塞塔防 · Azeroth Keep TD

独立目录中的《魔兽争霸 III》风格塔防致敬作。玩法参考 Element TD、Wintermaul 与经典迷宫 TD，**不含暴雪版权素材**（画布绘制 + WebAudio 合成）。

## 运行

用浏览器直接打开 `index.html`（`file://` 可用），或：

```bash
cd warcraft3-td
python3 -m http.server 8080
```

然后访问 http://127.0.0.1:8080/

## 操作

- 点选命令卡或快捷键建造四族防御塔（人类 / 兽族 / 暗夜 / 亡灵，各 3 系 3 阶）
- 左键选择，右键取消建造或给英雄下达移动
- `U` 升级 · `S` 出售（75% 退款）· `N` 下一波 · `Space` 暂停
- 选中英雄后 `Q` `W` `E` 施法
- 滚轮缩放，Shift+右键拖动镜头

## 魔兽式规则

- 攻击类型 × 护甲类型倍率表（穿刺克轻甲、攻城克城甲、魔法克重甲、混乱打满……）
- 护甲减伤采用 TFT 公式 `0.06a / (1+0.06|a|)`
- 空中单位仅能被标记 `canHitFlying` 的塔攻击
- 魔免单位免疫 magic / spells
- 每 15 秒按未花费黄金结算利息（2%–8%）
- 每 5 波 +1 木材；30 波，每 5 波头目

## 测试

```bash
node tests/run.mjs
node tests/bench.mjs
```

## 目录

本游戏只存在于 `warcraft3-td/`，不会和其他游戏抢根目录。设计细节见 [DESIGN.md](./DESIGN.md)。
