package main

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

type PlayerGame struct {
	GameID          string   `json:"gameId"`
	Score           string   `json:"score"`
	Date            string   `json:"date"`
	Player          string   `json:"playerName"`
	Enemy           string   `json:"enemyName"`
	PlayerElo       []string `json:"playerElo"`
	EnemyElo        []string `json:"enemyElo"`
	PlayerEloChange string   `json:"playerEloChange"`
	EnemyEloChange  string   `json:"enemyEloChange"`
	Result          string   `json:"result"`
}

func (a *App) GetPlayerGameHistory(playerId string) []PlayerGame {
	return []PlayerGame{} // TODO: Remove when API is available again

	url := fmt.Sprintf("https://api.eugnet.com/gamehistory/list?userid=%v&page=0", playerId)
	fmt.Printf("Fetching URL: %s\n", url)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error fetching eugnet api: %v\n", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Received non-OK HTTP status: %s\n", resp.Status)
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		return nil
	}

	entries := extractGameEntries(string(body), 10)
	fmt.Printf("Extracted %d entries\n", len(entries))

	if len(entries) == 0 {
		fmt.Println("No more entries found, stopping.")
		return nil
	}

	for i := range entries {
		if entries[i].Player != "" && entries[i].Enemy != "" &&
			len(entries[i].PlayerElo) == 2 && len(entries[i].EnemyElo) == 2 {
			fmt.Printf("Skipping game details fetch for GameID %s (Player/Enemy already set)\n", entries[i].GameID)
			continue
		}

		gameID := entries[i].GameID
		url := fmt.Sprintf("https://api.eugnet.com/gamehistory/game?gameid=%s", gameID)

		fmt.Printf("Fetching game details for GameID: %s\n", gameID)
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("Error fetching game details for GameID %s: %v\n", gameID, err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			fmt.Printf("Received non-OK HTTP status for GameID %s: %s\n", gameID, resp.Status)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf("Error reading game details response for GameID %s: %v\n", gameID, err)
			continue
		}

		playerName, enemyName, playerElo, enemyElo, playerEloChange, enemyEloChange := extractPlayerAndEnemyData(string(body), entries[i].Result)

		if playerName != "" && enemyName != "" {
			entries[i].Player = playerName
			entries[i].Enemy = enemyName
			entries[i].PlayerElo = []string{
				playerElo,
				addStrings(playerElo, playerEloChange),
			}
			entries[i].EnemyElo = []string{
				enemyElo,
				addStrings(enemyElo, enemyEloChange),
			}
			entries[i].PlayerEloChange = playerEloChange
			entries[i].EnemyEloChange = enemyEloChange
		}
	}

	return entries
}

func extractGameEntries(data string, max int) []PlayerGame {
	var entries []PlayerGame

	gameIDRe := regexp.MustCompile(`gameid=([a-f0-9]{32})`)
	scoreRe := regexp.MustCompile(`\(\d+/\d+(?: (-?\d*\.\d+))?\)`)
	timeRe := regexp.MustCompile(`myDate=new Date\((\d+\.\d+)\)`)
	fuldaRe := regexp.MustCompile(`fulda`)

	fuldas := fuldaRe.FindAllStringSubmatch(data, -1)
	gameIDs := gameIDRe.FindAllStringSubmatch(data, -1)
	scores := scoreRe.FindAllStringSubmatch(data, -1)
	times := timeRe.FindAllStringSubmatch(data, -1)

	fmt.Printf("Found %d gameids, %d scores, and %d times\n", len(gameIDs), len(scores), len(times))

	for i := 0; i < len(gameIDs) && i < max; i++ {
		if i >= len(scores) || scores[i][1] == "" {
			continue
		}

		if len(fuldas) > 0 && len(fuldas[i]) > 1 && fuldas[i][1] == "" {
			fmt.Printf("Skipping game %s due to 'fulda' match\n", gameIDs[i][1])
			continue
		}

		score := scores[i][1]
		dateStr := ""
		if i < len(times) {
			timestamp, err := parseTimestamp(times[i][1])
			if err == nil {
				dateStr = timestamp
			} else {
				fmt.Printf("Error parsing timestamp: %v\n", err)
			}
		}

		result := "victory"
		if score[0] == '-' {
			result = "defeat"
		}

		entry := PlayerGame{
			GameID: gameIDs[i][1],
			Score:  score,
			Result: result,
			Date:   dateStr,
		}

		entries = append(entries, entry)
	}

	return entries
}

func extractPlayerAndEnemyData(data string, result string) (playerName, enemyName, playerElo, enemyElo, playerEloChange, enemyEloChange string) {
	playerNameRe := regexp.MustCompile(`<span class="name">(.*?)</span>`)
	eloChangeRe := regexp.MustCompile(`<td>([-+]?[\d]+)</td>`)

	playerMatches := playerNameRe.FindAllStringSubmatch(data, -1)
	eloChangeMatches := eloChangeRe.FindAllStringSubmatch(data, -1)

	if len(playerMatches) < 2 || len(eloChangeMatches) < 4 {
		return "", "", "", "", "", ""
	}

	player1Name := playerMatches[0][1]
	player2Name := playerMatches[1][1]

	player1Elo := eloChangeMatches[2][1]
	player1EloChange := eloChangeMatches[3][1]
	player2Elo := eloChangeMatches[0][1]
	player2EloChange := eloChangeMatches[1][1]

	if result == "victory" {
		if player1EloChange[0] == '-' {
			playerName, enemyName = player1Name, player2Name
			playerElo, enemyElo = player2Elo, player1Elo
			playerEloChange, enemyEloChange = player2EloChange, player1EloChange
		} else {
			playerName, enemyName = player2Name, player1Name
			playerElo, enemyElo = player1Elo, player2Elo
			playerEloChange, enemyEloChange = player1EloChange, player2EloChange
		}
	} else if result == "defeat" {
		if player1EloChange[0] == '+' {
			playerName, enemyName = player1Name, player2Name
			playerElo, enemyElo = player2Elo, player1Elo
			playerEloChange, enemyEloChange = player2EloChange, player1EloChange
		} else {
			playerName, enemyName = player2Name, player1Name
			playerElo, enemyElo = player1Elo, player2Elo
			playerEloChange, enemyEloChange = player1EloChange, player2EloChange
		}
	}

	return playerName, enemyName, playerElo, enemyElo, playerEloChange, enemyEloChange
}

func parseTimestamp(timestampStr string) (string, error) {
	timestamp, err := strconv.ParseFloat(timestampStr, 64)
	if err != nil {
		return "", err
	}

	t := time.Unix(int64(timestamp/1000), 0)
	return t.Format(time.RFC3339), nil
}

func addStrings(base, delta string) string {
	baseInt, err1 := strconv.Atoi(base)
	deltaInt, err2 := strconv.Atoi(delta)
	if err1 != nil || err2 != nil {
		return base
	}
	return strconv.Itoa(baseInt + deltaInt)
}
