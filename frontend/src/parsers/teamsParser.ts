import { calculateVictoryRatio } from "../helpers/calculateVictoryRatio";
import { Replay2v2 } from "./replaysParser";

export type TeamHistory = {
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
  player1Names: string[];
  player2Names: string[];
  history: TeamHistory[];
  getPlayer1CommonName: () => string;
  getPlayer2CommonName: () => string;
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
  player1Names: [replay.enemiesData[0].playerName],
  player2Names: [replay.enemiesData[1].playerName],
  history: [createTeamHistory(replay)],
  getPlayer1CommonName() { return getMostCommonName(this.player1Names); },
  getPlayer2CommonName() { return getMostCommonName(this.player2Names); },
  getGamesCount() { return this.history.length; },
  getVictoryRatio() {
    return calculateVictoryRatio(this.history.filter(h => h.result === 'Victory').length, this.history.length);
  }
});

const updateTeam = (existingTeam: Team, replay: Replay2v2): void => {
  if (!existingTeam.player1Names.includes(replay.enemiesData[0].playerName)) {
    existingTeam.player1Names.push(replay.enemiesData[0].playerName);
  }

  if (!existingTeam.player2Names.includes(replay.enemiesData[1].playerName)) {
    existingTeam.player2Names.push(replay.enemiesData[1].playerName);
  }

  existingTeam.history.push(createTeamHistory(replay));
};

export const teamsParser = (replays: Replay2v2[]): Team[] => {
  const teamsMap: Map<string, Team> = new Map();

  replays.forEach((replay) => {
    const sortedEnemies = replay.enemiesData;
    sortedEnemies.sort((enemy1, enemy2) => enemy1.playerId.localeCompare(enemy2.playerId));
    const teamCompositeKey = JSON.stringify([sortedEnemies[0].playerId, sortedEnemies[1].playerId]);
    const existingTeam = teamsMap.get(teamCompositeKey);

    if (existingTeam) {
      updateTeam(existingTeam, replay);
    } else {
      const newTeam = createNewTeam(replay);
      teamsMap.set(teamCompositeKey, newTeam);
    }
  });

  return Array.from(teamsMap.values());
};

export const getPlayerIdCommonNameMap = (replays: Replay2v2[]): Map<string, string> => {
  const idNamesMap: Map<string, string> = new Map();
  const usedNamesMaps: Map<string, string[]> = new Map();
  replays.forEach((replay) => {
    [...replay.enemiesData, replay.allyData].forEach((player) => {
      const existingPlayer = usedNamesMaps.get(player.playerId);
      if (existingPlayer) {
        existingPlayer.push(player.playerName);
      } else {
        usedNamesMaps.set(player.playerId, [player.playerName]);
      }
    })
  })

  usedNamesMaps.forEach((names, playerId) => {
    const nameCounts: Record<string, number> = {};
    names.forEach((name) => {
      nameCounts[name] = (nameCounts[name] ?? 0) + 1;
    })
    const mostCommon = Object.entries(nameCounts).reduce((accu, curr) => accu[1] > curr[1] ? accu : curr);
    idNamesMap.set(playerId, mostCommon[0]);
  })

  return idNamesMap;
}