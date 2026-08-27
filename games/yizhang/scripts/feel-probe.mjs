import { GLOVES } from '../src/data/gloves.js';

import {
  createFourPlayerMatch,
  errorMessage,
  loadSimulation,
  scanProbePurity,
  validateRoster,
} from './harness.mjs';

const MODEL_SLUG = 'gpt-5.6-sol-xhigh-fast';
const EXPECTED_GLOVE_IDS = [
  'cotton',
  'granite',
  'gale',
  'frost',
  'spring',
  'afterimage',
  'magnet',
  'meteor',
];
const REQUIRED_VFX_DESCRIPTORS = ['slap', 'skill', 'hit'];

console.log(`MODEL_SLUG: ${MODEL_SLUG}`);

try {
  const purity = await scanProbePurity();
  const simulation = await loadSimulation();
  const view = simulation.getView(createFourPlayerMatch(simulation));
  const players = validateRoster(view);

  const skin = inspectSkinIds(players);
  const vfx = inspectGloveVfx(GLOVES);

  for (const warning of [...skin.warnings, ...vfx.warnings]) {
    console.warn(`FEEL PROBE WARN: ${warning}`);
  }

  const result = {
    status: 'pass',
    purity: {
      status: 'pass',
      filesScanned: purity.filesScanned,
      forbiddenImports: purity.forbiddenDirectories,
    },
    skin: { status: skin.status, players: players.length },
    vfx: {
      status: vfx.status,
      gloveIds: EXPECTED_GLOVE_IDS,
      describedGloves: vfx.describedGloves,
    },
    warnings: skin.warnings.length + vfx.warnings.length,
  };

  console.log(
    `FEEL PROBE PASS: purity ${purity.filesScanned} files, ` +
      `skin ${skin.status}, vfx ${vfx.status}`,
  );
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(`FEEL PROBE FAIL: ${errorMessage(error)}`);
  process.exitCode = 1;
}

function inspectSkinIds(players) {
  const withField = players.filter((player) =>
    Object.prototype.hasOwnProperty.call(player, 'skinId'),
  );
  if (withField.length === 0) {
    return {
      status: 'warn',
      warnings: ['getView() 玩家尚未导出 skinId（等待皮肤数据接线）'],
    };
  }

  const missing = players
    .filter(
      (player) =>
        !Object.prototype.hasOwnProperty.call(player, 'skinId') ||
        typeof player.skinId !== 'string' ||
        player.skinId.trim().length === 0,
    )
    .map((player) => String(player?.id));
  if (missing.length > 0) {
    throw new Error(
      `getView() skinId 接线不完整；缺失或无效玩家: ${missing.join(', ')}`,
    );
  }

  return { status: 'pass', warnings: [] };
}

function inspectGloveVfx(gloves) {
  if (!Array.isArray(gloves)) {
    throw new Error('手套数据未导出数组 GLOVES');
  }

  const byId = new Map(gloves.map((glove) => [glove?.id, glove]));
  const missingGloves = EXPECTED_GLOVE_IDS.filter((id) => !byId.has(id));
  if (missingGloves.length > 0) {
    throw new Error(`GLOVES 缺少预期 gloveId: ${missingGloves.join(', ')}`);
  }

  const withAnyVfx = EXPECTED_GLOVE_IDS.filter((id) =>
    hasDescriptor(byId.get(id)?.vfx),
  );
  if (withAnyVfx.length === 0) {
    return {
      status: 'warn',
      describedGloves: 0,
      warnings: ['8 掌 vfx 描述数据尚未合入'],
    };
  }

  const incomplete = [];
  for (const id of EXPECTED_GLOVE_IDS) {
    const vfx = byId.get(id)?.vfx;
    const missingDescriptors = REQUIRED_VFX_DESCRIPTORS.filter(
      (descriptor) => !hasDescriptor(vfx?.[descriptor]),
    );
    if (missingDescriptors.length > 0) {
      incomplete.push(`${id}[${missingDescriptors.join('|')}]`);
    }
  }
  if (incomplete.length > 0) {
    throw new Error(
      `8 掌 vfx 描述接线不完整；缺失 slap/skill/hit: ${incomplete.join(', ')}`,
    );
  }

  return {
    status: 'pass',
    describedGloves: EXPECTED_GLOVE_IDS.length,
    warnings: [],
  };
}

function hasDescriptor(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value && typeof value === 'object' && Object.keys(value).length);
}
