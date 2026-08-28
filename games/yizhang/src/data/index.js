// 异掌 · 数据层汇总出口（各模块也可单独 import）
export { GLOVES, GLOVE_BY_ID, MATCH, isGloveUnlocked } from "./gloves.js";
export { MOVEMENT, KNOCKBACK, METER, RULES, CAMERA, CHARACTERS } from "./tuning.js";
export { SKILLS, SKILL_IDS, SKILL_COMBAT_ALIASES } from "./skills.js";
export { TILE } from "./tiles.js";
export { BOT_PERSONAS, BOT_PERSONA_BY_ID } from "./bots.js";
export { UNLOCKS, UNLOCK_BY_ID, UNLOCK_BY_GLOVE } from "./unlocks.js";
export { HUB } from "./hub.js";
export { SKINS, SKIN_BY_ID, DEFAULT_SKIN_ID, resolveSkin } from "./skins.js";
export { GLOVE_VFX, GLOVE_VFX_BY_ID, GLOVE_VFX_BY_SKILL, resolveGloveVfx } from "./vfx.js";
export { STORY, STORY_BY_ID } from "./story.js";
