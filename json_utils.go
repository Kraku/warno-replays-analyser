package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
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

type Warno struct {
	Game               Game              `json:"game"`
	LocalPlayerEugenId string            `json:"localPlayerEugenId"`
	LocalPlayerKey     string            `json:"localPlayerKey"`
	Players            map[string]Player `json:"players"`
	PlayerCount        int               `json:"playerCount"`
	Result             Result            `json:"result"`
}

type WarnoData struct {
	FileName  string `json:"fileName"`
	FilePath  string `json:"filePath"`
	Key       string `json:"key"`
	CreatedAt string `json:"createdAt"`
	Warno     Warno  `json:"warno"`
}

type KeyPlayerPair struct {
	Key    string
	Player Player
}

func extractJsons(data string) ([]map[string]any, error) {
	cleanedData := strings.ReplaceAll(data, "\n", "")

	gameRegex := regexp.MustCompile(`\{"game":.*?"ingamePlayerId":[0-99]\}`)
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

func mergeJsons(filePath string, jsons []map[string]any, fileInfo os.FileInfo) map[string]interface{} {
	fileName := filepath.Base(filePath)
	players := make(map[string]Player)
	var orderedPlayerSlice = []KeyPlayerPair{}
	ingamePlayerId := int(jsons[0]["ingamePlayerId"].(float64))
	var localPlayerEugenId string
	var localPlayerKey string

	for key, val := range jsons[0] {
		if strings.HasPrefix(key, "player_") {
			playerData, _ := json.Marshal(val)
			var player Player
			if err := json.Unmarshal(playerData, &player); err == nil {
				players[key] = player
				orderedPlayerSlice = append(orderedPlayerSlice, KeyPlayerPair{Key: key, Player: player})
			}
		}
	}

	if len(players) == 4 {
		sort.Slice(orderedPlayerSlice, func(i, j int) bool {
			playerNumerici, _ := strconv.Atoi(strings.TrimPrefix(orderedPlayerSlice[i].Key, "player_"))
			playerNumericj, _ := strconv.Atoi(strings.TrimPrefix(orderedPlayerSlice[j].Key, "player_"))
			return playerNumerici < playerNumericj
		})
	}

	var alliance0, alliance1 []KeyPlayerPair
	for _, keyPlayerPair := range orderedPlayerSlice {
		if keyPlayerPair.Player.PlayerAlliance == "0" {
			alliance0 = append(alliance0, keyPlayerPair)
		} else if keyPlayerPair.Player.PlayerAlliance == "1" {
			alliance1 = append(alliance1, keyPlayerPair)
		}
	}
	var orderedPlayers = append(alliance0, alliance1...)
	localPlayerEugenId = orderedPlayers[ingamePlayerId].Player.PlayerUserId
	localPlayerKey = orderedPlayers[ingamePlayerId].Key

	merged := WarnoData{
		FileName:  fileName,
		FilePath:  filePath,
		Key:       fileName,
		CreatedAt: fileInfo.ModTime().Format(time.RFC3339),
		Warno: Warno{
			Game: func() Game {
				gameData, _ := json.Marshal(jsons[0]["game"])
				var game Game
				_ = json.Unmarshal(gameData, &game)
				return game
			}(),
			LocalPlayerEugenId: localPlayerEugenId,
			LocalPlayerKey:     localPlayerKey,
			Result: func() Result {
				resultData, _ := json.Marshal(jsons[1]["result"])
				var result Result
				_ = json.Unmarshal(resultData, &result)
				return result
			}(),
			Players:     players,
			PlayerCount: len(players),
		},
	}

	mergedMap := make(map[string]interface{})
	mergedBytes, _ := json.Marshal(merged)
	_ = json.Unmarshal(mergedBytes, &mergedMap)

	return mergedMap
}
