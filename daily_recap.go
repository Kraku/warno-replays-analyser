package main

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

type DailyRecap struct {
	EloChange   int `json:"eloChange"`
	GamesPlayed int `json:"gamesPlayed"`
	Wins        int `json:"wins"`
	Losses      int `json:"losses"`
}

func (a *App) GetDailyRecap(playerId string) DailyRecap {
	return DailyRecap{} // TODO: Remove when API is available again

	url := fmt.Sprintf("https://api.eugnet.com/gamehistory/list?userid=%v&page=0", playerId)
	fmt.Printf("Fetching URL: %s\n", url)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error fetching eugnet api: %v\n", err)
		return DailyRecap{}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Received non-OK HTTP status: %s\n", resp.Status)
		return DailyRecap{}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		return DailyRecap{}
	}

	entries := extractGameEntries(string(body), 50)
	fmt.Printf("Extracted %d entries\n", len(entries))

	if len(entries) == 0 {
		fmt.Println("DailyRecap more entries found, stopping.")
		return DailyRecap{}
	}

	const layoutISO = "2006-01-02"

	today := time.Now().Format(layoutISO)

	var summary DailyRecap
	for _, entry := range entries {
		entryDate, err := time.Parse(layoutISO, entry.Date[:10])
		if err != nil {
			fmt.Printf("Error parsing entry date: %v\n", err)
			continue
		}

		if entryDate.Format(layoutISO) != today {
			break
		}

		summary.GamesPlayed++
		if entry.Result == "victory" {
			summary.Wins++
		} else {
			summary.Losses++
		}

		score, err := strconv.ParseFloat(entry.Score, 64)
		if err != nil {
			fmt.Printf("Error converting score to float: %v\n", err)
			continue
		}
		summary.EloChange += int(score)
	}

	return summary
}
