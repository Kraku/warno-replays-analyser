package main

import (
	"encoding/json"
	"os"
	"regexp"
	"strings"
	"time"
)

type Player struct {
	PlayerAlliance         string `json:"PlayerAlliance"`
	PlayerAvatar           string `json:"PlayerAvatar"`
	PlayerDeckContent      string `json:"PlayerDeckContent"`
	PlayerElo              string `json:"PlayerElo"`
	PlayerIALevel          string `json:"PlayerIALevel"`
	PlayerIncomeRate       string `json:"PlayerIncomeRate"`
	PlayerIsEnteredInLobby string `json:"PlayerIsEnteredInLobby"`
	PlayerLevel            string `json:"PlayerLevel"`
	PlayerName             string `json:"PlayerName"`
	PlayerRank             string `json:"PlayerRank"`
	PlayerReady            string `json:"PlayerReady"`
	PlayerScoreLimit       string `json:"PlayerScoreLimit"`
	PlayerSkinIndexUsed    string `json:"PlayerSkinIndexUsed"`
	PlayerUserId           string `json:"PlayerUserId"`
}

type Game struct {
	CombatRule      string `json:"CombatRule"`
	DeploymentMode  string `json:"DeploymentMode"`
	GameMode        string `json:"GameMode"`
	GameType        string `json:"GameType"`
	IncomeRate      string `json:"IncomeRate"`
	InitMoney       string `json:"InitMoney"`
	IsNetworkMode   string `json:"IsNetworkMode"`
	Map             string `json:"Map"`
	ModList         string `json:"ModList"`
	ModTagList      string `json:"ModTagList"`
	NbMaxPlayer     string `json:"NbMaxPlayer"`
	Private         string `json:"Private"`
	ScoreLimit      string `json:"ScoreLimit"`
	Seed            string `json:"Seed"`
	TimeLimit       string `json:"TimeLimit"`
	UniqueSessionId string `json:"UniqueSessionId"`
	Version         string `json:"Version"`
}

type Result struct {
	Duration string `json:"Duration"`
	Victory  string `json:"Victory"`
}

type Players struct {
	Player1 Player `json:"player1"`
	Player2 Player `json:"player2"`
}

type Warno struct {
	Game           Game    `json:"game"`
	IngamePlayerId float64 `json:"ingamePlayerId"`
	Players        Players `json:"players"`
	Result         Result  `json:"result"`
}

type WarnoData struct {
	FileName  string `json:"fileName"`
	Key       string `json:"key"`
	CreatedAt string `json:"createdAt"`
	Warno     Warno  `json:"warno"`
}

func extractJsons(data string) ([]map[string]any, error) {
	cleanedData := strings.ReplaceAll(data, "\n", "")

	gameRegex := regexp.MustCompile(`\{"game":.*?"ingamePlayerId":[01]\}`)
	resultRegex := regexp.MustCompile(`\{"result":.*?\}\}`)

	gameMatch := gameRegex.FindString(cleanedData)
	resultMatch := resultRegex.FindString(cleanedData)

	var gameJson, resultJson map[string]any

	if err := json.Unmarshal([]byte(gameMatch), &gameJson); err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(resultMatch), &resultJson); err != nil {
		return nil, err
	}

	return []map[string]any{gameJson, resultJson}, nil
}

func mergeJsons(fileName string, jsons []map[string]any, fileInfo os.FileInfo) map[string]interface{} {
	merged := WarnoData{
		FileName:  fileName,
		Key:       fileName,
		CreatedAt: fileInfo.ModTime().Format(time.RFC3339),
		Warno: Warno{
			Game: func() Game {
				gameData, _ := json.Marshal(jsons[0]["game"])
				var game Game
				_ = json.Unmarshal(gameData, &game)
				return game
			}(),
			IngamePlayerId: jsons[0]["ingamePlayerId"].(float64),
			Result: func() Result {
				resultData, _ := json.Marshal(jsons[1]["result"])
				var result Result
				_ = json.Unmarshal(resultData, &result)
				return result
			}(),
			Players: struct {
				Player1 Player `json:"player1"`
				Player2 Player `json:"player2"`
			}{
				Player1: func() Player {
					playerData, _ := json.Marshal(jsons[0]["player_2"])
					var player Player
					_ = json.Unmarshal(playerData, &player)
					return player
				}(),
				Player2: func() Player {
					playerData, _ := json.Marshal(jsons[0]["player_4"])
					var player Player
					_ = json.Unmarshal(playerData, &player)
					return player
				}(),
			},
		},
	}

	mergedMap := make(map[string]interface{})
	mergedBytes, _ := json.Marshal(merged)
	_ = json.Unmarshal(mergedBytes, &mergedMap)

	return mergedMap
}
