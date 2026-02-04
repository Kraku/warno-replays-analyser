type KRule = {
  diffMin: number;
  k: number;
};

const DEFAULT_K_RULES: KRule[] = [
  { diffMin: 0, k: 22 },
  { diffMin: 40, k: 25 },
  { diffMin: 160, k: 26 }
];

const getDynamicK = (playerElo: number, opponentElo: number, rules = DEFAULT_K_RULES): number => {
  const eloDifference = Math.abs(playerElo - opponentElo);

  let selectedK = rules[0]?.k ?? 22;
  for (const rule of rules) {
    if (eloDifference >= rule.diffMin) {
      selectedK = rule.k;
    }
  }

  return selectedK;
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
