package main

import (
	"encoding/json"
	"os"
	"regexp"
	"strings"
)

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

func mergeJsons(fileName string, jsons []map[string]any, fileInfo os.FileInfo) map[string]any {
	merged := map[string]any{
		"fileName":  fileName,
		"key":       fileName,
		"createdAt": fileInfo.ModTime(),
		"warno": map[string]any{
			"game":           jsons[0]["game"],
			"result":         jsons[1]["result"],
			"ingamePlayerId": jsons[0]["ingamePlayerId"],
			"players": map[string]any{
				"player1": jsons[0]["player_2"],
				"player2": jsons[0]["player_4"],
			},
		},
	}

	return merged
}
