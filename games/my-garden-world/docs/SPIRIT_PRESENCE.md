# 花灵形象与随行挂钩

Round 2 补上了「花灵无形象」的窟窿。形象是纯函数生成的 SVG，随行数据以只读结构导出，
场景层不必了解花灵系统内部结构，也不必改动 `src/systems/spirits.ts` 就能把花灵放进园子。

## 形象

```ts
import { spiritPortrait } from "../systems/spirits";

spiritPortrait("juyue");                              // 44px，跟随系统减弱动效设置
spiritPortrait("xueyi", { size: 64 });                // 自定尺寸
spiritPortrait("suideng", { locked: true });          // 未苏醒：水墨剪影 + 虚线封印
spiritPortrait(null);                                 // 未请灵：一枚留白空印
spiritPortrait("rainbow", { motion: false });         // 关掉 SMIL 动效
```

- `viewBox` 恒为 `0 0 64 64`，`width` / `height` 由 `size` 决定，`aria-hidden="true"`。
- 动效走内联 SMIL（`<animate>` / `<animateTransform>`），**不依赖任何 CSS**，
  面板、HUD、提示条、场景直接 `innerHTML` 注入即可，样式表改动与之无关。
- 五灵共用「光晕 + 冠饰 + 灵核 + 衣袂」的骨架，冠饰区分身份：
  菊月＝金菊承月、池光＝荷影池光、虹蝶＝虹翅穿花、雪衣＝雪衣覆枝、岁灯＝岁灯长明。

## 随行数据（给场景层）

```ts
import { spiritPresence } from "../systems/spirits";
import { isNight } from "../engine/time";

const presence = spiritPresence(state, isNight(state));
// null 表示无灵随行；有灵时：
// { id, name, motif, palette: { core, aura, ink },
//   orbit: { radiusPct, periodMs, bobPx, scale }, auraOpacity, svg }
```

- `orbit` 是建议的绕行参数：半径按格宽百分比、周期毫秒、上下浮动像素、整体缩放。
  五灵各不相同（虹蝶最快最飘、岁灯最稳最大），场景层可直接用，也可自行改写。
- `auraOpacity` 夜里更亮。
- `svg` 可直接注入；增量渲染时用 `presence.id` 做 key 比对，id 不变就别重建节点。

## 根节点挂钩

HUD 每帧把当前花灵写到根节点（常量 `SPIRIT_ATTR === "data-spirit"`，与 `data-season` /
`data-night` 同处一层），无灵时为空串：

```html
<div class="app" data-season="autumn" data-night="1" data-spirit="chiguang">
```

- 场景 / 样式表可以直接挂钩，例如 `.app[data-spirit="chiguang"] .garden { … }`。
  视觉层的「花灵驻园灵玉」（`docs/VISUAL.md` §六，`.stage::before/::after`）即由此点亮。
- 花灵面板的请灵卡同样挂了 `data-spirit="<id>"`，per-灵配色令牌随之生效。
- 音景（`src/audio/soundscape.ts`）已在观察这三个属性，随季节、昼夜、随行花灵换调，
  所以场景层写不写这个属性都不影响声音，属性只增不减即可。
