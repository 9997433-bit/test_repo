export const TRAJECTORY_TYPES = Object.freeze([
  "line",
  "curve",
  "circle",
  "zigzag",
  "spiral",
  "cloud",
]);

const GENERATORS = {
  line: () => Array.from({ length: 64 }, (_, i) => ({
    x: 20 + i * 4,
    y: 40 + i * 0.1,
  })),
  curve: () => Array.from({ length: 64 }, (_, i) => {
    const progress = i / 63;
    return {
      x: 20 + progress * 220,
      y: 120 + Math.sin(progress * Math.PI * 2.5) * 80,
    };
  }),
  circle: () => Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 79) * Math.PI * 2;
    return {
      x: 120 + Math.cos(angle) * 55,
      y: 120 + Math.sin(angle) * 55,
    };
  }),
  zigzag: () => Array.from({ length: 48 }, (_, i) => ({
    x: 20 + i * 5,
    y: 100 + (i % 2 ? 45 : -45),
  })),
  spiral: () => Array.from({ length: 80 }, (_, i) => {
    const progress = i / 79;
    const angle = progress * Math.PI * 7;
    const radius = progress * 180;
    return {
      x: 120 + Math.cos(angle) * radius,
      y: 120 + Math.sin(angle) * radius,
    };
  }),
  cloud: createCloud,
};

export function generateTrajectory(type, variant = 0) {
  const generate = GENERATORS[type];
  if (!generate) throw new Error(`Unknown trajectory type: ${type}`);

  const normalizedVariant = Number.isFinite(variant) ? Math.trunc(variant) : 0;
  const offsetX = positiveModulo(normalizedVariant * 17, 13) - 6;
  const offsetY = positiveModulo(normalizedVariant * 23, 11) - 5;
  const timeStep = 10 + positiveModulo(normalizedVariant, 5);

  return generate().map(({ x, y }, i) => ({
    x: x + offsetX,
    y: y + offsetY,
    t: i * timeStep,
  }));
}

function createCloud() {
  const random = createRandom(5599);
  const count = 12 + Math.floor(random() * 80);
  const points = [];
  let x = 120;
  let y = 120;
  let direction = random() * 6.28;

  for (let i = 0; i < count - 1; i += 1) {
    direction += (random() - 0.5) * 2.4;
    const distance = 5 + random() * 30;
    x += Math.cos(direction) * distance;
    y += Math.sin(direction) * distance;
    points.push({ x, y });
  }

  points.push({ ...points[0] });
  return points;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
