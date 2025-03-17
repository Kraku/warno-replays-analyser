import { decodeDeckString } from "@izohek/warno-deck-utils";

const divisions = {
  9: "7th",
  10: "5th",
  11: "79th",
  12: "11Acr",
  13: "3rd",
  14: "8th",
  15: "BerlinCmd",
  17: "39th",
  19: "4th",
  20: "2nd",
  23: "35th",
  24: "82nd",
  25: "11e",
  26: "5e",
  27: "KDA",
  28: "TKS",
  29: "1st",
  30: "2ndUK",
  33: "UntZentrum",
  195: "119th",
  207: "27th",
  208: "24th",
};

export type Replay = {
  createdAt: string;
  fileName: string;
  result: "Victory" | "Defeat" | "Draw";
  division: string;
  enemyName: string;
  enemyDivision: string;
};

export const parser = (data: any): Replay[] => {
  return data.map((replay: any) => {
    const ingamePlayerId = String(replay.warno.ingamePlayerId);
    const playerKey =
      ingamePlayerId === String(replay.warno.players?.player1?.PlayerAlliance)
        ? "player1"
        : "player2";
    const enemyKey = playerKey === "player1" ? "player2" : "player1";

    return {
      createdAt: replay.createdAt,
      fileName: replay.fileName,
      result: ["4", "5"].includes(replay.warno.result.Victory)
        ? "Victory"
        : ["2"].includes(replay.warno.result.Victory)
        ? "Defeat"
        : "Draw",
      division:
        divisions[
          decodeDeckString(replay.warno.players?.[playerKey]?.PlayerDeckContent)
            .division.id as keyof typeof divisions
        ],
      enemyName: replay.warno.players[enemyKey].PlayerName,
      enemyDivision:
        divisions[
          decodeDeckString(replay.warno.players[enemyKey].PlayerDeckContent)
            .division.id as keyof typeof divisions
        ],
    };
  });
};
