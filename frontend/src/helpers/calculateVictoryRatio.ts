export const calculateVictoryRatio = (won: number, total: number): number => {
  return total === 0 ? 0 : (won / total) * 100;
};