export function isGloveUnlockedForTest(gloveId, progress = {}) {
  if (gloveId === "cotton") return true;

  const unlocked = progress?.unlocked;
  if (unlocked instanceof Set) return unlocked.has(gloveId);
  if (Array.isArray(unlocked)) return unlocked.includes(gloveId);
  return unlocked?.[gloveId] === true;
}
