package main

import (
	"encoding/json"
	"os"
	"regexp"
	"strings"
	"time"
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

func extractTimestampFromFilename(fileName string) (time.Time, error) {
	re := regexp.MustCompile(`replay_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.rpl3`)
	matches := re.FindStringSubmatch(fileName)
	if len(matches) < 3 {
		return time.Time{}, os.ErrInvalid
	}

	dateTimeStr := matches[1] + " " + strings.ReplaceAll(matches[2], "-", ":")

	return time.Parse("2006-01-02 15:04:05", dateTimeStr)
}

func mergeJsons(fileName string, jsons []map[string]any) (map[string]any, error) {
	createdAt, err := extractTimestampFromFilename(fileName)
	if err != nil {
		return nil, err
	}

	merged := map[string]any{
		"fileName":  fileName,
		"key":       fileName,
		"createdAt": createdAt,
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

	return merged, nil
}
