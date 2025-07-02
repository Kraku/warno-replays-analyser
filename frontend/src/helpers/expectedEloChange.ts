export const expectedEloChange = (
  playerElo: number,
  opponentElo: number,
  result: 0 | 0.5 | 1,
  k: number = 20
): number => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const eloChange = k * (result - expectedScore);

  return Math.round(eloChange * 100) / 100;
};
