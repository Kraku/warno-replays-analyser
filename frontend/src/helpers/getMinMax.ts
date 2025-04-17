export const getMinMax = (arr: number[]): { min: number | null; max: number | null } =>
  arr.length ? { min: Math.min(...arr), max: Math.max(...arr) } : { min: null, max: null };
