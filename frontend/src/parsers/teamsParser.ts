import { calculateVictoryRatio } from "../helpers/calculateVictoryRatio";
import { Replay2v2 } from "./replaysParser";

export type TeamHistory = {
  filePath: string;
  result: 'Victory' | 'Defeat' | 'Draw';
  division: string;
  allyName: string;
  allyDivision: string;
  enemy1Name: string;
  enemy1Division: string;
  enemy1Deck: string;
  enemy2Name: string;
  enemy2Division: string;
  enemy2Deck: string;
  createdAt: string;
  duration: number;
  map: string;
}

export type Team = {
  player1Id: string;
  player2Id: string;
  history: TeamHistory[];
  getGamesCount: () => number;
  getVictoryRatio: () => number;
}

const getMostCommonName = (names: string[]): string => {
  const nameCount: Record<string, number> = {};
  for (const name of names) {
    nameCount[name] = (nameCount[name] || 0) + 1;
  }
  return Object.entries(nameCount).reduce((mostCommon, current) => {
    return current[1] > nameCount[mostCommon[0]] ? current : mostCommon;
  })[0];
};

const createTeamHistory = (replay: Replay2v2): TeamHistory => ({
  filePath: replay.filePath,
  result: replay.result,
  division: replay.division,
  allyName: replay.allyData.playerName,
  allyDivision: replay.allyData.playerDivision,
  enemy1Name: replay.enemiesData[0].playerName,
  enemy1Division: replay.enemiesData[0].playerDivision,
  enemy1Deck: replay.enemiesData[0].playerDeck,
  enemy2Name: replay.enemiesData[1].playerName,
  enemy2Division: replay.enemiesData[1].playerDivision,
  enemy2Deck: replay.enemiesData[1].playerDeck,
  createdAt: replay.createdAt,
  duration: replay.duration,
  map: replay.map
});

const createNewTeam = (replay: Replay2v2): Team => ({
  player1Id: replay.enemiesData[0].playerId,
  player2Id: replay.enemiesData[1].playerId,
  history: [createTeamHistory(replay)],
  getGamesCount() { return this.history.length; },
  getVictoryRatio() { return calculateVictoryRatio(this.history.filter(h => h.result === 'Victory').length, this.history.length); },
});

export const teamsParser = (replays: Replay2v2[]): Team[] => {
  const teamsMap: Map<string, Team> = new Map();

  replays.forEach((replay) => {
    const sortedEnemies = replay.enemiesData;
    sortedEnemies.sort((enemy1, enemy2) => enemy1.playerId.localeCompare(enemy2.playerId));
    const teamCompositeKey = JSON.stringify([sortedEnemies[0].playerId, sortedEnemies[1].playerId]);
    const existingTeam = teamsMap.get(teamCompositeKey);

    if (existingTeam) {
      existingTeam.history.push(createTeamHistory(replay));
    } else {
      const newTeam = createNewTeam(replay);
      teamsMap.set(teamCompositeKey, newTeam);
    }
  });

  return Array.from(teamsMap.values());
};