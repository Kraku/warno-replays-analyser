package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type EugenRow struct {
	ID    string `json:"id"`
	Key   int    `json:"key"`
	Value string `json:"value"`
}

type EugenAPIResponse struct {
	TotalRows int        `json:"total_rows"`
	Offset    int        `json:"offset"`
	Rows      []EugenRow `json:"rows"`
}

type LeaderboardEntry struct {
	ID   int     `json:"id"`
	Elo  float64 `json:"elo"`
	Name string  `json:"name"`
}

func (a *App) GetLeaderboard() ([]LeaderboardEntry, error) {
	eugenResp, err := http.Get(eugenApiUrl + "/stats/_design/LB29/_view/freezed_ELO")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Eugen API: %w", err)
	}
	defer eugenResp.Body.Close()

	eugenBody, err := io.ReadAll(eugenResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Eugen response: %w", err)
	}

	var eugen EugenAPIResponse
	if err := json.Unmarshal(eugenBody, &eugen); err != nil {
		return nil, fmt.Errorf("failed to unmarshal Eugen API: %w", err)
	}

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
	}

	resp, err := makeRequest("GET", apiUrl+"/players", nil, headers)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to player API: %w", err)
	}
	defer resp.Body.Close()

	playerBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read player API response: %w", err)
	}

	var players []GetUser
	if err := json.Unmarshal(playerBody, &players); err != nil {
		return nil, fmt.Errorf("failed to unmarshal player API: %w", err)
	}

	playerMap := make(map[int]string)
	for _, p := range players {
		var nonEmptyNames []string
		for _, username := range p.Usernames {
			if username != "" {
				nonEmptyNames = append(nonEmptyNames, username)
			}
		}
		name := ""
		if len(nonEmptyNames) > 0 {
			name = strings.Join(nonEmptyNames, ", ")
		}
		playerMap[int(p.EugenId)] = name
	}

	var leaderboard []LeaderboardEntry
	for _, row := range eugen.Rows {
		parts := strings.Split(row.ID, "_")
		if len(parts) != 2 {
			continue
		}
		idNum, err := strconv.Atoi(parts[1])
		if err != nil {
			continue
		}
		elo, err := strconv.ParseFloat(row.Value, 64)
		if err != nil {
			continue
		}
		name, found := playerMap[idNum]
		if !found {
			name = "unknown"
		}
		leaderboard = append(leaderboard, LeaderboardEntry{
			ID:   idNum,
			Elo:  elo,
			Name: name,
		})
	}

	return leaderboard, nil
}
