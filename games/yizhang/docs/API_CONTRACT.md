# 异掌 · 公共 API 契约 v4.4（固定人物视角轮 Round 2 · sample 分派收口，冻结）

> 手感轮改四处：渲染朝向零补偿、皮肤契约、每掌 VFX / ghosts、hit-stop 边界。大厅轮追加：`Input.interact`、`HUB` 布局、`phase/hub` 视图、`hubEquip/hubLocked/hubFocus/hubPortalNear/enterArena/enterHub`。O1 缺省 `phase:'hub'`；旧测靠空间规则或 `skipHub`。大厅 ADR 记为 29…32（手感轮已占用 25…28）；Round 2 新增 ADR-33…35（空挥闸 / skinId+ghosts 导出 / 相机 pitch）；Round 3 新增 ADR-36（双区渲染子树互斥，见 ARCHITECTURE §10）。**视角轮新增 ADR-37…39（机位 yaw 喂入空间 / `lookMode` / 过门相机 snap，见 ARCHITECTURE §5.1.2 与 §10）**。
>
> **v4.4 修订说明（固定人物视角轮 Round 2，零新 ADR、零新 SimEvent/SoundName，冻结）**：两件事。① **把 ADR-38 的 `sample()` 分派升格为可测不变量并点名实现缺口**：Round 1 F4 判 **LK-04 FAIL**——`input.sample()` 未分模式，恒送 `cameraYawToSimYaw(θ)`，free 行为等同 locked；sim 的 `yaw: null` 不覆盖门（`step.js` 只在 `Number.isFinite(input.yaw)` 时直赋）与 renderer 的机位半边**都已在位且有测**，缺的只有 input 这一段分派。本版新增不变量 **§14-34（sample 分派封闭表）/ §14-35（机位跟随角按模式选源）**，Round 2 由 O4 落地、G1 锁测、F4 重判 LK-04。② **按实现登记 Round 1 合入终态（契约向实现修，方向同 v4.1/v4.2）**：`lookPayload` 的 `yaw` 字段现与 `simYaw` **同值同空间**（相机系角不出输入层，比 v4.3「保留相机系调试读数」更严）；payload 随帧携 `lookMode`，渲染器持有**随帧镜像**（`setLookMode/getLookMode`，每帧被 payload 覆盖，不构成第二权威——ADR-38 措辞按此修订，见 §7.1）；input 句柄的 `toggleLookMode()`（V 键同路、触发 `onLookModeChange`）与 `setLookMode` 静默 setter 语义按实现更正（§8）；`getLook()` 追加 `lookMode` 字段；锁视角 HUD DOM（`.yz-look-flash` + `#hud[data-look]`）、O3 Bot 护栏、F3 GDD 文案**均已合入父分支**——F4 清单里对应 DEFER 已过时（LK-09 等），SOTA_CHECKLIST/ACCEPTANCE 改勾归 F4（本文只登记事实）。全程 `RENDER_YAW_OFFSET` 恒 0、只有两套角空间、**禁止第四套朝向**（ADR-25/37 重申，一字不动）。新名登记见 §0.2。
>
> **v4.3 修订说明（固定人物视角轮 Round 1，冻结）**：修「视角转换很奇怪」的根因并冻结「固定人物视角」。已核验的根因：`core/look.js feedLook` 每帧把 `input.getLook()` 整包（`yaw` 是**相机系**方位角）丢给 `renderer.setLook`，而 `setLook` 把 `o.yaw` 存进 `lookYaw`、`sync` 里 `lookYaw == null ? local.yaw : lookYaw` 把**相机系角当 sim 角**用——喂入口违反了 `setLook` 注释里早已写明的空间要求。本版冻结四件事：① **机位 yaw 喂入 = sim 空间**（ADR-37，§7 `setLook` 优先 `simYaw`）；② **`lookMode: 'locked'|'free'`** 视角模式（ADR-38，缺省 `locked` = 固定人物视角；§8 input 持有）；③ **过门机位 snap**（ADR-39，§7 `snapCamera`，enterArena/enterHub/开局禁止弹簧飞越 ~120m）；④ 切换四通道（V 键 / 设置项 / `?look=` / 存档 `lookMode`，§8/§12/§13.2）。全部新名见 §0 v4.3 登记表；新不变量 §14-28…33。`RENDER_YAW_OFFSET` 恒 0（ADR-25）不动。
>
> **v4.1 修订说明（SOTA_CHECKLIST §11.6 洞 4 收口，方向 = 契约向实现修）**：v4 与已被 330 测锁定的实现存在七处名/义漂移，本版全部按**实现的名字**改写（见下方「§0 名义漂移收口表」）。旧名一律是**从未实装的死名**（aliases-not-used）：不得对其写测试、写分派表或写音效映射。
>
> **v4.2 修订说明（Round 3 收口，零新 API，全部为登记既有实现）**：① §7 登记 `createRenderer` 已实装的 `data`/`skins` 可选项与皮肤剪影通路（`skinAppearance()` 归一 + 配件映射冻结，§3.2-6）；② §7 锁定战斗 VFX 分派词表 = `render/combat-vfx.js` 的 `COMBAT_VFX_KIND` 八词（afterimage = `phase`，**不是** mirror）；③ §7 补记双区互斥渲染子树（ADR-36）与测量口 `getStats()`——L3-10 实测数字见 ARCHITECTURE §8；④ §4.4 hub 内 `switchGlove` 按实现改写为**主副交换、无锁**（`sim/hub.js swapHubLoadout`，`hub-actions.test.js` 锁定——v4.1 曾误写「与 arena 同语义」，与实现相反）；⑤ §13.1 登记进局入口语义（`core/entry.js`：再来一局 `skipHub:true` ≠ 回安全区 `skipHub:false` 不预填掌）。
>
> **变更规则**：已列出的导出（名字、参数、返回形状）不得改动或删除；追加新导出/新可选字段允许，但必须先在本文登记再写代码。类型用 TS 记法描述形状，实现是纯 JS。

## 0. 名义漂移收口表（v4 旧名 → 实现名，v4.1 起以右列为准）

| # | v4 旧名（死名，勿用） | 实现名（本文全文已改用） | 出处 |
| --- | --- | --- | --- |
| ① | `createMatch` 选项 `startPhase`（并注「缺省 `'arena'`」）、`unlockedGloveIds` | `phase` / `skipHub`（**缺省 `'hub'`**）、`unlocked`（别名 `unlockedGloves` 也认） | `sim/state.js resolvePhase`、`sim/hub.js resolveUnlocked` |
| ② | 事件 `phaseChange{from,to,yaw}` | `enterArena{id,x,y,z}` / `enterHub{id,x,y,z}` | `sim/state.js enterArena/enterHub` |
| ③ | 事件 `hubDeny{reason:'locked'}` | `hubLocked{gloveId,unlock}` | `sim/hub.js equipFromPedestal` |
| ④ | HubView `nearPortal`、`mainChosen/offChosen` | `portalNear`、`mainGloveId/offGloveId` | `sim/hub.js hubView` |
| ⑤ | 传送触发「进 `portal.aabb`」 | 圆形 `portal.radius`（数据表可同时给 aabb，**sim 只读 radius**） | `sim/hub.js nearPortal` |
| ⑥ | 装备规则「已落位 ⇒ 无声 no-op」 | 副掌上再按 = **提为主掌**（原主退副）；仅「已是主掌再按主」才 no-op（发 `changed:false` 回执） | `sim/hub.js equipFromPedestal` |
| ⑦ | 音效映射 `hubEquip→equip / hubDeny→deny / phaseChange→portal` | 按 §11 实测表：`hubFocus→uiMove`、`hubEquip→switchGlove`、`hubLocked→uiBack`、`enterArena→matchStart`；未列出的事件保持静默 | `src/main.js handleEvents` |

### 0.1 v4.3 名义登记表（视角轮 Round 1 新名，先登记后写代码）

| 名 | 语义 | 归属（实现席） |
| --- | --- | --- |
| `lookMode: 'locked'\|'free'` | 视角模式，缺省 **`locked`** = 固定人物视角（ADR-38）。值域冻结为这两词，第三值先登记再用 | input 持有状态（O4）；存档字段（§12）；URL 值域（§13.2） |
| payload `simYaw` | `core/look.js lookPayload` 产出、`renderer.setLook` 优先消费的 **sim 空间**水平角（ADR-37） | O4 产出、O2 消费 |
| `snapCamera()` | 渲染句柄冻结追加：跟随相机弹簧状态立即置稳态（ADR-39，§7） | O2 实现、O4 调用 |
| `CAMERA_SNAP_TELEPORT = 60` / `CAMERA_SNAP_MAX_DIST = 20` | snap 阈值常量（米，§7；render 导出供 G1 引用） | O2 |
| `setLookMode(mode)` / `getLookMode()` / `opts.lookMode` / `opts.onLookModeChange` | input 句柄的模式 API（§8） | O4 |
| 键 `V`（`KeyV`） | lookMode 切换键（上升沿 toggle，不占用 E/WASD/空格/Q/F/Shift） | O4（input） |
| `?look=locked\|free` | URL 通道：覆盖本次会话的初始 lookMode，**不回写存档**（§13.2） | O4（main）、G2（smoke/probe 参数） |
| 存档 `lookMode` | `SaveV1` 追加字段，老档缺失补 `'locked'`（§12） | O4（storage） |

死名预防：本轮**没有**任何旧名可复活。~~`lookPayload` 里的 `yaw` 字段（相机系）保留仅供探针/调试读数~~——**v4.4 按实现更正**：合入的实现比这条更严，`payload.yaw === payload.simYaw`（同值同空间，`core/look.test.js` 锁定键集恰为 `{yaw, pitch, simYaw, lookMode}`）——相机系角**根本不出输入层**，「渲染器不得消费相机系角」由「链路上没有相机系角」保证；`setLook` 的 simYaw 优先规则原样保留（防直连调用方只给 `yaw` 键时空间歧义，§7.1）。全项目唯一的相机系读数出口 = `input.getLook().yaw`。`RENDER_YAW_OFFSET` 恒 0，禁止用「再加一个偏移」修视角（ADR-25 重申）。

### 0.2 v4.4 名义登记表（视角轮 Round 2，全部为登记既有实现，方向 = 契约向实现修）

| 名 | 语义 | 出处（已合入、已有测） |
| --- | --- | --- |
| `input.toggleLookMode()` | 模式翻转，**与 V 键同一条路径**：触发 `onLookModeChange`（触控钮/调试用）。`setLookMode` 是**静默 setter**（§8，v4.3 曾写「同路」，与实现相反，本版更正） | `src/input/index.js`；`input/index.test.js` |
| `input.getLook().lookMode` | `getLook()` 追加字段：`{ yaw, pitch, lookMode }` 随帧透出（供 `lookPayload`/壳层读；运行期权威语义不变） | `src/input/index.js` |
| payload `lookMode` / `renderer.setLookMode(mode)` / `getLookMode()` / `setLook` 的 `lookMode` 键 | `lookPayload` 恒携 `lookMode`（缺省收 `'locked'`）；渲染器持有**随帧镜像**并按它选机位跟随角（§7.1、§14-35）。镜像每帧被 payload 覆盖，**不是第二权威**（ADR-38 修订） | `core/look.js`、`render/renderer.js`；`render/look.test.js` |
| `payload.yaw === payload.simYaw` | `lookPayload` 的 `yaw` 与 `simYaw` 同值同空间（sim 系）——相机系角不出输入层 | `core/look.js`；`core/look.test.js` |
| `normalizeLookMode(value, fallback?)` / `resolveLookMode(ctx)` / `DEFAULT_LOOK_MODE` | 模式归一（缺省回落 `'locked'`）/ 初值取值链（URL > 存档 > 缺省，§13.2）/ 缺省常量，全链共用一份词表实现 | `core/look.js` |
| `hud.setLookMode` / `shell.setLookMode` / `#hud[data-look]` / `.yz-look-flash` | 锁视角 HUD **DOM 已合入**：`#hud[data-look]` 模式镜像（常驻 data 属性）+ `.yz-look-flash` 切换一瞬回执（唯一一枚，≈0.9s 自摘）。F4 清单 LK-09 的 DEFER 已过时，改勾归 F4（§13.2） | `src/ui/hud.js`、`shell.js`、`main.js`；`hud.test.js`、`shell.test.js` |

Round 2 **零新 SimEvent、零新 SoundName、零新 ADR**；上表全部是 Round 1 合入代码的补登记。唯一待实现项 = `input.sample()` 的模式分派（§8、§14-34，归 O4）——它不引入任何新名（`yawFromDir` 是 §4.1 既有导出）。

## 1. 总则与硬性不变量

1. `src/sim`、`src/data`、`src/combat`、`src/ai` 禁止 import `three`、禁止触碰 DOM / `window` / `document` / `performance` / `Math.random`。
2. `MatchState` 只含 plain object / array / number / string / boolean / null——`structuredClone(state)` 无损，克隆后继续 `step` 与原件逐位一致。
3. `getView(state)` 返回全新纯 JSON 快照（无函数、无 `undefined`、无 `Infinity`/`NaN`），调用不改 state。外壳层只准持有快照。
4. `GLOVES` / `MATCH` 等 data 表只读；觉醒等数值覆盖走 `applyAwaken` 的派生副本。
5. 确定性（只约束 sim）：同 `seed` + 同输入序列 + 同 `dt` ⇒ 逐位复现。
6. 事件（§10）是模拟核对外唯一「已发生」通道，**只由 sim 发射**（ADR-22）；音效名（§11）是 main→audio 的唯一词表。
7. 存档 key 唯一：`yizhang-save-v1`，只有 `src/core/storage.js` 读写 localStorage。
8. **朝向约定全局唯一**（ADR-17，手感轮修订）：`yaw = 0` 面向 **-Z**，`forward(yaw) = (-sin yaw, -cos yaw)`，`right(yaw) = (cos yaw, -sin yaw)`；three 侧 `mesh.rotation.y = yaw` 直用。**render 零补偿（ADR-25）**：`core/view.js` 的 `RENDER_YAW_OFFSET` 恒为 0，`toRenderView` 对 yaw 恒等透传。朝向换算点全项目只有两处：`sim/combat-bridge.js`（combat ±π，含 `ghostsView` 的 yaw 还原）与 `core/view.js cameraYawToSimYaw / simYawToCameraYaw`（相机方位角）。键鼠语义验收线：**W = 镜头水平前方、A = 屏幕左、鼠标右移 = 右转**（锚点公式见 ARCHITECTURE §5.1.1 与本文 §14-15/16）。
9. **人类玩家 id 全局唯一**（ADR-16）：`'p0'`；bot 为 `'b0' | 'b1' | 'b2'`。
10. **皮肤纯装饰**（ADR-26）：`skinId` 只影响外观，禁止挂数值；sim 视其为不透明字符串，合法性由消费端 `resolveSkin` 兜底。
11. **全项目只有两套角空间**（ADR-17/25/37，视角轮收口）：**相机系**（input 内部方位角 θ，`input.getLook().yaw`，水平前向 = `(cos θ, sin θ)`）与 **sim 系**（`yaw = 0` 面向 -Z，`forward = (-sin yaw, -cos yaw)`——sim、render、camera、`view.players[].yaw`、`renderer.lookYaw` 共用）。combat 内部 +Z 基只住在桥内、桥外不可见（§5.1），**禁止第四套**。两系之间的换算只有 `core/view.js cameraYawToSimYaw / simYawToCameraYaw` 一处（combat ±π 在桥内另算）。**机位喂入纪律（ADR-37）**：凡是要写进 `renderer.lookYaw` 的水平角必须已是 sim 空间——`feedLook` 不得让相机系 θ 落进去（§7 `setLook` 的 `simYaw` 优先语义即为此收口）。在同一空间内由矢量求角（如 `yawFromDir(x,z) = atan2(-x,-z)`）不算换算点，跨空间才算。

## 2. 通用类型

```ts
type PlayerId = 'p0' | `b${number}`;   // p0 = 人类；b0..b2 = bot（botCount 默认 3）
type GloveId  = 'cotton'|'granite'|'gale'|'frost'|'spring'|'afterimage'|'magnet'|'meteor';
type Tier     = 'high'|'mid'|'low';
type Persona  = 'brute'|'fox'|'bully';
type SkinId   = 'drifter'|'mason'|'crane'|'reed'|'nuo'|'wildhorn';   // 皮肤词表 v1（§3.2）；新皮肤先登记再写代码
// 技能 id 两套词表（翻译表见 §3.1，ADR-23）
type SkillDataId    = 'quake_slam'|'wind_rush'|'frost_arc'|'coil_counter'|'phantom_swap'|'iron_pull'|'sky_fall';
type SkillHandlerId = 'groundPound'|'dashSlap'|'frostArc'|'parry'|'blinkSwap'|'magnetPull'|'meteorSlam';

interface Input {
  moveX: number;          // -1..1，世界系（input 层已按 cameraYaw 换算），√(x²+z²) ≤ 1
  moveZ: number;          // -1..1，世界系
  yaw: number | null;     // 期望面朝角（世界系弧度，ADR-17 约定）；null = 保持当前朝向
  slap: boolean;          // 可长按（sim 冷却/相位机闸门）
  skill: boolean;         // 可长按（sim 边沿检测 + 冷却）
  switchGlove: boolean;   // ↓ 四个由 sim 做上升沿检测，长按不连发
  dash: boolean;
  jump: boolean;
  interact: boolean;      // HUB-R1 新增（ADR-32）：hub = 装备最近台座；arena = no-op（R2 回程预留）。
                          // input 以持续位上报（含 edge 补帧防短点触漏拍），sim 在 p.prev.interact
                          // 做上升沿。键鼠 E 双义（skill hold + interact），由 input.setPhase 分流：
                          // hub 下 sample 把 slap/skill 归零、只出 interact（§8）。
  interactSlot?: 'main'|'off'|null;   // HUB-R1：触控槽位钮直接指定要装的槽；缺省 null = 「先主后副」
  moveSpace?: 'world'|'local';   // 缺省 'world'；'local' 按玩家 yaw 旋转，仅测试用
}
// 缺省玩家视为零输入。sim 导出两份基准：`ZERO_INPUT` **不含** interact 键（Bot 键集全等断言
// 的基准，禁止把 interact 塞进去）；`HUB_ZERO_INPUT` = ZERO_INPUT + { interact:false,
// interactSlot:null }（hub 测试/壳层基准）。缺省语义上 interact 视为 false。
```

**摇杆→世界系换算**（input 层职责，θ = cameraYaw，`sx` 屏幕右为正、`sy` 屏幕前为正）：

```
moveX = sx·cos(θ) − sy·sin(θ)
moveZ = −sx·sin(θ) − sy·cos(θ)
Input.yaw = cameraYawToSimYaw(θ)      // lookMode='locked'（缺省）；'free' 见 §8/§14-34——
                                      // v4.2 此行曾误写「= θ」（相机角），实现从来是
                                      // 换算后的 sim 角（§14-15 锁定），v4.3 按实现更正
```

## 3. `src/data`（Fable-3 所有）

汇总出口 `src/data/index.js`；sim 静态 import 它（ADR-19）。

```ts
// gloves.js（运行时权威表）
export const GLOVES: GloveDef[];                       // 8 只，顺序即图鉴顺序
export const GLOVE_BY_ID: Record<GloveId, GloveDef>;
export const MATCH: MatchConst;
export function isGloveUnlocked(gloveId: GloveId, progress?: Record<string, number>): boolean;
// unlock === 'default' 恒 true（cotton）；未知 gloveId 恒 false；
// 否则查 UNLOCK_BY_GLOVE[gloveId]，progress[unlock.id] >= unlock.count 才 true。
// progress 缺省 {} ⇒ 除 default 外全锁。契约测 tests/glove-data.test.js 以此为准。

interface GloveDef {
  id: GloveId; name: string;        // 中文名（木棉/磐石/…）
  role: string; desc: string;       // 职能一词 + 一句话说明（UI 用）
  color: string;                    // 识别色 hex，全局唯一饱和点
  slapRange: number; slapAngleDeg: number;
  slapPower: number;                // 水平击退冲量基准（m/s）
  slapCooldown: number; windup: number; recovery: number;   // 秒
  moveSpeedMul: number;             // 持掌移速倍率
  skillId: SkillDataId | 'none';    // 'none' = 无主动技（cotton）。哨兵字符串、禁 null——
                                    // 契约测试要求全字段非空；与 combat 的翻译见 §3.1
  skillCooldown: number;
  unlock: 'default' | string;       // 字符串 = unlocks.js 的挑战 id（R1 的对象形式已废除）
  awakenModifiers: {                // 觉醒 8s 覆盖，applyAwaken 消费
    slapPowerMul: number; slapRangeMul: number; slapCooldownMul: number;
    special: string; params?: Record<string, number>;
  };
  vfx?: {                           // 手感轮新增（可选，纯数据调参）：颜色/粒子数/半径/时长等，
    slap?: Record<string, number|string>;    // O2 消费；缺省时 O2 用内建参数。
    skill?: Record<string, number|string>;   // 注意：VFX 分派键永远是事件上的 gloveId/skillId
    hit?: Record<string, number|string>;     //（ADR-27），本字段只调参、不参与分派。
  };
}

interface MatchConst {
  dt: number;                       // 1/60
  arenaRadius: 20; playerRadius: 0.7; playerHeight: 2;
  fallY: -8; respawnDelay: 1.2; invulnTime: 1.0;
  matchSeconds: 240; killsToWin: 7;
  switchLock: 0.4; awakenDuration: 8;
}

// 其余表（同为只读；消费方注明）
export const SKILLS, SKILL_IDS;                  // skills.js —— 数据 id 词表（§3.1 左列）的详参
export const BOT_PERSONAS, BOT_PERSONA_BY_ID;    // bots.js —— ai 消费；手感轮起每个 persona 必带
                                                 // skinId: SkinId（三人互异，main 传给 createMatch）
export const UNLOCKS, UNLOCK_BY_ID, UNLOCK_BY_GLOVE;  // unlocks.js —— shell/main 消费
export const MOVEMENT, KNOCKBACK, METER, RULES;  // tuning.js —— 参考值；运动手感的运行时权威是 sim.PHYSICS
export const TILE;                               // tiles.js —— 仅伤害调参语义；拓扑字段不具约束力（ADR-18）

// skins.js（手感轮新增，F3 所有；shell/render/main 消费，sim 不 import）
export const SKINS: SkinDef[];                   // ≥ 6 套，顺序即大厅选择器顺序
export const SKIN_BY_ID: Record<SkinId, SkinDef>;
export const DEFAULT_SKIN_ID: SkinId;            // 'drifter'
export function resolveSkin(id?: string|null): SkinDef;   // 未知/缺省 → SKIN_BY_ID[DEFAULT_SKIN_ID]
export const HUB;                                // hub.js —— 安全区大厅布局（§3.3，ADR-30）
// SKILL_COMBAT_ALIASES（skills.js）是 §3.1 别名表的 R2 过渡副本，R3 删除（ADR-23）
```

### 3.1 技能 id 别名表（冻结，ADR-23）

数据 id（`GloveDef.skillId`、图鉴、GDD 的公共词表）与 combat handler id（`src/combat/skills.js` 的分派键）是两套词表，之间**只有这一张翻译表**——运行时唯一翻译点是 `src/sim/combat-bridge.js` 的 `SKILL_ALIAS` / `combatSkillId()`：

| 掌 | 数据 id（公共词表） | handler id（combat 分派 / 线上 skillId） |
| --- | --- | --- |
| cotton 木棉 | `none`（哨兵，无主动技） | `none`（觉醒三段被动链） |
| granite 磐石 | `quake_slam` | `groundPound` |
| gale 疾风 | `wind_rush` | `dashSlap` |
| frost 冰霜 | `frost_arc` | `frostArc` |
| spring 弹簧 | `coil_counter` | `parry` |
| afterimage 分身 | `phantom_swap` | `blinkSwap` |
| magnet 磁掌 | `iron_pull` | `magnetPull` |
| meteor 陨掌 | `sky_fall` | `meteorSlam` |

规则：

1. `combatSkillId(id)`：falsy → `'none'`，命中 `SKILL_ALIAS` 取右列，否则原样透传。桥在 `resolveSlap/resolveSkill/applyAwaken` 的入参掌与 `syncGloveTable`（combat 内部掌表）上统一翻译，别处不得再各自换算。
2. **线上（`skill` 事件与 `HitRecord`）的 `skillId` 是 handler id**（右列，桥返回值优先）。消费方按技能分派表现（VFX / 音效 / 播报）时对右列词表编程。
3. 重复副本一律删除（R3 必改）：`data/skills.js` 的 `SKILL_COMBAT_ALIASES`（F3）、`core/modules.js` 的 `SKILL_ALIASES / alignSkillIds`（O4）。`combat/skills.js` 内部的宽容归一化（旧别名仍可命中）是防御性细节，不具规范地位、不得新增依赖。
4. 新掌 / 新技能 = 先在本表登记一行，再写代码。

### 3.2 皮肤契约（手感轮新增，冻结，ADR-26）

`src/data/skins.js`（F3 所有）。皮肤 = **剪影（体型+头部+背部配件）× 配色**的纯数据组合：O2 对每个枚举值各实现一次几何/材质件，F3 填组合表，两边不看对方代码即可并行。

```ts
interface SkinDef {
  id: SkinId;
  name: string;                       // 中文名（≤3 字，大厅主标题）
  desc: string;                       // 一句话（≤18 字，大厅副标题）
  build: 'slim'|'stock'|'broad';      // 体型档：O2 映射为躯干/四肢比例与肩宽
  headgear: 'hood'|'bare'|'topknot'|'strawHat'|'mask'|'horns';   // 头部剪影件
  back: 'panel'|'banner'|'pack';      // 背部识别色载体的形状（语义见下）
  palette: {                          // hex；只配衣料底色，饱和识别色仍归手套
    cloth: string; clothDim: string; leather: string; accent: string; skin: string;
  };
  trim?: Record<string, number|string>;   // 可选附加调参（F3/O2 协商，先登记再用）
}
```

**皮肤表 v1（id 词表冻结；name/palette 等终值由 F3 定稿）**：

| id | 中文名 | build | headgear | back | 定位 |
| --- | --- | --- | --- | --- | --- |
| `drifter` | 行脚 | stock | hood | panel | 缺省；现役造型的正名 |
| `mason` | 石契 | broad | bare | pack | 宽肩工匠 |
| `crane` | 鹤羽 | slim | topknot | banner | 瘦高背旗 |
| `reed` | 苇笠 | stock | strawHat | panel | 斗笠蓑客 |
| `nuo` | 傩面 | slim | mask | banner | 傩戏面客（原创民俗，无版权素材） |
| `wildhorn` | 荒角 | broad | horns | pack | 兽角蛮客 |

规则：

1. **识别色载体不可少**：每套皮肤的 `back` 件（背板/背旗/行囊盖布）必须承载**当前激活掌识别色**——换掌可读性是视觉契约（VISUAL_HANDBOOK §5.11），皮肤只能换载体形状，不能取消它。
2. **兜底链**（消费端统一）：`resolveSkin(p.skinId ?? BOT_PERSONA_BY_ID[p.persona]?.skinId)`，未知/缺省一律落 `DEFAULT_SKIN_ID`。sim 不参与校验。
3. Bot 皮肤：`BOT_PERSONAS` 每个 persona 带 `skinId`（建议 brute→`wildhorn`、fox→`crane`、bully→`nuo`，终值 F3 定），三人互异且不与 `DEFAULT_SKIN_ID` 相同——**Bot 不得全员同一造型**。
4. 新皮肤 / 新枚举值（headgear、back、build 扩档）= 先在本表登记，再写代码。禁止贴图包、禁止下载素材，全部低面数几何 + 程序化材质。
5. 枚举值的视觉终稿归 F2/O2（`docs/ART_DIRECTION.md` 补规范），本表只冻结 id 与形状语言的语义。
6. **渲染通路（v4.2 按实现登记）**：真表经壳层喂给 `createRenderer(canvas, { data, skins })`（`skins` = `resolveSkins`/`skinTable` 过的表，优先于 `data`，见 §7）；render 侧 `resolveSkinLook` 先过 `core/skins.js` 的 **`skinAppearance()`** 把真表（枚举）与兜底表（比例数值）归一成同一份外观模型。契约枚举 → 渲染配件的映射**冻结**（`render/skins.js accessoryFromAppearance`）：`hood/horns/mask` → 同名件；`back:'banner'` → `banner`；`back:'pack'` → `sash`（斜带 + 垂尾顶出行囊轮廓）；`topknot/strawHat` → `turban`。表外 id 走 `EXTRA_LOOKS` → 字符串散列两级**纯函数**兜底（同 id 恒同形），绝不退回统一胶囊。
### 3.3 `HUB` 安全区大厅布局表（HUB-R1，Fable-3；`src/data/hub.js`，ADR-30；v4.1 按实现名收口）

大厅布局是**数据不是代码**（ADR-26）：具体数值归 F3，本节只冻结形状与硬约束。接线实况：`src/data/index.js` 汇总导出 `HUB`，装配层（`core/modules.js wireSimDeps → sim.installData`，deps 真身识别不翻假标志）或测试的 `installHubLayout` 把它交给 sim；数据表缺席时 sim 用 `sim/hub.js DEFAULT_HUB_LAYOUT`（同形状同坐标）兜底，`getDeps().usingDataHub` 报真源。`createMatch` 时经 `normalizeHubLayout` 补全并快照进 `state.hub.layout`；render/ui 从 `view.hub` 读，**禁止任何模块硬编码第二份坐标**。

```ts
export const HUB: HubLayout;

interface HubLayout {                   // sim normalizeHubLayout 后的消费形状
  id: string; source: string;           // 布局来源标记（'data' | 'sim-default'）
  origin: { x: number; y: number; z: number };    // 安全区参考原点（走道中心，z ≈ -120）
  floorY: number;                       // 大厅地面高度（y）
  spawn: { x: number; y: number; z: number; yaw: number };  // p0 出生点，yaw=0 面向门（-Z）
  walkway: { halfWidth: number; minZ: number; maxZ: number };
                                        // 可走范围（隐形墙），sim 硬钳制（安全区走不出去、掉不下去）
  zone: { halfWidth: number; minZ: number; maxZ: number; minY: number; maxY: number };
                                        // 「算不算在安全区里」的判定体积（比走道宽一圈 + 竖直范围）；
                                        // 免战/免掉落按实体是否在 zone 内生效，见 §4.4
  interactRadius: number;               // 靠近交互半径，1.6..2.2
  portal: {
    x: number; y: number; z: number;    // 门中心
    radius: number;                     // ⑤ 传送触发 = 圆形半径（sim 唯一读取的触发字段）
    yaw?: number;                       // 门面朝向（渲染/说明牌用，sim 不读）
    aabb?: { minX: number; maxX: number; minZ: number; maxZ: number };
                                        // 兼容字段：radius 的外切矩形，数据表可给，sim 不读
  };
  pedestalRadius: number;               // 台座实体碰撞半径（走不过去）
  pedestalHeight: number;               // 座体净高
  pedestals: HubPedestal[];             // 恰好 8 条，走道两侧各 4 座
}
interface HubPedestal {
  gloveId: GloveId;                     // 8 只掌一一对应，gloveId 全表唯一
  x: number; z: number; yaw: number;    // 台座位置与展掌朝向（yaw 遵守 ADR-17）
  y?: number;                           // 展掌悬浮高度，缺省 floorY（F3 实表给 floorY+台座高+0.4）
  row?: 'left'|'right'; index?: number; // 排位标记（render 按排布光用，缺省由 x 推导）
}
```

数据表可以额外携带 `bounds`（= walkway 的 minX/maxX 写法）等派生副本供文档/验收对照，sim 的 `normalizeHubLayout` 只认上表字段——**触发判定的唯一事实源是 `portal.radius` 圆与 `walkway` 钳制**。

硬约束（F4 验收 / G1 契约测引用）：

1. `pedestals.length === 8`，`gloveId` 覆盖全部 8 只掌且不重复；顺序 = `GLOVES` 图鉴顺序。
2. `interactRadius ∈ [1.6, 2.2]`；相邻台座间距 > `2 × interactRadius`（聚焦无歧义）。
3. 大厅全部几何（zone ∪ 门触发圆 ∪ 各台座）与裂岛圆盘（半径 20 + 2m 缓冲）**不重叠**——O2 双场景同世界摆放不穿帮。走道沿 -Z 推进：spawn 在 +Z 端、门在 -Z 端，与 yaw=0 → -Z 同向（开局镜头即面向走道纵深）。
4. `spawn`、全部台座、门触发圆都在 `walkway` 内；门触发圆不与任何台座的交互半径相交。

## 4. `src/sim`（Opus-1 所有；入口 `src/sim/index.js`）

### 4.0 依赖接线（ADR-19/24，冻结）

`src/sim/deps.js` **静态 import** `../data/gloves.js`（运行时权威掌表）与 `./combat-bridge.js`（其内静态 import `../combat/index.js`）——生产路径零动态注入，**import sim 即已接线**。大厅布局是唯一例外：sim 不静态 import `data/hub.js`（防 data 侧缺席拖垮 sim），内置 `DEFAULT_HUB_LAYOUT` 兜底，装配层 `wireSimDeps → installData(dataModule)`（或 `installHubLayout(HUB)`）把 F3 真表装进来——deps 的真身识别对携带 `HUB` 的真实 data 模块**不翻假标志**，`usingDataHub` 单独报布局真源。`getDeps()` 返回 `{ MATCH, GLOVES, GLOVE_BY_ID, HUB, combat, usingRealData, usingRealCombat, usingDataHub }`：

- **`usingRealCombat === true ⇔ 未装替身（combatMod === null）⇔ 生产静态桥在岗**。`installCombat(mod)` 传任何非 null 模块都置 false——即使传真实 `src/combat` 命名空间，因为绕过桥（朝向换算、命中翻译、事件消化）就不是产线路径（ADR-24）。**false 读作「测试替身在场」，不是「combat 缺席」**。
- `usingRealData` 同理（仅当替身给出非空 `GLOVES` 才为 false）。`installData` 会经 `normalizeGlove` 用真实 cotton 补全替身缺字段，防 sim 吃 NaN。替身可携 `HUB` 覆盖布局（测试用），缺席回落真实表。
- `installData / installCombat / resetDeps` 仅供测试隔离；`resetDeps()` 回到真实模块。用过 install* 的测试必须收尾 `resetDeps()`。
- 产线与探针的断言姿势：**什么都不装**，直接断言两布尔为 true；为假 = 替身泄漏，main 亮降级横幅。`autoWireOptionalDeps` 已删除。
- deps 每次 rebuild 会调 `bridge.syncGloveTable(GLOVE_BY_ID)`：combat 内部延迟结算路径与 sim 共用同一张掌表（技能 id 已按 §3.1 翻译）。

### 4.1 契约四件套 + 附属导出

```ts
export function createMatch(opts: {
  seed: number;
  gloveId?: GloveId|null; offhandId?: GloveId|null;
                                            // 人类主/副掌；非法/缺省回落 cotton（副掌回落首个异掌）。
                                            // hub 开局下传**有效** gloveId = 主掌「已选」：
                                            // hub.mainGloveId 直接落位、portalReady 即 true（存档配装
                                            // 带进走道当初始装）。要走「先选掌才开门」的产品流程，
                                            // 传 null / 不传（main.startMatch 实况，见 §4.4）。
  botCount?: number;                         // 默认 3
  botPersonas?: Persona[];                   // 默认 brute→fox→bully 循环
  skinId?: string;                           // 手感轮新增：人类皮肤。sim 视为不透明字符串原样存取，
                                             // 不校验、不 import skins.js（ADR-26/34）；缺省存 null
  botSkinIds?: (string|null)[];              // 手感轮新增：与 bot 序号对齐（b0 取 [0]…）。
                                             // 编排层从 BOT_PERSONA_BY_ID[persona].skinId 取值传入
  config?: Partial<MatchConst>;              // 测试用覆盖（config.skipHub 也认，见 phase）
  phase?: 'hub'|'arena';                     // ① 开局在哪。**缺省 'hub'（开局在安全区）**——这是产品
                                             // 路径，HR-01 红线；旧测/旧探针要直接进岛显式传 'arena'。
  skipHub?: boolean;                         // ① 等价于 phase:'arena' 的旧路便捷位；config.skipHub 同义。
                                             // 优先级：opts.phase > opts.skipHub > config.skipHub > 'hub'
  unlocked?: GloveId[] | Set<GloveId> | Record<GloveId, boolean> | 'all';
                                             // ① hub 装备许可集（别名 unlockedGloves 也认）。缺省
                                             // fail-closed：unlock==='default' 的掌 + 调用方明确传入的
                                             // gloveId/offhandId；空集回落表首掌；未知 id 忽略；
                                             // 'all' 全解锁（测试/探针用）。sim 不读存档，shell 用
                                             // data.isGloveUnlocked + 存档换算后传入。
  // 死名（v4 曾登记、从未实装，禁止使用）：startPhase、unlockedGloveIds。
}): MatchState;

export function step(state: MatchState, inputs: Partial<Record<PlayerId, Partial<Input>>>, dt: number): MatchState;
// 就地更新并返回同一引用。dt 缺省/非法用 config.dt；> 1/60 自动切等长子步；上限 0.25。
// 顺序（冻结）：清 events（每 step 一次，子步共用缓冲）→ 每子步：combat.tickStatuses（含
// 延迟命中回执）→ 计时器/重生 → 动作（换掌/冲刺/跳/扇击前摇/技能）→ 位移积分 → 互推
// → 地面/护栏 → 前摇到帧的扇击结算 → 掉落 ko（y<fallY 或出盘无支撑）→ updateMatch。

export function getView(state: MatchState): MatchView;   // §4.3

export function isMatchOver(state: MatchState): { over: boolean; winnerId?: PlayerId|null; reason?: 'kills'|'time' };
```

**`isMatchOver` 语义（ADR-20，冻结；HUB-R1 计时域 = 传送重置，v4.1 按实现改写）**：

- **纯读的活谓词，不要求先 `step`**。调用不改 state、不发事件；**不看 phase**。
- `over ⇔ state.match.over ∨ ∃p: p.kills ≥ config.killsToWin ∨ (state.time − match.startTime) ≥ config.matchSeconds`。
  计时锚是 **`state.match.startTime`**（createMatch 时 0）；「挑掌不吃对局时长」由**传送重置**实现：
  `enterArena` 把 `startTime = state.time`、`secondsLeft` 回满、`over/winnerId/reason` 清空——
  不是在 hub 冻结时钟。`phase:'arena'` 开局时 `startTime = 0`，与 v3 语义逐位一致。
  推论：在 hub 里逗留超过 `matchSeconds`，`isMatchOver` 也会给 `over:true`（有测锁定此行为）——
  **壳层在 hub 阶段不消费 over**（main 实况：`over ∧ phase !== 'hub'` 才进结算），穿门即重置。
  调用方直接改 `player.kills`（如契约测试）后**立即**得到 `over: true`。
- `winnerId/reason`：已缓存则回缓存；否则杀数达标 ⇒ 该玩家（按 players 序取先者）+ `'kills'`；时间到 ⇒ 杀数最多者（平杀比死数少、再平按 players 序）+ `'time'`。本版无 `'draw'`。
- `step` 内的 `updateMatch` 仍负责把结果写入 `state.match` 并发 `matchOver` 事件——**事件与缓存需要 step，布尔真值不需要**。`isMatchOver` 与 `updateMatch` 共用 `decideMatch(state)`（现算、不写 state），保证「直接改 kills 再问」与「跑满 step」两条路答案一致。

附属导出（现有名单冻结，不得删除；节选常用面）：

```ts
export { installData, installCombat, installHubLayout, resetDeps, getDeps, resolveGlove };
                                                     // 接线（install* 仅测试替身用）
export function getMatchConfig(): MatchConst;        // 生效中的 MATCH 副本（main 传 shell 用这份）
export function getGloves(): GloveDef[];             // 生效中的掌表副本
export function getHubLayout(): HubLayout;           // 生效中的大厅布局副本（data 表或内置默认）
export { enterArena, enterHub };                     // 传送 / 回程 API（②，见 §4.4；事件同名）
export { DEFAULT_HUB_LAYOUT, equipFromPedestal, hubSpawnFor, inHubZone,
         nearPortal, nearestPedestal, playerInHub, setHubUnlocked };   // hub 判定/装备原语
export function damageTileAt(state, x: number, z: number, amount: number): { tile, broken } | null;
                                                     // 台面伤害唯一入口：发事件、计 stats
export function hasFloorUnder(state, x: number, z: number): boolean;
export const ZERO_INPUT: Input;                      // 不含 interact（Bot 键集基准）
export const HUB_ZERO_INPUT: Input;                  // = ZERO_INPUT + { interact:false, interactSlot:null }；
                                                     // hub 测试/壳层基准，禁止把 interact 并进 ZERO_INPUT
export function applyHits(state, attacker, hits: HitRecord[], source: 'slap'|'skill'): number;
export { getPlayer, activeGlove, activeGloveId, respawnPlayer };
export { forwardX, forwardZ, rightX, rightZ, yawFromDir, wrapAngle, FACE };
                                                     // ADR-17 约定的朝向 helper，测试必用；
                                                     // FACE.combatOffset = π 是桥的换算相位差
export { PHYSICS, ARENA, SIM_VERSION };              // sim 自有物理/台面常量（不由 data 覆盖）
export { applyKnockback, statusMods, isSupported, tileAt, crackOf };
export { decideMatch, leaderOf };                    // isMatchOver / updateMatch 共用的判据
export { createRngState, nextFloat, nextRange, nextU32 };
// combat 同名转发：resolveSlap / resolveSkill / tickStatuses / applyAwaken
// （经 getDeps().combat，即 §5 的生产桥）
```

### 4.2 MatchState（冻结字段；O1 可加内部字段，需登记）

```ts
interface MatchState {
  version: 1; seed: number;
  rng: { a: number; b: number; c: number; d: number };   // sfc32，纯整数
  time: number; tick: number;
  t: number;                          // 已登记内部字段：combat 读的时钟别名，与 time 同步（桥维护）
  playerRadius: number;               // 已登记内部字段：combat 扇形判定读的平铺副本（= config.playerRadius）
  config: MatchConst;                 // createMatch 时快照（含 opts.config 覆盖）
  phase: 'hub'|'arena';               // 双区状态机（ADR-29）。step 内传送单向 hub → arena；
                                      // 回程走 enterHub API（壳层调用，不在 step 内自动发生）
  hub: HubState;                      // 大厅簿记（两个 phase 下都存在）
  arena: ArenaState;
  combat: { clock: number; pending: unknown[]; dashes: unknown[]; ghosts: unknown[]; seq: number };
                                      // 已登记内部字段：combat 状态机台账（O3 写、桥翻译；
                                      // ghosts 经桥 ghostsView 出 view，ADR-27/34）
  players: PlayerState[];             // [0] 恒为 p0
  events: SimEvent[];                 // 本 step 产生，开头清空，≤ 96 条
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null;
           startTime: number;         // 对局计时锚：createMatch 时 0，enterArena 时重置（§4.1）
           secondsLeft: number };
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}

interface HubState {                  // HUB-R1；纯数据，随 state 一起 structuredClone。v4.1 按实现名收口（④）
  layout: HubLayout;                  // normalizeHubLayout(HUB) 的每局快照（§3.3），运行期只读
  unlocked: GloveId[];                // createMatch(opts.unlocked) 解析结果（fail-closed，§4.1）
  pedestals: {                        // 台座簿记（view 侧形状见 §4.3 HubPedestalView）
    gloveId: GloveId; x: number; y: number; z: number; yaw: number;
    row: 'left'|'right'; index: number;
    unlock: 'default'|string;         // 解锁条件 id（GloveDef.unlock 透传，hubLocked 事件携带）
    unlocked: boolean;
    selected: 'main'|'off'|null;      // 已确认落位的槽
  }[];
  mainGloveId: GloveId|null;          // 在走道确认过的主掌；null = 还没挑（portalReady 的判据）。
                                      // 死名：mainChosen/offChosen（v4，从未实装）
  offGloveId: GloveId|null;
  focusGloveId: GloveId|null;         // 当前聚焦展掌（interactRadius 内最近；arena 阶段恒 null）
  portalReady: boolean;               // ⇔ !!mainGloveId（syncSelection 维护）
  portalNear: boolean;                // 有真人站在门触发圆内（§4.4）。死名：nearPortal（v4）
  enteredArenaAt: number|null;        // 传送发生时的 state.time；hub 中/『arena 直开』⇒ null
}

interface PlayerState {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  skinId: string|null;                                    // 手感轮新增：不透明装饰标签（ADR-26）
  spawnSlot: number; spawnAngle: number;
  x: number; y: number; z: number; yaw: number;          // yaw 按 ADR-17 约定
  vx: number; vy: number; vz: number;
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1; switchLockT: number;
  meter: number; awakenedT: number;
  statuses: { id: string; t: number; mag?: number; src?: PlayerId|null }[];
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number; streak: number; bestStreak: number;
  grounded: boolean; coyoteT: number; jumpHeld: boolean;
  dashT: number; dashCd: number; dashDirX: number; dashDirZ: number;
  slapCd: number; skillCd: number;                       // 玩家级标量，双掌共享（ADR-8 已废除）
  attack: { phase: 'idle'|'windup'|'strike'|'recovery'; t: number; gloveId: GloveId; struck: boolean };
  combo: number; comboT: number;
  knockScale: number; kbT: number;                       // kbT>0 = 击退失控窗口（重击穿栏）
  lastHitBy: PlayerId|null; lastHitT: number;            // 击杀归属窗口 = PHYSICS.killCreditWindow (5s)
  hitsDealt: number; hitsTaken: number;
  prev: { slap; skill; switchGlove; dash; jump; interact: boolean };  // sim 内部边沿检测
                                                            // （interact 为 HUB-R1 新增位）
}

interface ArenaState {                // 方格拓扑（ADR-18）
  radius: number; tileSize: number;   // 20 / 2.5
  cols: number; origin: number;       // grid 方阵参数；几何由此推导
  grid: number[];                     // iz*cols+ix → tiles 下标；-1 = 盘外
  tiles: TileState[];                 // ~208 块
  brokenCount: number; floorY: number;
}
interface TileState {
  i: number; ix: number; iz: number;  // 下标与格坐标
  x: number; z: number;               // 块中心（世界系）
  zone: 0|1|2|3;                      // 象限
  seam: boolean;                      // 中缝带（|x| < 1.9），HP 更低
  hp: number; maxHp: number; alive: boolean;
}
```

### 4.3 MatchView（`getView` 返回；渲染/AI/HUD 唯一输入）

```ts
interface MatchView {
  version: number; seed: number;
  time: number; tick: number;
  config: Pick<MatchConst, 'dt'|'arenaRadius'|'playerRadius'|'playerHeight'|'fallY'|
    'respawnDelay'|'invulnTime'|'matchSeconds'|'killsToWin'|'switchLock'|'awakenDuration'>;
  phase: 'hub'|'arena';               // HUB-R1 新增；渲染/HUD/AI 的分区开关
  hub: HubView | null;                // HUB-R1 新增；真实 sim 恒为对象（两个 phase 下都给，
                                      // 几何静态、体积小）；null 仅允许出现在降级件，消费方须容错
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null; secondsLeft: number };
                                      // hub 阶段 secondsLeft 也走表（自 startTime=0），壳层不消费；
                                      // 穿门重置回满（§4.1 计时域 = 传送重置）
  arena: {
    radius: number; tileSize: number; cols: number; origin: number;
    floorY: number; brokenCount: number;
    tiles: ViewTile[];
  };
  players: ViewPlayer[];
  combat: { ghosts: ViewGhost[] };     // 手感轮新增（ADR-27）：分身残影，render 必画。
                                       // 名字冻结于 ADR-34：`combat.ghosts` 与 `players[].skinId`
                                       // 是 O1 Round 2 的导出面，恒存在、JSON-safe（无残影 = 空数组）
  events: SimEvent[];
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}
interface ViewGhost {                  // 来源 state.combat.ghosts，经 combat-bridge.ghostsView
  id: string; ownerId: PlayerId;       // 翻译导出：yaw 已还原为 -Z 约定（ADR-17/25）、纯 JSON
  x: number; y: number; z: number; yaw: number;
  ttl: number; ttl0: number;           // 剩余/初始秒；render 用 ttl/ttl0 做淡出（O3 建 ghost 时写 ttl0）
  fake: boolean;                       // true = 觉醒残影，会假挥掌（ghostSlap 事件）
}
interface HubView {                    // HUB-R1（ADR-30/31）；v4.1 按实现名收口（④⑤）
  layoutId: string; source: string;    // 布局来源（'data' | 'sim-default'，见 §3.3）
  origin: { x: number; y: number; z: number };
  floorY: number;
  spawn: { x: number; y: number; z: number; yaw: number };
  walkway: { halfWidth: number; minZ: number; maxZ: number };   // 隐形墙（sim 钳制同一份数据）
  zone: { halfWidth: number; minZ: number; maxZ: number; minY: number; maxY: number };
  portal: { x: number; y: number; z: number; radius: number;    // ⑤ 圆形触发（无 aabb 字段）
            ready: boolean; near: boolean };                    // = portalReady / portalNear 的就地副本
  interactRadius: number;
  pedestalRadius: number; pedestalHeight: number;
  focusGloveId: GloveId|null;          // 聚焦展掌；HUD 说明牌与 render 高亮的唯一依据
  portalReady: boolean;                // ⇔ !!mainGloveId；门可用
  portalNear: boolean;                 // 有真人在门触发圆内（§4.4）。死名：nearPortal
  mainGloveId: GloveId|null;           // 走道确认的主/副掌。死名：mainChosen/offChosen
  offGloveId: GloveId|null;
  unlocked: GloveId[];                 // 装备许可集副本
  pedestals: HubPedestalView[];        // 真表下恒 8 条，GLOVES 图鉴顺序
}
interface HubPedestalView {
  gloveId: GloveId;
  x: number; y: number; z: number; yaw: number;   // y = 展掌悬浮中心（F3 表值）
  row: 'left'|'right'; index: number;
  height: number;                      // = layout.pedestalHeight（座体净高）
  radius: number;                      // = layout.interactRadius（交互圈，render 画提示圈用）
  unlock: 'default'|string;            // 解锁条件 id（说明牌文案经 UNLOCK_BY_GLOVE 查）
  unlocked: boolean;                   // 装备许可（opts.unlocked 注入的结果）
  selected: boolean;                   // 是否已落位（布尔）；具体哪个槽看 slot
  slot: 'main'|'off'|null;             // 已确认落位的槽
  focused: boolean;                    // === (gloveId === focusGloveId)
  name: string; color: string;         // getView 从掌表补挂：UI 不必再翻 data
  desc: string|null; role: string|null;
}
interface ViewTile {
  i: number; x: number; z: number; zone: 0|1|2|3; seam: boolean;
  hp: number; maxHp: number; alive: boolean;
  crack: number;                       // 0..1 裂纹程度；碎块恒 1
}
interface ViewPlayer {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  skinId: string|null;                 // 手感轮新增：原样透传，消费端 resolveSkin 兜底（§3.2）
  x: number; y: number; z: number; yaw: number;
  vx: number; vy: number; vz: number; speed: number;
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1;
  activeGloveId: GloveId; gloveName: string; gloveColor: string;   // HUD/render 直用
  switchLockT: number;
  meter: number; awakenedT: number; awakened: boolean;
  statuses: { id: string; kind: string; t: number; mag: number|null }[];   // kind === id，双词兼容
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number; streak: number;
  grounded: boolean; dashT: number; dashCd: number;
  slapCd: number; skillCd: number;
  attackPhase: PlayerState['attack']['phase']; attackT: number;
  combo: number; knockScale: number;
}
// 编排层用 core/interp.js lerpView(prev, cur, alpha) 产出插值快照后再交 renderer（ADR-12 修订）。
// HUB-R1：prev.phase !== cur.phase（传送帧）⇒ lerpView 整帧跳插值直接返回 cur（ADR-31）。
```

### 4.4 双区与大厅交互语义（HUB-R1，ADR-29/30/31；v4.1 按实现收口，冻结）

**规则按「实体所处空间」生效，不是全局开关**：`playerInHub(state, p) ⇔ phase === 'hub' ∧ p 在 `layout.zone` 体积内`。把人摆在裂岛坐标上的旧测不受 phase 影响，照走裂岛规则。

**安全区四禁（对 hub 内实体的行为面）**：

1. **免战**：命中落账处豁免——`applyHits` 对 hub 内目标把 combat 已写入的冲量**退回**、跳过 `lastHitBy/hitsTaken/kbT` 记账、不发 `hit` 事件；无掉落 KO ⇒ 无 meter 击杀奖励。注意 `combat.tickStatuses` 每子步照跑（状态倒计时是全局一份），豁免在落账处不在管线口。**空挥闸（ADR-33，Round 2 O1 落地）**：闸门是 **`playerInHub(state, p)`（空间，不是 phase 全局）**——站在安全区体积里才拦扇击前摇 / `resolveSkill` / 战斗冲刺；`phase==='hub'` 但人被测具摆在裂岛盘上时仍可打。拦下则不发 `slapStart/slap/skill/dash`、`stats.slaps` 不涨。走、看、跳、换掌、interact 不受影响。
2. **无掉落**：hub 内支撑不查 `arena` 台面，走 `resolveHubGround`——实心地板（`floorY`）+ `walkway` 隐形墙硬钳制（贴墙滑动，不反弹）+ 台座柱体（`pedestalRadius` 实体，走不过去）；`fallY` 与出盘 ko 判定跳过。移动/跳/Shift 位移冲刺照常（手感与 arena 一致）。
3. **Bot 静默**：`createMatch` 时 Bot 全部落裂岛站位（安全区不放 Bot）。编排层 hub 阶段不调 `ai.think`（ADR-32）；`think` 见 hub 视图自返零输入（双保险）。
4. **计时域 = 传送重置**（§4.1）：`secondsLeft` 在 hub 也走表（自 `startTime = 0`），但壳层在 hub 阶段不消费 `over`、HUD 不展示对局倒计时；穿门时 `startTime/secondsLeft/over` 整体重置，「挑掌不吃对局时长」由此保证。

**聚焦（focus）**：每子步计算 `focusGloveId` = 与 p0 的 **xz 距离 ≤ `interactRadius`** 的最近台座（`nearestPedestal`）；并列取 `pedestals` 表序靠前者；半径内无台座 ⇒ `null`；`phase === 'arena'` ⇒ 恒 `null`。聚焦**变为非空/换座**时发 `hubFocus { gloveId }` 事件（回落 null 不发事件——消费方读 view diff）。`portalNear` ⇔ 有 hub 内真人 xz 距门中心 ≤ `portal.radius`（**提示区 = 触发圆本身**，不外扩、不加新调参项）；进圆沿发一次 `hubPortalNear { id, ready }`。

**`interact` 上升沿的装备结算**（仅 hub；对象 = 交互半径内最近台座，无 ⇒ no-op；`input.interactSlot: 'main'|'off'` 可直接指定槽位——触控 UI 的两个槽位按钮）：

| 前置状态（自上而下取首条命中） | 结果 | 事件 |
| --- | --- | --- |
| 台座未解锁（`unlocked === false`） | 拒绝，配装逐字段不变 | `hubLocked { gloveId, unlock }`（③；`unlock` = 解锁条件 id） |
| 该掌已是主掌 | no-op（HUD 显示「已装备」） | `hubEquip { slot:'main', changed:false }`（回执，不改配装） |
| 主槽空（`mainGloveId === null`） | 写主槽 ⇒ `portalReady` | `hubEquip { slot:'main', changed:true, mainGloveId, offGloveId }` |
| 该掌已是副掌，再按一次 | **提为主掌**，原主掌顺位退到副槽（⑥，UX 优于 no-op） | `hubEquip { slot:'main', changed:true, … }` |
| 副槽空 | 写副槽 | `hubEquip { slot:'off', changed:true, … }` |
| 双槽已满 | 替换副槽（主掌不被覆盖） | `hubEquip { slot:'off', changed:true, … }` |

装备成功即写回玩家（`applyLoadout`）：`gloveId/offhandId` 更新、副掌未选时 `offhandId = mainGloveId`（不让人白捡没选过的掌）、`activeSlot = 0`。指定 `interactSlot:'off'` 时：该掌已是副掌 ⇒ `changed:false` 回执；已是主掌 ⇒ 静默 no-op（同一只掌不占两格）。

**hub 内 `switchGlove`**（v4.2 按实现改写；`sim/hub.js swapHubLoadout`，`sim/hub-actions.test.js` 锁定）：闸门同空挥闸走 `playerInHub`（空间不是 phase）——安全区内 `switchGlove` 上升沿 = **主副槽交换**：`gloveId ↔ offhandId`、`activeSlot` 归 0、**无 switchLock 代价**（连按连换；长按仍不连发），复用既有 `switch` 事件（`slot: 0`、`gloveId` = 交换后的主掌）。`hub.mainGloveId/offGloveId` 仅在两格都已挑过时随行交换（只挑了主掌时副掌与主掌同值，交换恒等，传送门不失效）。裂岛坐标上（含 `phase==='hub'` 的旧测摆位）维持 arena 语义：`activeSlot` 切换 + `switchLock 0.4s`。v4.1 曾写「与 arena 完全同一套语义、交换从未实装」，与 Round 2 起的实现相反，本版更正。「装备新主掌」另有装备表第 4 行（副掌再按 interact 提主）。

**传送**：`portalReady ∧ 真人 xz 进入门触发圆（距门中心 ≤ portal.radius）` 的同一 tick 完成（⑤；sim 只读 radius，不读 aabb）——`enterArena(state, p)`：`phase = 'arena'`、该玩家走既有出生点链路（`spawnSlot → spawnPointFor → findSpawnSpot`，速度清零、`grounded = true`、朝台心）、`invulnT = max(invulnT, invulnTime)`、**loadout 原样保留**；`match.startTime = state.time`、`secondsLeft` 回满、`over/winnerId/reason` 清空；`hub.enteredArenaAt = state.time`、`focusGloveId = null`、`portalNear = false`；发 `enterArena { id, x, y, z }`（②，每个被传送真人一条；**不带 yaw**——朝向已写在玩家身上，壳层读 view 对齐相机）。未 ready 进圆不传送——「先选一只掌」提示由 HUD 从 `portalNear ∧ !portalReady` 状态读出（状态驱动）+ `hubPortalNear{ready:false}` 事件 toast。穿门即传送，无需 interact，键鼠触控同一路径。

**回程 `enterHub(state, player?)`**（②，壳层 API，R2 打磨 UX）：`phase = 'hub'`、真人放回 hub 出生点（多人横向错开）、复活并清状态/攻击相位/击退簿记，**配装保留**；发 `enterHub { id, x, y, z }`。`step` 内不自动回程——回程只由壳层显式调用。

**选掌预选与存档**：`createMatch(opts.gloveId)` 传有效值 = 主掌**已选**（`portalReady` 即 true，见 §4.1 ①——v4「预选不算已选」从未实装）；产品路径传 null 让门从「先选一只掌」起步。走道所选由 **O4 在传送帧写回存档**（main `rememberHubLoadout`：读 `view.hub.mainGloveId/offGloveId` → `updateSave({ loadout })`，存档 schema §12 不变）。

**确定性**：hub 全部判定（聚焦/装备/传送）是 state + inputs 的纯函数，不引入新随机数；`structuredClone` 与逐位复现契约（§1-2/§1-5）对 `phase/hub` 字段同样成立。

## 5. `src/combat`（Opus-3 所有）与生产桥 `src/sim/combat-bridge.js`（Opus-1 所有）

分工（冻结）：`src/combat/**` 自带一套内部约定（yaw=0 朝 +Z、命中 `{ id, … }` 且冲量已就地写进目标速度、事件直 push、自带 `cd/busyUntil` 台账）；**sim 只经生产桥调用 combat**，桥把内部约定翻译成本节契约，桥外不可见。**除桥（与 O3 自测）外任何文件不得 import `src/combat`**。

### 5.1 桥的翻译职责（冻结）

1. **朝向**：进 combat 前全体玩家 `yaw += FACE.combatOffset (π)`，返回时还原/换算回 -Z 约定（ADR-17 的唯一 combat 侧换算点）。
2. **闸门**：sim 独占动作闸门（`attack` 相位机、`slapCd/skillCd` 标量、`switchLockT`、`kbT`）。桥每次调用前清掉 combat 的 `cd/busyUntil`，combat **必须解算**、不得二次拦截 sim 已闸过的调用；combat 的 `beginSlap`/pending 前摇机制不进产线路径（sim 的 windup 相位机是唯一前摇实现）。
3. **命中**：combat 的 `{ id, impulse, … }` 翻译成 `{ targetId, attackerId, power, impulse, applied: true, skillId }`；`parried` 命中剔除（combat 已把冲量反打回攻击者，不再记一次受击）。
4. **事件（ADR-22）**：combat push 的事件先进桥的暂存缓冲，翻译成 §10 词表（`awaken / awakenEnd / parry / meteorImpact / ghostSlap`；`tileBreak` 顺带补 `brokenCount / stats` 记账）后由 sim 代发；其余暂存事件丢弃（sim 已发等价事件）。
5. **字段回写**：combat 自有字段同步到 sim 读的字段（`knockbackT → kbT`、`lastHitAt → lastHitT`）。
6. **技能 id**：入参掌与 combat 内部掌表（`syncGloveTable`）按 §3.1 翻译，桥是唯一翻译点。
7. **残影导出（手感轮新增，ADR-27）**：桥新增导出 `ghostsView(state): ViewGhost[]`——把 `state.combat.ghosts`（yaw 是 combat 的 +Z 基，因为 ghost 快照在 `inCombatFrame` 内落笔）逐条翻译成 §4.3 的 ViewGhost：`yaw` 按 `FACE.combatOffset` 还原回 -Z 并 wrap、数值 round、缺 `ttl0` 时以 `ttl` 兜底。`sim/view.js getView` 调它填 `view.combat.ghosts`——combat 基的朝向换算依旧只住在桥。
8. **代发事件补 id（手感轮新增，ADR-27）**：桥 `digestEvents` 代发的三个事件补齐分派键——`parry` 补 `gloveId`（弹反者结算时激活掌）与 `skillId: 'parry'`；`meteorImpact` 补 `gloveId: 'meteor'`、`skillId: 'meteorSlam'`；`ghostSlap` 补 `gloveId: 'afterimage'`、`skillId: 'blinkSwap'`。词表见 §10。

### 5.2 sim 面向的 combat 契约（桥的导出面 = `getDeps().combat`）

```ts
export function resolveSlap(state, attacker: PlayerState, glove: GloveDef, now: number): { hits: HitRecord[] };
// now = state.time。sim 在扇击前摇到帧（attack.phase === 'strike'）调用。

export function resolveSkill(state, attacker: PlayerState, glove: GloveDef, now: number): {
  ok: boolean; reason?: string;
  skillId?: SkillHandlerId;               // 线上词表 = handler id（§3.1）
  cooldown?: number;                      // 缺省用 glove.skillCooldown
  selfImpulse: { x: number; y: number; z: number } | null;
                                          // 生产桥恒为 null：施法者位移由 combat 状态机就地写速度；
                                          // sim 保留非 null 时的加冲量路径供测试替身用
  hits: HitRecord[];
};
// sim 在 skill 上升沿调用；ok:false 不进冷却。持续型技能由 tickStatuses 逐帧推进。

export function tickStatuses(state, dt: number): { hits: HitRecord[] };
// 就地递减/到期移除状态、掌意收支与衰减、满条觉醒、推进持续技能。
// 返回延迟结算命中（陨掌落地 / 疾风冲刺接触 / 残影假掌），每条必带 attackerId，
// sim 按 attackerId 逐条记账（v2「返回值 sim 忽略」已修订）。

export function applyAwaken(attacker: PlayerState, glove: GloveDef): GloveDef;
// awakenedT > 0 时按 glove.awakenModifiers 返回覆盖后的派生副本；否则原样返回。禁止改 GLOVES。

interface HitRecord {
  targetId: PlayerId;
  attackerId?: PlayerId | null;           // tickStatuses 的延迟命中必填
  applied: boolean;                       // true = combat 已就地写入目标速度，sim 只记账不重复推
  impulse: { x: number; y: number; z: number };
  power: number;                          // 水平冲量模长（事件/音效强度用）
  skillId?: SkillHandlerId | null;
  gloveId?: GloveId;                      // 手感轮新增（可选）：出招掌。延迟命中（陨掌落地等）时
                                          // 攻击者可能已换掌，combat 知道就填；sim 发 hit 事件时
                                          // 优先用它，缺省回落 attacker 当下 activeGloveId
  hitX?: number; hitZ?: number;
  tile?: { x: number; z: number; amount: number };      // 对地伤害，sim 转 damageTileAt
  statuses?: { id: string; t: number; mag?: number; src?: PlayerId|null }[];
}
// 生产桥常态只输出前六个字段（状态/碎地由 combat 就地结算、tileBreak 走事件消化）；
// 可选字段是 sim.applyHits 的能力面，测试替身可用。v2 的 kind 字段废除（applyHits 的
// source 参数替代）；behind 背身加成在 combat 内部结算，不出桥。
```

台面伤害一律走 sim 的 `damageTileAt(state, x, z, amount)` 或经 `HitRecord.tile` 由 sim 代转；combat 直改 `tile.alive` 的既有路径由桥的 `tileBreak` 消化补齐记账（`creditTileBreak`），**禁止再添第三条路**。

## 6. `src/ai`（Opus-3 所有；入口 `src/ai/bots.js`）

```ts
export function think(view: MatchView, botId: PlayerId, rng: () => number): Input;
// 纯函数 + 模块内 per-bot 记忆：只读 view（上一 tick 快照）与 rng（0..1，编排层提供，
// 不碰 state.rng）。每个模拟 tick 被调一次；实现必须与调用频率无关（内部自带计时）。
// 性格取 view 内该 bot 的 persona：brute 直线硬冲高频扇；fox 沿边绕走、卡碎裂边线；
// bully 优先残血/背身/刚落地目标。产出的 moveX/moveZ 为世界系、yaw 遵守 ADR-17。
// 编排层实际传入的是经 core/view.js adaptView 整形的超集快照（多 name/color/timeLeft
// 等字段，yaw 未动）；think 只依赖 §4.3 字段即可，不得依赖超集字段。
// HUB-R1（ADR-32）：view.phase === 'hub' ⇒ 立即返回零输入（不动、不出招）。这是防御性
// 双保险——产线编排层在 hub 阶段本就不调 think；缺 phase 字段但带 hub 数据的快照
// fail-safe 按 hub 休眠（isHubView），纯 arena 旧快照照常。
```

## 7. `src/render`（Opus-2 所有；three 仅存在于此目录）

模块级单例（ADR-1）：`createRenderer` 初始化并返回句柄，模块级 `sync/resize/setQuality/dispose` 操作该单例（main 经 `bindRenderer` 两种姿势都接受）。

```ts
export function createRenderer(canvas: HTMLCanvasElement, opts?: {
  tier?: Tier; pixelRatio?: number; width?: number; height?: number;
  seed?: number; arenaRadius?: number;
  localId?: PlayerId;      // 本地玩家，缺省 'p0'（ADR-16）；main 传 followId 亦须接受
  data?: object;           // v4.2 登记（已实装）：src/data 命名空间，带 SKINS 即用真表剪影
  skins?: object;          // v4.2 登记（已实装）：已 resolveSkins/skinTable 过的皮肤表，优先于 data
  [k: string]: unknown;    // 未知 opts 必须容忍
}): RendererHandle;

export function sync(view: MatchView): void;
// 每 rAF 一次，view 已由编排层插值。消费：view.arena 方格台面（ADR-18：由
// origin/tileSize/cols + tiles[].x/z 建板，alive/crack/seam/zone 驱动碎裂与缝隙表现）、
// players（yaw 直接 rotation.y——ADR-25：收到的就是 -Z 基 sim yaw，零补偿）、
// events（§10 词表触发 VFX）。字段缺失容错不抛错。
// 手感轮新增消费面（ADR-26/27；皮肤通路 v4.2 按实现补记）：
//   · players[].skinId → 皮肤剪影：main/smoke 经 createRenderer({data,skins}) 喂真表，
//     render/skins.js resolveSkinLook 先过 skinAppearance() 归一（§3.2-6），配件映射冻结
//     （hood/horns/mask 同名；back banner→banner；back pack→sash；topknot/strawHat→turban）；
//     skinId 变化时重建/换件该角色，识别色背件语义不变
//   · view.combat.ghosts → 半透明分身残影，按 ttl/ttl0 淡出，必须在画面上可见
//   · VFX 分派纪律：扇击按事件 gloveId 八套可辨、技能按 skillId 分派（含 parry/
//     meteorImpact/ghostSlap）。分派词表冻结 = render/combat-vfx.js COMBAT_VFX_KIND：
//     cotton→fanwake、granite→slab、gale→gust、frost→rime、spring→recoil、
//     afterimage→phase（不是 mirror，SOTA HG-06 已锁）、magnet→flux、meteor→cinder；
//     技能经 SKILL_VFX_KIND 同形放大，认不出退回持掌词（与 ART_DIRECTION §16/§17.4、
//     GDD §13 同词）。禁止 8 掌共用光球/描边；GloveDef.vfx 只是调参输入
// HUB-R1：view.hub 存在 ⇒ 建大厅场景（走道、台座、门；8 只展掌**手指朝上 +Y**、轻微
// 悬浮/呼吸、每掌可辨识的 idle VFX——霜雾/岩屑/风带/磁弧等，禁纯色光球）；按 view.phase
// 切场景与相机域；pedestals[].focused/slot/unlocked 驱动高亮/落位标记/锁灰态；
// enterArena / enterHub 事件（②）⇒ 短过渡（淡场或门内粒子，禁加载条）；落点/朝向读
// view.players（事件只带 x/y/z），相机对齐由壳层 alignCameraToSelf 完成。
// view.hub === null（降级件）⇒ 跳过大厅表现，不抛错。
// HUB-R3 补记（ADR-36，L3-10 预算前提）：「切场景」= 两棵子树互斥可见——hub 阶段
// 裂岛子树整棵关（台面 InstancedMesh 是 frustumCulled=false，不显式关会在走道上照画
// 整座岛），arena 阶段安全区子树整棵关；两区世界坐标错开（走道 z≈-120）从来不同框，
// 谁都不替对方付 draw。mid 档预算与 Round 3 实测数字见 ARCHITECTURE §8。

export function resize(width: number, height: number, dpr: number): void;   // dpr 已被 main 封顶 2
export function setQuality(tier: Tier): void;
export function dispose(): void;         // 释放 GL 资源，可重复调用
// 句柄可选追加：render(view, alpha)、setFollow(id)、setSpectator(on) —— 存在则 main 会调用
// Round 2 冻结追加（ADR-35）：setPitch(pitch: number)——相机俯仰（弧度，render 内部 clamp）。
// O4 每 rAF 在 sync 前用 input.getLook().pitch 喂入；O2 的 cameraRig 消费该值（内部签名自便）。
// 禁止第二个 pitch 状态源（input.getLook() 是唯一权威，ADR-4/17/35）。
// v4.2 登记（已实装，测量面）：getStats() 返回 { tier, phase, drawCalls, triangles, … }
//（three renderer.info 读数）——L3-10 预算与冒烟 HUD 的唯一读数口，禁止另设第二个计数器。
// 视角轮冻结追加（ADR-37/39，见 §7.1）：setLook 的 simYaw 优先语义收口 + snapCamera()。
// v4.4 登记（已实装，§7.1/§14-35）：setLook 的 lookMode 键 + setLookMode/getLookMode
// ——渲染器持有 lookMode 的**随帧镜像**（payload 每帧覆盖），按它选机位跟随角。
```

### 7.1 视角机位契约（视角轮 Round 1 新增、Round 2 v4.4 按实现补登记，冻结；ADR-37/38/39）

**`setLook(look)` 水平角唯一空间 = sim 空间**（ADR-37）。签名与消费规则：

```ts
// 渲染句柄（既有方法，语义收口；v4.4 追加 lookMode 键与返回字段，按实现登记）
setLook(look: { pitch?: number|null; yaw?: number|null; simYaw?: number|null;
                lookMode?: 'locked'|'free' } | number):
  { pitch: number|null; yaw: number|null; lookMode: 'locked'|'free' };
// 消费规则（自上而下取首条命中，水平角一律落进 lookYaw、空间恒为 sim）：
//   1. simYaw 有限        ⇒ lookYaw = simYaw（有 simYaw 键就绝不读 yaw 键——优先规则保留，
//                            防直连调用方只给 yaw 键时的空间歧义）
//   2. simYaw === null    ⇒ lookYaw = null（机位回落跟角色自身 yaw——这条路一直是对的）
//   3. 无 simYaw 键、yaw 有限 ⇒ lookYaw = yaw，**视传入 yaw 已是 sim 空间**（直连调用方——
//                            冒烟台/探针——按 ADR-17 给角，不做任何换算）
//   4. 无 simYaw 键、yaw === null ⇒ lookYaw = null
//   5. lookMode 键在场（v4.4）⇒ 等价调一次 setLookMode（认不出的值不改现状）；
//      缺席不动。feedLook 的 payload 恒携 lookMode（缺省收 'locked'），所以产线上
//      渲染器侧的模式每帧被 payload 覆盖 = 随帧镜像，活不过一帧（§14-35）。
// pitch 语义不变（ADR-35：有限值 clamp ±PITCH_LIMIT、null 清除、缺席不动）。
// 数字入参 = setPitch 简写（既有行为保留）。

// 渲染句柄（v4.4 按实现登记）
setLookMode(mode: 'locked'|'free'): 'locked'|'free';   // 认不出的值不改现状，返回生效值
getLookMode(): 'locked'|'free';
// getLook() 回读形状（v4.4 按实现登记）：{ pitch, yaw, simYaw, lookMode, cameraPitch, cameraYaw }
// ——yaw 与 simYaw 是同一个数（= lookYaw，sim 空间；没喂过 = null）；cameraPitch/cameraYaw
// 是机位这一帧真正用的阻尼后读数（调试/探针用，均为 sim 空间）。

// core/look.js（O4 所有，喂入侧同一份契约）
lookPayload(look): { yaw: number; pitch: number; simYaw: number; lookMode: 'locked'|'free' };
// simYaw  = cameraYawToSimYaw(look.yaw)（唯一换算点产物，§1-11）
// yaw     === simYaw（v4.4 按实现更正：同值同空间——相机系角不出输入层，渲染器读哪个
//           字段都拿到 sim 角；v4.3「yaw 保留相机系调试读数」作废，见 §0.1 死名预防段）
// lookMode = normalizeLookMode(look.lookMode)（缺省/认不出 ⇒ 'locked'，随帧透传给渲染器）
// 键集封闭：恰为 { yaw, pitch, simYaw, lookMode }，不得追加第三套朝向字段（core/look.test.js 锁定）
// feedLook(renderer, look)：优先 setLook(payload)，仅有 setPitch 时退喂 pitch；
// 两个都没有 no-op。喂入后 renderer.lookYaw 必须等于 payload.simYaw（不变量 §14-28）。

// 渲染句柄（视角轮冻结追加）
snapCamera(): void;
// 把跟随相机的全部阻尼状态（pos/look/yaw/pitchBias/dist/lead）立即置为
// 「当前跟随目标位置 + 当前 lookYaw/lookPitch」的稳态机位，并清 shake/fovKick 瞬态；
// 下一帧 sync 从稳态起步，零弹簧飞行。无本地玩家（观战/主菜单 orbit）时 no-op；
// 可重复调用、幂等。调用时序归 O4（§13.2）：input.setLook → feedLook → snapCamera，
// 顺序反了会 snap 到旧角度。

export const CAMERA_SNAP_TELEPORT = 60;   // 米。sync 内跟随目标单帧位移 > 此值 ⇒ 自动执行
                                          // 一次 snap 等价操作（第二道保险，防壳层漏调）。
                                          // 取值依据：hub↔arena 错开 ~120m 必须触发；
                                          // 局内最远瞬移（重生对角 ≤ 2×arenaRadius = 40m）
                                          // 不得触发——重生的弹簧甩镜是既有手感，保留。
export const CAMERA_SNAP_MAX_DIST = 20;   // 米。snap 后（含自动 snap）相机与跟随目标的
                                          // 距离上界（稳态机位几何上界 ≈ 9–18m 留余量），
                                          // G1/G2 断言用（不变量 §14-32/33）。
```

**lookMode 与渲染器（ADR-38，v4.4 按实现修订措辞）**：v4.3 曾写「渲染器不感知 lookMode、禁止塞进 renderer 状态」，合入的实现（F4 已验、`render/look.test.js` 锁定）是**随帧镜像**——payload 恒携 `lookMode`，`setLook` 每帧覆盖渲染器侧副本，它活不过一帧、**不构成第二权威**（运行期权威仍唯一住 input，禁令原意「防状态分叉」不变）。镜像驱动的唯一分支是**机位跟随角选源**（§14-35）：

| 模式 | 跟随角（机位绕谁转，全为 sim 空间） |
| --- | --- |
| `locked` | **角色自身 yaw**（`view.players[local].yaw`）——喂入的 `lookYaw` 拧不动机位。locked 下 1:1 不变量（§14-30）保证它与视线同值，跟角色 yaw 让「镜头钉身后、永不绕到正脸」在壳层没喂/晚一帧时也成立 |
| `free` | `lookYaw`（壳层喂的视线角）；`lookYaw === null` 回落角色 yaw——v4.3 的回落链原样保留，成为 free 分支语义 |

机位公式仍是同一条（`focus + (sin yaw, cos yaw)·dist` 即视线方向的身后），变的只是绕的角选谁；两分支吃的角都已是 sim 空间，`RENDER_YAW_OFFSET` 恒 0、无第四套朝向（ADR-25/37）。**view 快照与 sim 仍不感知 lookMode**（这半句禁令一字不动）。

同名异空间警示（探针/测试别混用）：`renderer.getLook().yaw` 回读的是 `lookYaw`（**sim 空间**），`input.getLook().yaw` 是相机方位角 θ（**相机系**）——两者只在 `cameraYawToSimYaw` 的不动点上偶然相等，断言时必须各对各的空间（不变量 §14-28 的取值建议 θ = 0 ⇒ simYaw = −π/2，两值必不同）。v4.4 起 `lookPayload().yaw` **不再是**相机系读数（=== simYaw）——全项目唯一的相机系角出口就是 `input.getLook().yaw`，其余凡叫 yaw 的视角字段一律 sim 空间。

## 8. `src/input`（Opus-4 所有）

模块级单例。**ui 建 DOM（`data-yz-*` 标记），input 绑事件**；canvas 上接管拖动/Pointer Lock 视角。

```ts
export function createInput(dom: HTMLElement|Document, canvas: HTMLCanvasElement, opts?: {
  sensitivity?: number; invertY?: boolean; pointerLock?: boolean;
  onFirstGesture?: () => void; onPause?: () => void;
  lookMode?: 'locked'|'free';                    // 视角轮新增（ADR-38）：初始模式，缺省 'locked'
                                                 //（认不出的值落 'locked'——normalizeLookMode）
  onLookModeChange?: (mode: 'locked'|'free') => void;
                                                 // 模式实际变化时触发恰一次。v4.4 按实现更正：
                                                 // 触发路径 = 键 V / toggleLookMode()（同一条路，
                                                 // toggle 必变故无同值问题）；setLookMode 是
                                                 // **静默 setter**（不触发回调——设置面板那条路
                                                 // 由 main.applySettings 自己收敛后落盘+反馈，
                                                 // 防「点一下弹两次提示」，§13.2）。v4.3 曾写
                                                 // 「V 键与 setLookMode 同路」，与实现相反
}): InputHandle;

export function sample(cameraYaw: number): Input;
// 每模拟步一次。按 §2 公式把摇杆/WASD 换算成世界系 moveX/moveZ（**两种 lookMode 下
// 移动换算同一条公式**——W 永远朝镜头水平前方，摇杆与 WASD 同映射）。
// input 内部保留自己的相机方位角 θ（forward = (cos θ, sin θ)），换算收敛在 core/view.js 的
// cameraYawToSimYaw / simYawToCameraYaw（两处合法换算点之一，ADR-17/25）。
// **Input.yaw 的产出按 lookMode 分派（ADR-38，视角轮收口；可测封闭表 = §14-34）**：
//   · lookMode='locked'（缺省，固定人物视角）：Input.yaw = cameraYawToSimYaw(θ)
//     ——期望面朝 ≡ 相机水平前向，即既有行为、不变量 §14-15 原式；sim 直赋
//     （step.js handleActions：Number.isFinite(input.yaw) ⇒ p.yaw = input.yaw，无平滑），
//     所以「人物水平面向与相机水平前向 1:1」逐 tick 精确成立（不变量 §14-30）。
//   · lookMode='free'：镜头与面向解耦。产出的移动矢量非零（(moveX,moveZ) ≠ (0,0)）⇒
//     Input.yaw = atan2(-moveX, -moveZ)（世界系移动方向的 sim 角，与 §4.1 既有导出
//     sim/math.js yawFromDir(moveX, moveZ) 逐位同式——同空间内由矢量求角，不是新的
//     换算点，§1-11）；零移动（含 WASD 对冲、setEnabled(false)）⇒ Input.yaw = null
//     （sim 不覆盖、保持当前朝向——step.js 的 Number.isFinite 门是既有语义，O1 零改动）。
//     机位喂入不变（feedLook 仍喂 simYaw，§7.1）——free 只解耦人物面向，
//     **不得**把相机系角混进任何 sim 侧字段。
// ⚠ 实装状态（v4.4，Round 2 P0 归 O4）：Round 1 合入的 sample() **未分派**——恒走
//   locked 分支送 cameraYawToSimYaw(θ)，free 行为等同 locked（F4 判 LK-04 FAIL）。
//   sim 的 null 门与 renderer 的机位半边（§14-35）都已在位且有测：本缺口只在 input
//   这一段，落地即闭环；G1 按 §14-34 锁测，F4 重判 LK-04。
// 换算不得散布到其它文件。sim 与 view 快照不感知 lookMode；渲染器仅持随帧镜像（§7.1，ADR-38 v4.4 措辞）。
// 键鼠语义锚点（G1 锁死，ARCHITECTURE §5.1.1）：纯 W ⇒ (moveX,moveZ) = (cos θ, sin θ)
//（= 相机水平前向）；纯 D ⇒ (−sin θ, cos θ)（屏幕右）；cameraYawToSimYaw 对 θ 单调递减
//（鼠标 +dx ⇒ θ 增大 ⇒ sim yaw 减小 ⇒ 从上方看顺时针 = 右转）。
// HUB-R1（ADR-32，v4.1 按实现收口）：input **感知 phase**（壳层 phase 切换时调 setPhase）。
// 键鼠 E 双义（skill hold + interact），分流在 input 侧：phase='hub' 时 sample 把
// slap/skill 归零、interact 以持续位上报（补 edge 帧防短点触漏拍）+ interactSlot 随行；
// phase='arena' 时 E 复位技能、interact 恒 false 语义。跨区切换清空按住态（大厅按着 E
// 穿门不会在裂岛立刻放技能）。sim 侧上升沿检测（p.prev.interact）不变。
export function setEnabled(enabled: boolean): void;   // false：动作清零、移动归零
export function getLook(): { yaw: number; pitch: number; lookMode: 'locked'|'free' };
// 相机朝向权威源（ADR-4/17/35）。lookMode 字段 v4.4 按实现登记（随帧透出，供
// lookPayload/壳层直读；yaw/pitch 两个既有字段一字不动）。注意 yaw 是**相机系** θ——
// 全项目唯一的相机系读数出口（§7.1 警示段）。
// pitch 通路（ADR-35）：getLook().pitch 是俯仰唯一权威源，O4 每 rAF 喂给
// renderer.setPitch（§7）；禁止 render/ui 各自维护第二份 pitch 状态。
// 句柄追加（冻结命名）：setLook(yaw, pitch)、setSensitivity(v)、setPointerLock(on)、
// releasePointerLock()、setTouchButton(name, down, opts?)、setPhase(next)、getPhase()
// HUB-R1：setTouchButton 的 name 词表含 'interact'（触控「选」按钮，hub 阶段显示；
// DOM 由 ui 建并带 data-yz-interact 标记，input 绑事件——分工不变）；opts.slot
// ('main'|'off') 只有 interact 认，直接指定要装的槽位（§4.4 装备表）。
// setPhase('hub'|'arena')：见上方 E 双义分流；由壳层在 enterArena/enterHub 时调用。
// 视角轮冻结追加（ADR-38）：setLookMode(mode)（非法值忽略并返回当前值；**静默**——
// 不触发 onLookModeChange，v4.4 按实现更正）、getLookMode()、toggleLookMode()
//（v4.4 登记：与 V 键同一条路径，触发 onLookModeChange；触控钮/调试用）。
// lookMode 的**运行期权威**与 yaw/pitch 一样只住在 input（ADR-4 的 look 状态
// 扩为 { yaw, pitch, lookMode }），禁止 shell/render/main 另存权威副本（存档是持久化
// 不是运行期权威；渲染器/HUD 的**随帧镜像**不算——每帧被喂入链覆盖，§7.1/§13.2）。
// 键 V（KeyV）上升沿 = toggle lookMode——不占用既有键位
// （E/WASD/空格/Q/F/Shift/Esc），按 V 不得置位任何动作（jump/skill/interact/slap 等）；
// input.setEnabled(false) 期间 V 不生效。两个 phase（hub/arena）共用同一份 mode。
```

禁止锁敌自动瞄（种子红线）：input 只产出方向与动作位，不做目标吸附。

## 9. `src/audio`（Opus-4 所有）

模块级单例。WebAudio 全合成，无外部音频文件。

```ts
export function createAudio(opts?: { muted?: boolean }): AudioHandle;
export function unlock(): void;    // 首次 pointer 手势调用；重复调用无害
export function play(name: SoundName, opts?: Record<string, number>): void;
// 未知 name 静默忽略（不 throw）；未 unlock 前的 play 丢弃。
// 句柄追加：setMuted(on)、suspend()/resume()（loop 在 hidden/恢复时调用）
```

## 10. 事件分类学（SimEvent，冻结 —— sim 实际发射的词表）

所有事件由 sim 的 `pushEvent` 发出并自动带 `t: number`（模拟秒）。新事件类型先登记再实现。

```ts
type SimEvent = { t: number } & (
  | { type: 'slapStart'; id: PlayerId; gloveId: GloveId }
  | { type: 'slap';      id: PlayerId; gloveId: GloveId; hits: number;   // hits=0 ⇒ 空挥
      x: number; y: number; z: number; yaw: number }
  | { type: 'hit';       id: PlayerId; targetId: PlayerId; source: 'slap'|'skill';
      gloveId: GloveId;                          // 手感轮新增：HitRecord.gloveId 优先，
                                                 // 缺省回落攻击者结算时 activeGloveId
      skillId: SkillHandlerId|null;              // 手感轮新增：null = 素掌扇击
      power: number; x: number; y: number; z: number }
  | { type: 'ko';        id: PlayerId; by: PlayerId|null; reason: string;  // by=null 自坠
      x: number; y: number; z: number }
  | { type: 'respawn';   id: PlayerId; x: number; y: number; z: number }
  | { type: 'jump';      id: PlayerId; x: number; y: number; z: number }
  | { type: 'dash';      id: PlayerId; x: number; y: number; z: number }
  | { type: 'switch';    id: PlayerId; slot: 0|1; gloveId: GloveId }
  | { type: 'skill';     id: PlayerId; gloveId: GloveId; skillId: SkillHandlerId|'none' }
  | { type: 'awaken';    id: PlayerId; gloveId: GloveId|null }      // combat 触发，经桥代发
  | { type: 'awakenEnd'; id: PlayerId }                             // 同上
  | { type: 'parry';     id: PlayerId; targetId: PlayerId; power: number;
      gloveId: GloveId; skillId: 'parry' }                          // id = 弹反者（手感轮补 id）
  | { type: 'meteorImpact'; id: PlayerId; x: number; z: number; radius: number;
      gloveId: 'meteor'; skillId: 'meteorSlam' }                    // 手感轮补 id
  | { type: 'ghostSlap'; id: PlayerId; targetId: PlayerId;
      gloveId: 'afterimage'; skillId: 'blinkSwap' }                 // 残影假掌骗中（手感轮补 id）
  | { type: 'tileCrack'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'tileBreak'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'matchOver'; winnerId: PlayerId|null; reason: 'kills'|'time' }
  // ---- HUB-R1（sim 直发；v4.1 按实现名收口，②③）----
  | { type: 'hubFocus'; gloveId: GloveId }             // 聚焦变为非空/换座（回落 null 不发，读 view diff）
  | { type: 'hubEquip'; id: PlayerId; gloveId: GloveId; slot: 'main'|'off';
      changed: boolean;                                // false = 已装备回执（不改配装，无音效/toast）
      mainGloveId?: GloveId; offGloveId?: GloveId }    // changed:true 时附装备后全配装
  | { type: 'hubLocked'; id: PlayerId; gloveId: GloveId; unlock: 'default'|string }
                                                       // ③ 未解锁拒绝；unlock = 解锁条件 id
                                                       //（UI 文案经 UNLOCK_BY_GLOVE 查）
  | { type: 'hubPortalNear'; id: PlayerId; ready: boolean }   // 进入门触发圆的上升沿发一次
  | { type: 'enterArena'; id: PlayerId; x: number; y: number; z: number }
                                                       // ② 传送完成，携落点（每个真人一条，不带 yaw）
  | { type: 'enterHub'; id: PlayerId; x: number; y: number; z: number }
                                                       // ② 回程完成（enterHub API 触发）
);
```

注：

- `awaken / awakenEnd / parry / meteorImpact / ghostSlap` 由 combat 触发、经桥翻译后 sim 代发（ADR-22）；其余全部 sim 直发。
- **死名（v4 曾登记、从未发射，禁止对其写测试/分派/音效）**：`hubDeny`（→ `hubLocked`）、`phaseChange`（→ `enterArena` / `enterHub`）。
- hub 内 `switchGlove` 复用既有 `switch` 事件（hub = 主副交换、无锁：`slot: 0`、`gloveId` = 交换后的主掌；arena = activeSlot 切换 + switchLock，见 §4.4 v4.2）；聚焦获得/换座**是** `hubFocus` 事件（v4「聚焦变化不是事件」已按实现修正），聚焦丢失读 view diff。
- `skill` 事件与 `HitRecord` 的 `skillId` 是 **handler id**（§3.1 右列）。
- **VFX 分派键（ADR-27）**：O2 按事件的 `gloveId` 分派扇击表现、按 `skillId` 分派技能表现——`slapStart/slap/hit/switch/skill/parry/meteorImpact/ghostSlap` 都带 `gloveId`，禁止按 type 猜或全掌共用一套。
- `ko.reason` 现值恒为 `'fell'`（掉落是唯一死法）。
- O4 经 `core/view.js normalizeEvent` 把本词表整形成 shell 内部形状（`ko → killerId/victimId` 等）——线上词表以本节为准，normalizeEvent 的输出形状不冻结。

## 11. 事件 → 音效名对照（main.js 持有；SoundName 词表冻结；v4.1 按实现表收口，⑦）

**SoundName 现役词表**（= `src/audio/index.js` 合成器键集，冻结）：`slap` `slapWhiff` `hit` `hitTaken` `heavy` `crack` `collapse` `jump` `land` `dash` `switchGlove` `skill` `awaken` `ringout` `kill` `death` `respawn` `uiMove` `uiSelect` `uiBack` `matchStart` `matchEnd` `tick`。v4 曾登记的 `equip / deny / portal / ui_hover / ui_click` **从未实装**（死名）；未知名静默忽略的契约不变。

| SimEvent（main.handleEvents 实况） | SoundName |
| --- | --- |
| `slap`（hits>0） / `slap`（hits=0） | `slap` / `slapWhiff` |
| `hit` | `hit`（power 调强度）；`targetId === p0` 追加 `hitTaken`（被打有贴脸闷响） |
| `skill` | `skill` |
| `switch` | `switchGlove` |
| `dash` / `jump` | `dash` / `jump` |
| `tileCrack` / `tileBreak` | `crack` / `collapse` |
| `ko`（凶手=p0 / 受害=p0 / 其他） | `kill` / `death` / `ringout` |
| `respawn`（仅 p0） | `respawn` |
| `awaken` | `awaken` |
| `hubFocus` | `uiMove` |
| `hubEquip`（`changed === false` 不发声） | `switchGlove`（+ 主/副掌 toast） |
| `hubLocked` | `uiBack`（+ 解锁条件 toast） |
| `hubPortalNear` | 无音（`ready:false` 时 toast「先挑一只主掌」） |
| `enterArena`（仅 p0；enterArenaFx） | `matchStart`（顺带 `.yz-warp` 淡场 + toast） |
| `enterHub`（仅 p0；enterHubFx） | 无音（淡场 + toast） |
| 开局 `startMatch`（非事件） | 直通裂岛 `matchStart`；进大厅 `uiSelect` |
| 结算 `finishMatch`（读 `view.over`，非 `matchOver` 事件挂钩） | `matchEnd` |

未列出的事件（`slapStart / awakenEnd / parry / meteorImpact / ghostSlap`）**保持静默**；要加音效先在本表登记新名（G1 不得对未登记的事件-音名组合写断言）。

## 12. 存档 schema（key = `yizhang-save-v1`，`src/core/storage.js` 独占读写）

```ts
interface SaveV1 {
  version: 1;
  unlocked: GloveId[];                       // 恒含 'cotton'
  loadout: { main: GloveId; off: GloveId };
  skinId: SkinId;                            // 手感轮新增：默认 DEFAULT_SKIN_ID（'drifter'）。
                                             // 追加字段不换 key：旧档缺失 ⇒ loadSave 补默认；
                                             // 非法值 ⇒ 消费端 resolveSkin 兜底
  quality: 'auto'|Tier;                      // 默认 'auto'
  muted: boolean;
  lookSensitivity: number;                   // 0.2..3，默认 1
  invertY: boolean;
  lookMode?: 'locked'|'free';                // 视角轮新增（ADR-38）：默认 'locked'（固定人物
                                             // 视角是产品缺省）。追加字段不换 key：老档缺失 ⇒
                                             // loadSave 补 'locked'；非法值 ⇒ 落 'locked'。
                                             // 写回时机：V 键 / 设置项改动即落盘；URL `?look=`
                                             // 只影响本次会话、不回写（§13.2）
  pointerLock?: boolean; touch?: boolean;    // 可选偏好
  stats: { matches: number; kills: number; deaths: number; wins: number; bestKills: number };
}
```

规则：读失败/版本不符 → 默认值并覆写；未知字段写回保留；破坏性变更换 key `yizhang-save-v2` + 迁移。解锁判定用 `data` 的 `UNLOCKS/UNLOCK_BY_GLOVE/isGloveUnlocked`，结果落 `unlocked`。HUB-R1：schema 不变——存档 `unlocked` 经壳层换算后就是 `createMatch(opts.unlocked)` 的来源（v4.1 名收口，①）；走道所选在**传送帧**由 O4 写回 `loadout`（`rememberHubLoadout`，§4.4）。

## 13. `src/ui/shell.js` 与 `src/core/loop.js`（Opus-4 所有；最小面）

```ts
// ui/shell —— 主菜单（双掌选择 + 皮肤选择，读解锁位）、HUD、结算、暂停、触控控件 DOM。
// HUD 类名走 F2 的 .yz-* 契约（src/styles），shell 自带样式只做 critical fallback。
// 手感轮新增：大厅皮肤选择器（SKINS 顺序渲染、样式类 .yz-skin-*，F2 出契约；
// 选中写 save.skinId）；onStart 的 loadout 扩为 { main, off, skinId }——main 把
// skinId 传 createMatch、botSkinIds 从 BOT_PERSONA_BY_ID[persona].skinId 取。
export function createShell(opts: { root, gloves, gloveById, save, audio, input, matchConfig,
  callbacks: { onStart(loadout: { main: GloveId; off: GloveId; skinId: SkinId });
               onResume(); onRestart(); onQuit(); onPauseRequest(); onSettingsChange(next) };
}): {
  updateHud(view: MatchView, selfId: PlayerId): void;   // main ~30Hz 调，内部脏检查
  showMenu(); showMatch(); showResult(r); showPause(); hideSheet();
  toast(text, ms?); pushKill(entry); setNotes(list); setUnlocked(ids);
  settings; screen; menu;
};

// core/loop —— 固定步进 + 插值 alpha + 暂停；回调注入保证可无头测试
export function createLoop(opts: { dt: number;
  step(dt: number): void; draw(alpha: number, info: { paused: boolean }): void;
  onPauseChange?(isPaused: boolean, why: 'user'|'hidden'|'visible'): void;
}): { start(): void; setPaused(on: boolean): void; isPaused(): boolean };
```

O4 可在二者上追加方法，上表所列名字与语义不得变；`main.js` 只做装配与事件→音效映射，不写业务逻辑。

### 13.1 hub HUD 契约（HUB-R1 新增；数据面归本文，视觉归 F2 的 `.yz-inspect`）

`updateHud(view, selfId)` 在 `view.phase === 'hub'` 时额外驱动三块 DOM（类名由 F2 在 `src/styles/**` 定义，shell 按语义挂类）：

1. **靠近说明牌（`.yz-inspect`）**：`view.hub.focusGloveId` 非空时显示，内容直接读聚焦座的 `HubPedestalView`（`name/role/desc/color` 已由 getView 补挂，UI 不必再翻数据表；饱和识别色只给当前聚焦掌）、槽位状态（`slot` 为 `'main'/'off'` ⇒ 「已装备·主/副」；null ⇒ 「按 E / 点『选』装备」+ 将落入的槽位预告，按 §4.4 装备表推导，含「副掌再按提主」）；`unlocked === false` ⇒ 锁态样式 + 解锁条件文案（`unlock` 字段经 `UNLOCK_BY_GLOVE` 查 desc）。focus 为 null 时隐藏。
2. **门提示**：`portalNear ∧ !portalReady` ⇒ 「先选一只掌」；`portalNear ∧ portalReady` ⇒ 「穿过传送门 · 进入裂岛」。状态驱动（读 view），不依赖事件。
3. **配装指示**：HUD 常驻显示当前主/副掌（`mainGloveId/offGloveId` 为 null 的槽显示空位），复用既有掌色/掌名字段。

触控：hub 阶段显示「选」按钮（`data-yz-interact`，`setTouchButton('interact', down, { slot })` 可指定主/副槽），仅在 `focusGloveId` 非空时可用态；靠近+确认与键鼠同一套语义（种子验收线）。2D 选掌板 `.yz-home` 降为暂停/设置里的备选入口，默认开局不再作为必经路（GOAL 附则）；开始一局 = `startMatch` 缺省进大厅（`phase:'hub'`、`gloveId:null` 让门从未就绪起步），配装在走道完成；只有备选台上的「直接进裂岛」才带 `skipHub`。

**进局入口语义（v4.2 按实现登记；`src/core/entry.js`，冻结）**：结算「再来一局」= `ENTRY.RESTART` ⇒ `skipHub: true`，**同一副掌直接回裂岛**（配装取值链：上一局 → 存档 → 2D 配掌板，链头必须是 lastLoadout）；结算「回安全区换掌」/ 暂停「回安全区」= `ENTRY.HUB` ⇒ `skipHub: false`，main 开局**不预填主副掌**（`gloveId/offhandId` 传 null），`portalReady` 从 false 起步、挑完掌门才放行。`skipHubFor(kind)` 只对 RESTART 返回 true——两个按钮不许再指向同一件事（Round 1 遗留 6 的收口）。

### 13.2 视角模式通道与过门机位（视角轮 Round 1 新增，冻结；ADR-38/39，归 O4）

**lookMode 四通道，初始值取值链（左优先）**：`?look=locked|free`（URL，仅本次会话、不回写存档）→ 存档 `lookMode`（§12）→ 缺省 `'locked'`（实现 = `core/look.js resolveLookMode`，§0.2；URL 填了认不出的值落到存档链，不是直落缺省）。运行期改动两条路（**v4.4 按实现更正**——v4.3「两条路都经 `onLookModeChange`」与实现相反）：

1. **键 V**（`input.toggleLookMode` 同路）：经 `onLookModeChange` 回调——main 实况 `updateSave({ lookMode })` 落盘 + `shell.setLookMode(mode)` 出反馈；
2. **设置面板项**：main `applySettings` 实况 `input.setLookMode(next.lookMode)`（**静默** setter，收敛非法值）→ `shell.setLookMode(input.getLookMode())`（拿收敛后的值回喂）→ `updateSave`——**不经** `onLookModeChange`（否则设置板点一下弹两次提示）。

两条路的可见反馈汇合在 `shell.setLookMode` 这一个入口（**Round 1 已合入 DOM 接线**，`hud.test.js`/`shell.test.js` 锁定）：`#hud[data-look]` 模式镜像（常驻 data 属性，锁定态准星等 CSS 选择器挂它；开局初始化不闪）+ **唯一一枚** `.yz-look-flash` 切换一瞬回执（「视角锁定 / 自由视角」+ V 键章，≈0.9s 自摘；同值再喂不亮、中央短讯不跟开）。F4 清单 **LK-09 的「DOM 零消费、toast 顶班」DEFER 已过时**，Round 2 由 F4 按合入实况改勾（本文只登记事实）。非法 URL 值忽略、走存档链。smoke/冒烟台同一参数名：`?look=locked|free`（G2 探针用）。

**过门 / 开局机位时序（冻结顺序，ADR-39）**：`startMatch` 开局、`enterArenaFx`、`enterHubFx` 三处，`alignCameraToSelf` 必须按此顺序收尾：

```
1. input.setLook(simYawToCameraYaw(self.yaw), pitch)   // 方位角对齐出生/落点朝向（既有）
2. feedLook(renderer, input.getLook())                  // 当帧喂 simYaw（§7.1）
3. renderer.snapCamera?.()                              // 机位立即架到身后稳态，可选链容缺
```

顺序反了 = snap 到旧角度（镜头先钉在 120m 外再瞬移）。`lerpView` 的传送帧跳插值（ADR-31）与本条叠加：角色不滑步、机位不飞行，两件事各归各。渲染器缺 `snapCamera` 时（降级件/旧实现）走 §7.1 的 `CAMERA_SNAP_TELEPORT` 自动保险，壳层不补第二套 snap 逻辑。

## 14. 不变量清单（G1 测试基线 / F4 验收引用）

1. `structuredClone(createMatch({seed:1,...}))` 成功；克隆体与原件各 step 600 tick 后 `getView` 深比较相等。
2. `getView` 结果 `JSON.parse(JSON.stringify(v))` 往返无损；调用前后 state 无变化。
3. 扇形命中：`slapRange + playerRadius` / `slapAngleDeg` 边界内命中、边界外与背身不命中；空挥进 recovery（有后摇）。**helpers 用 ADR-17 约定**（面向 +X ⇔ `yaw = -PI/2`）。
4. 击退：命中者获水平冲量 ≥ `slapPower` 基准且方向正确；`invulnT > 0` 目标免疫。
5. 掉落：脚下无台 ⇒ 下落，`y < fallY` ⇒ `ko` 事件 + `respawnT = respawnDelay`；`killCreditWindow (5s)` 内有 `lastHitBy` ⇒ 记杀且 streak 递增；自坠 streak 清零。水平出盘（无支撑）必须在有限步内 ko；重击退（`kbT > 0` 且速度达标）不得被护栏截停。
6. 换掌：`switchLockT` 从 0.4 递减，期间 slap/skill 无效；边沿触发，长按不连切。
7. 觉醒：meter 累积到 1 自动触发、`awakenedT` 从 8 递减、期间 `applyAwaken` 覆盖生效、死亡清零、重生 meter ≤ 0.35。
8. 碎地：`damageTileAt` 发 `tileCrack`，HP≤0 发 `tileBreak` 且 `hasFloorUnder` 立即为 false；站在其上的玩家开始下落。
9. **`isMatchOver` 活谓词**：直接改 `player.kills ≥ killsToWin` 后不 step 即 `over: true` 且 `winnerId` 正确；步进超过 `matchSeconds` 后 `over: true, reason: 'time'`。
10. 掌表：8 只手套字段齐全（§3 GloveDef）；`isGloveUnlocked('cotton', {}) === true`，其余无进度时 false。
11. sim/combat/ai/data 源码静态扫描无 `three`、`document`、`window`、`Math.random`（G2 probe 断言）。
12. 技能入局：装备 magnet 的玩家对目标放技能并 `step` 若干帧后，两者水平距离必须缩短（真实 combat 接线的回归锚点）。
13. **接线不变量（ADR-24）**：import `src/sim` 后不做任何 install，`getDeps().usingRealData === true && usingRealCombat === true`；probe 的 wiring 断言以此为准、**不得先 install 再测**。`installCombat(任意非 null 模块)` 后 `usingRealCombat` 必须为 false，`resetDeps()` 后恢复 true。
14. **渲染零补偿（ADR-25）**：`RENDER_YAW_OFFSET === 0`；`toRenderView(view)` 后 `players[].yaw` 与入参逐位相等（`core/view.test.js` 原「补 π」断言按此改写）。
15. **键鼠映射（ADR-17/25，ARCHITECTURE §5.1.1）**：对任意相机方位角 θ，纯 W 时 `sample(θ)` 的 `(moveX, moveZ) ≈ (cos θ, sin θ)`、纯 D 时 `≈ (−sin θ, cos θ)`、A/S 取反（**两种 lookMode 下移动映射相同**）；`lookMode='locked'`（缺省）下 `Input.yaw === cameraYawToSimYaw(θ)` 且 `forward(Input.yaw) ≈ (cos θ, sin θ)`（free 下的 Input.yaw 见 §14-31）。
16. **右转方向（ADR-17/25）**：`cameraYawToSimYaw` 对 θ 单调递减（wrap 意义下 `ds/dθ = −1`）——鼠标 +dx ⇒ sim yaw 减小 ⇒ 从上方（+Y 向下）看 `forward(simYaw)` 顺时针转 ⇒ 右转。
17. **皮肤表（ADR-26，§3.2）**：`SKINS.length ≥ 6`、id 唯一且属 SkinId 词表、字段齐全（build/headgear/back/palette 全非空）；`resolveSkin(未知 id)` 与 `resolveSkin(null)` 都返回 `SKIN_BY_ID[DEFAULT_SKIN_ID]`；`BOT_PERSONAS` 每项带 `skinId` 且三人互异。
18. **皮肤透传（ADR-26）**：`createMatch({ skinId: 'x' })` 后 `getView().players[0].skinId === 'x'`（sim 不校验）；缺省为 null；`botSkinIds` 按序落到 b0…；存档 `skinId` 经 `loadSave/updateSave` 往返保留，旧档缺失补 `DEFAULT_SKIN_ID`。
19. **VFX 事件形状（ADR-27）**：任一 `hit` 事件带 `gloveId`（属 GloveId 词表）与 `skillId`（handler id 或 null）；`view.combat.ghosts` 恒存在（无残影时空数组）；分身放技能后 ghosts 出现 `{ ownerId, ttl0 > 0, yaw 为 -Z 基 }` 条目并在 ttl 耗尽后消失。
20. **hub 开局形状（ADR-29，v4.1 名收口）**：`createMatch()` 缺省或 `{ phase: 'hub' }` ⇒ `view.phase === 'hub'`、`view.hub.pedestals.length === 8`；不传 `gloveId` 时 `mainGloveId === null ∧ portalReady === false`；传有效 `gloveId` ⇒ 视为已选主掌、`portalReady === true`。`skipHub` / `phase:'arena'` / `config.skipHub` 直接进岛。
21. **靠近聚焦（ADR-30）**：p0 在台座 `interactRadius` 内 ⇒ `focusGloveId` 为该掌（并发 `hubFocus`）；移出 ⇒ `null`（不发事件）。
22. **interact 装备（ADR-30，v4.1 补 ⑥）**：聚焦已解锁掌 + `interact` 上升沿 ⇒ 主空装主、副空装副、**副掌再按提为主掌（原主退副）**、已是主掌 ⇒ `changed:false` 回执；长按不连发（按住走到另一座不重复消费同一次按下）。
23. **未解锁拒绝（ADR-30）**：聚焦未解锁掌 + interact ⇒ 配装逐字段不变，发 `hubLocked { unlock }`。
24. **传送（ADR-31，v4.1 补 ⑤②）**：`portalReady` 后 xz 进入门触发圆（`≤ portal.radius`）⇒ 同 tick `phase === 'arena'`、loadout 保留、`match.startTime` 重置、发 `enterArena`。
25. **安全区免战（ADR-29）**：hub 内无击退 KO、无碎地；被连扇 180 帧位置/deaths/hitsTaken 零变化；Bot 不进攻。
26. **hub 空挥闸（ADR-33，Round 2 起生效）**：`playerInHub` 为真时按住 `slap` 任意帧数 ⇒ 零 `slapStart/slap` 事件、`stats.slaps` 不变、`attack.phase` 恒 `'idle'`；`skill` / 战斗 `dash` 同样不起。`phase==='hub'` 但人在裂岛坐标上（旧测/harness）**不受闸**。移动/跳/interact/switchGlove 不受影响。
27. **hub 换掌 = 主副交换（v4.2 按实现登记；`sim/hub-actions.test.js`）**：`playerInHub` 内 `switchGlove` 上升沿 ⇒ `gloveId/offhandId` 互换、`activeSlot === 0`、`switchLockT === 0`（连按连换、长按不连发）、发 `switch { slot: 0, gloveId: 交换后主掌 }`；两格都挑过时 `hub.mainGloveId/offGloveId` 随行交换；arena 语义不变（activeSlot 切换 + 0.4s 锁）。
28. **机位喂入空间（ADR-37，v4.3；v4.4 补一句）**：`lookPayload({ yaw: θ })` 产出 `simYaw === cameraYawToSimYaw(θ)`；`feedLook(renderer, { yaw: θ })` 后 `renderer.getLook().yaw === cameraYawToSimYaw(θ)`——取 θ 使两值不同（如 θ = 0 ⇒ lookYaw = −π/2），断言相机系角**没有**落进 `lookYaw`。直连路径：`setLook({ yaw: s })`（无 simYaw 键）后 `getLook().yaw === s`（当 sim 角收）；`setLook({ simYaw: s, yaw: 任意 })` 后 `=== s`（simYaw 优先）；`setLook({ simYaw: null })` 后 `=== null`（回落跟角色）。**v4.4 补**：`payload.yaw === payload.simYaw`（同值同空间，相机系角不出输入层）且 payload 键集恰为 `{ yaw, pitch, simYaw, lookMode }`（无第三套朝向字段）。
29. **lookMode 通道与缺省（ADR-38，v4.3；v4.4 按实现更正回调路径）**：`createInput` 后 `getLookMode() === 'locked'`；**`toggleLookMode()` / KeyV 上升沿**触发 `onLookModeChange` 恰一次；`setLookMode` 是**静默 setter**——触发零次、非法值保持现值（`setLookMode('banana')` 后回读仍是原模式，不偷偷回 locked；`createInput({ lookMode: 非法 })` 则落 `'locked'`——两处兜底不同，都已锁测）；KeyV **不**置位任何动作（sample 的 jump/skill/interact/slap/dash/switchGlove 全 false）；存档 `lookMode` 经 `loadSave/updateSave` 往返保留，老档缺失 ⇒ `'locked'`；`?look=free` 覆盖存档初值但不回写。
30. **locked 1:1 面向（ADR-38，v4.3）**：`lookMode='locked'` 下任意 θ：`sample(θ).yaw === cameraYawToSimYaw(θ)`（§14-15 原式，缺省模式零回归）；喂 sim 一步后 `p0.yaw` 与之逐位相等（`handleActions` 直赋、无平滑）；同帧 `feedLook` 后 `renderer.getLook().yaw` 与 `p0.yaw` 同值——「人物水平面向 ≡ 相机水平前向」在 sim 与机位两端同时闭环。pitch 不受影响（照走 ADR-35 通路，上下看自由）。
31. **free 面向解耦（ADR-38，v4.3）**：`lookMode='free'` 下：零移动 ⇒ `sample(θ).yaw === null`；有移动 ⇒ `sample(θ).yaw === atan2(-moveX, -moveZ)`（用纯 D 断言：期望面朝 = 屏幕右方向的 sim 角 ≠ `cameraYawToSimYaw(θ)`，证明面向已与镜头解耦）；机位喂入仍是 simYaw（§14-28 在 free 下同样成立——空间纪律与模式无关）。
32. **过门 snap（ADR-39，v4.3）**：按 §13.2 顺序执行 `setLook → feedLook → snapCamera` 后，相机与跟随目标距离 ≤ `CAMERA_SNAP_MAX_DIST`（20m），且机位在视线反向半平面（`forward(lookYaw) · (camPos − focus) < 0` = 身后）；`enterArena` / `enterHub` / 开局后连续 60 帧相机-角色距离恒 < `CAMERA_SNAP_TELEPORT`（60m）——无 ~120m 弹簧飞越、无贴脸穿模。
33. **teleport 自动保险（ADR-39，v4.3）**：不调 `snapCamera`、把跟随目标单帧从 hub 坐标（z≈−120）搬到裂岛原点再 `sync` 一帧 ⇒ 相机与目标距离即 ≤ `CAMERA_SNAP_MAX_DIST`（渲染器内建 `CAMERA_SNAP_TELEPORT` 阈值自动 snap）；局内重生级瞬移（≤ 40m）**不得**触发自动 snap（弹簧甩镜手感保留）。
34. **sample() 分派封闭表（ADR-38 实装收口，v4.4；Round 1 LK-04 FAIL 的补洞，归 O4 落地、G1 锁测）**：对任意相机方位角 θ 与任意按键/摇杆组合，`sample(θ)` 的返回对象**自足可测**（只看返回值，不需内部状态）且恰满足其一：
    - `getLookMode() === 'locked'` ⇒ `yaw === cameraYawToSimYaw(θ)`——不看移动、`setEnabled(false)` 时同样成立（§14-15/30 原式，缺省模式零回归）；
    - `getLookMode() === 'free'` ∧ `(moveX, moveZ) ≠ (0, 0)` ⇒ `yaw === atan2(-moveX, -moveZ)`（与 §4.1 既有导出 `yawFromDir(moveX, moveZ)` 逐位同值；等价断言 `forward(yaw) ≈` 单位化 `(moveX, moveZ)`——`yawFromDir` 是 `forwardX/forwardZ` 的逆）；
    - `getLookMode() === 'free'` ∧ `(moveX, moveZ) === (0, 0)`（含 WASD 对冲归零、`setEnabled(false)`）⇒ `yaw === null`。
    配套四条：**sim 不覆盖**——`yaw: null` 连喂 `step` 任意帧数，`p.yaw` 逐位不变（`step.js` 的 `Number.isFinite(input.yaw)` 门是既有语义，O1 零改动）；**切换当帧生效**——同一按键状态下 `setLookMode`/`toggleLookMode` 后**下一次** `sample` 即按新模式分派，无跨帧缓存；**移动映射与模式无关**——两模式下 `moveX/moveZ` 与 §14-15 逐位相同（W 永远朝镜头水平前方）；**值域封闭**——`sample().yaw` 只可能是上述三种产出，相机方位角 θ 原值在任何模式下不得出现在 `Input.yaw`（取 θ 为 `cameraYawToSimYaw` 的非不动点即可反证），**禁止第四套朝向**（§1-11，`RENDER_YAW_OFFSET` 恒 0）。
35. **机位跟随角按模式选源（v4.4 按实现登记；`render/look.test.js` 已锁，LK-04 重判的 render 半边）**：`setLook(lookPayload({...}))` 喂入后——`lookMode === 'locked'` ⇒ 跟随机位绕**角色自身 yaw**（喂入的 `lookYaw` 拧不动机位，镜头钉身后、永不绕到正脸）；`'free'` ⇒ 绕 `lookYaw`，`lookYaw === null` 回落角色 yaw。payload 恒携 `lookMode`（缺省收 `'locked'`——不带模式喂一帧就把渲染器掰回 locked，证明镜像活不过一帧、input 仍是唯一运行期权威）；两分支的机位都必须在对应跟随角的**身后半平面**（§14-32 同式）。sim 与 view 快照不感知 lookMode（ADR-38 余下禁令原样）。
