const getDynamicK = (playerElo: number, opponentElo: number): number => {
  const eloDifference = Math.abs(playerElo - opponentElo);

  if (eloDifference > 100) {
    return 26;
  }

  if (eloDifference > 40) {
    return 25;
  }

  return 22;
};

export const expectedEloChange = (
  playerElo: number,
  opponentElo: number,
  result: 0 | 0.5 | 1
): number => {
  const k = getDynamicK(playerElo, opponentElo);

  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const eloChange = k * (result - expectedScore);

  return Math.round(eloChange * 100) / 100;
};
