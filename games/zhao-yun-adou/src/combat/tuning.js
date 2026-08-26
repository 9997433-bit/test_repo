/**
 * 战斗层「可调常量」的统一入口。
 *
 * 三层优先级：模块默认值 < data 表导出的同名覆盖 < 运行时 configureXxx()。
 *
 * data 表（src/data/**）不归战斗层维护，所以覆盖做成「可选导出」：表里没有
 * 对应导出时一切照旧；谁拥有 data 表，只要加一个同名导出对象就能改压力波 /
 * 射程这类常量，不必回来动战斗代码。
 *
 * 覆盖一律按默认值的键与类型过滤 —— 表里写错键名、写错类型或塞进 NaN，
 * 都会被丢弃而不是静默污染战斗常量。
 */

function isTable(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * 读一个可能不存在的导出。
 * 模块命名空间未必是普通对象：严格实现（含测试用的 mock 代理）读到没声明的
 * 导出会直接抛，所以这里探一手再取，取不到一律当「表里没写」。
 */
function readExport(source, name) {
  try {
    return name in source ? source[name] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 从模块命名空间里挑第一个存在的表导出（`import * as waves` 的结果直接传进来）。
 * @param {object} source 模块命名空间或普通对象
 * @param {string[]} names 按优先级排列的候选导出名
 */
export function tableFrom(source, names) {
  if (!isTable(source) || !Array.isArray(names)) return null;
  for (const name of names) {
    const table = readExport(source, name);
    if (isTable(table)) return table;
  }
  return null;
}

function absorb(target, patch, defaults, coerce) {
  if (!isTable(patch)) return target;
  for (const key of Object.keys(defaults)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const value = patch[key];
    if (typeof value !== typeof defaults[key]) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    target[key] = coerce[key] ? coerce[key](value) : value;
  }
  return target;
}

/**
 * @param {object}  opts.defaults 默认常量表，同时充当白名单与类型模板
 * @param {object?} opts.table    data 表提供的覆盖（可为 null）
 * @param {object?} opts.coerce   按键的收敛函数，例如把倍率夹到合法区间
 * @returns {{ live: object, read(): object, baseline(): object, patch(next: object): object, reset(): object }}
 *          `live` 是稳定引用，热循环可以直接读字段，不必每帧复制。
 */
export function createTuning({ defaults, table = null, coerce = {} }) {
  const base = absorb({ ...defaults }, table, defaults, coerce);
  const live = { ...base };
  return {
    live,
    read: () => ({ ...live }),
    baseline: () => ({ ...base }),
    patch(next) {
      absorb(live, next, defaults, coerce);
      return { ...live };
    },
    reset() {
      Object.assign(live, base);
      return { ...live };
    },
  };
}
