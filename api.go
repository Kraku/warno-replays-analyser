package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type GetReplay struct {
	ID        uint      `json:"id"`
	Division  string    `json:"division"`
	EugenId   string    `json:"eugenId"`
	CreatedAt time.Time `json:"createdAt"`
	UserID    uint      `json:"userID"`
}

type RankedReplayInput struct {
	EugenID             *string    `json:"eugenId,omitempty"`
	Player1EugenID      uint       `json:"player1EugenId"`
	Player2EugenID      uint       `json:"player2EugenId"`
	Player1Elo          *int       `json:"player1Elo,omitempty"`
	Player1Rank         *int       `json:"player1Rank,omitempty"`
	Player2Elo          *int       `json:"player2Elo,omitempty"`
	Player2Rank         *int       `json:"player2Rank,omitempty"`
	Player1Name         string     `json:"player1Name"`
	Player2Name         string     `json:"player2Name"`
	Player1Division     int        `json:"player1Division"`
	Player2Division     int        `json:"player2Division"`
	Map                 string     `json:"map"`
	Duration            int        `json:"duration"`
	WinnerPlayerEugenID *uint      `json:"winnerPlayerEugenId"`
	SubmittedByEugenID  uint       `json:"submittedByEugenId"`
	PlayedAt            *time.Time `json:"playedAt,omitempty"`
}

type PostReplay struct {
	Division  string    `json:"division"`
	EugenId   string    `json:"eugenId"`
	CreatedAt time.Time `json:"createdAt"`
}

type PostUser struct {
	Usernames              []string     `json:"usernames"`
	Ranks                  []uint       `json:"ranks"`
	EugenId                uint         `json:"eugenId"`
	SteamId                string       `json:"steamId"`
	LastKnownRank          uint         `json:"lastKnownRank"`
	LastKnownRankCreatedAt time.Time    `json:"lastKnownRankCreatedAt"`
	OldestReplayCreatedAt  time.Time    `json:"oldestReplayCreatedAt"`
	Replays                []PostReplay `json:"replays,omitempty"`
}

type GetUser struct {
	Usernames              []string  `json:"usernames"`
	Ranks                  []uint    `json:"ranks"`
	EugenId                uint      `json:"eugenId"`
	SteamId                string    `json:"steamId"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
	LastKnownRank          uint      `json:"lastKnownRank"`
	LastKnownRankCreatedAt time.Time `json:"lastKnownRankCreatedAt"`
	OldestReplayCreatedAt  time.Time `json:"oldestReplayCreatedAt"`
}

type RankedReplaysAnalyticsResponse struct {
	TotalGames       int `json:"totalGames"`
	UniqueSubmitters int `json:"uniqueSubmitters"`

	Divisions       []DivisionWinrateRow   `json:"divisions"`
	DivisionVs      []DivisionVsGroup      `json:"divisionVs"`
	DivisionOnMap   []DivisionOnMapGroup   `json:"divisionOnMap"`
	DivisionOnMapVs []DivisionOnMapVsGroup `json:"divisionOnMapVs"`
}

type DivisionVsGroup struct {
	Division  int                       `json:"division"`
	Opponents []DivisionVsOpponentStats `json:"opponents"`
}

type DivisionVsOpponentStats struct {
	OpponentDivision int     `json:"opponentDivision"`
	Games            int     `json:"games"`
	NonDrawGames     int     `json:"nonDrawGames"`
	Wins             int     `json:"wins"`
	Losses           int     `json:"losses"`
	Draws            int     `json:"draws"`
	WinRate          float64 `json:"winRate"`
}

type DivisionOnMapGroup struct {
	Map       string               `json:"map"`
	Divisions []DivisionWinrateRow `json:"divisions"`
}

type DivisionOnMapVsGroup struct {
	Map       string                         `json:"map"`
	Divisions []DivisionOnMapVsDivisionGroup `json:"divisions"`
}

type DivisionOnMapVsDivisionGroup struct {
	Division  int                            `json:"division"`
	Opponents []DivisionOnMapVsOpponentStats `json:"opponents"`
}

type DivisionOnMapVsOpponentStats struct {
	OpponentDivision int     `json:"opponentDivision"`
	Games            int     `json:"games"`
	NonDrawGames     int     `json:"nonDrawGames"`
	Wins             int     `json:"wins"`
	Losses           int     `json:"losses"`
	Draws            int     `json:"draws"`
	WinRate          float64 `json:"winRate"`
}

type DivisionWinrateRow struct {
	Division     int     `json:"division"`
	Games        int     `json:"games"`
	NonDrawGames int     `json:"nonDrawGames"`
	Wins         int     `json:"wins"`
	Losses       int     `json:"losses"`
	Draws        int     `json:"draws"`
	WinRate      float64 `json:"winRate"`
}

type DivisionVsWinrateRow struct {
	Division         int     `json:"division"`
	OpponentDivision int     `json:"opponentDivision"`
	Games            int     `json:"games"`
	NonDrawGames     int     `json:"nonDrawGames"`
	Wins             int     `json:"wins"`
	Losses           int     `json:"losses"`
	Draws            int     `json:"draws"`
	WinRate          float64 `json:"winRate"`
}

type DivisionOnMapWinrateRow struct {
	Division     int     `json:"division"`
	Map          string  `json:"map"`
	Games        int     `json:"games"`
	NonDrawGames int     `json:"nonDrawGames"`
	Wins         int     `json:"wins"`
	Losses       int     `json:"losses"`
	Draws        int     `json:"draws"`
	WinRate      float64 `json:"winRate"`
}

type DivisionOnMapVsWinrateRow struct {
	Division         int     `json:"division"`
	OpponentDivision int     `json:"opponentDivision"`
	Map              string  `json:"map"`
	Games            int     `json:"games"`
	NonDrawGames     int     `json:"nonDrawGames"`
	Wins             int     `json:"wins"`
	Losses           int     `json:"losses"`
	Draws            int     `json:"draws"`
	WinRate          float64 `json:"winRate"`
}

func makeRequest(method, url string, body []byte, headers map[string]string) (*http.Response, error) {
	client := &http.Client{}
	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("error creating HTTP request: %v", err)
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending HTTP request: %v", err)
	}

	return resp, nil
}

func (a *App) SearchPlayerInApi(q string) []GetUser {
	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return []GetUser{}
	}

	query := fmt.Sprintf("%s?q=%s", apiUrl+"/players", q)

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
	}

	resp, err := makeRequest("GET", query, nil, headers)
	if err != nil {
		log.Println(err)
		return []GetUser{}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Error: received non-OK HTTP status: %d", resp.StatusCode)
		return []GetUser{}
	}

	var result []GetUser
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Error decoding response body: %v", err)
		return nil
	}

	return result
}

func (a *App) SendPlayersToAPI(users []PostUser) map[string]bool {
	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return map[string]bool{"success": false}
	}

	payload, err := json.Marshal(users)
	if err != nil {
		log.Printf("Error marshaling users: %v", err)
		return map[string]bool{"success": false}
	}

	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + apiKey,
	}

	resp, err := makeRequest("POST", apiUrl+"/players", payload, headers)
	if err != nil {
		log.Println(err)
		return map[string]bool{"success": false}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Error: received non-OK HTTP status: %d", resp.StatusCode)
		return map[string]bool{"success": false}
	}

	return map[string]bool{"success": true}
}

func (a *App) SendRankedReplaysToAPI(replays []RankedReplayInput) map[string]any {
	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return map[string]any{"success": false}
	}

	if len(replays) == 0 {
		return map[string]any{"success": true, "stored": 0}
	}

	payload, err := json.Marshal(replays)
	if err != nil {
		log.Printf("Error marshaling ranked replays: %v", err)
		return map[string]any{"success": false}
	}

	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + apiKey,
	}

	resp, err := makeRequest("POST", apiUrl+"/v2/ranked-replays", payload, headers)
	if err != nil {
		log.Println(err)
		return map[string]any{"success": false}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyText := string(bodyBytes)
		if bodyText != "" {
			log.Printf("Error: received non-OK HTTP status: %d body=%s", resp.StatusCode, bodyText)
		} else {
			log.Printf("Error: received non-OK HTTP status: %d", resp.StatusCode)
		}
		return map[string]any{"success": false, "status": resp.StatusCode, "body": bodyText}
	}

	var out any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return map[string]any{"success": true}
	}

	if m, ok := out.(map[string]any); ok {
		m["success"] = true
		return m
	}

	return map[string]any{"success": true, "data": out}
}

func (a *App) GetPlayerReplays(id string) []GetReplay {
	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return []GetReplay{}
	}

	query := fmt.Sprintf("%s/players/%s/replays", apiUrl, id)

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
	}

	resp, err := makeRequest("GET", query, nil, headers)
	if err != nil {
		log.Println(err)
		return []GetReplay{}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Error: received non-OK HTTP status: %d", resp.StatusCode)
		return []GetReplay{}
	}

	var result []GetReplay
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Error decoding response body: %v", err)
		return nil
	}

	return result
}

// GetRankedReplaysAnalytics fetches global ranked-replay analytics.
// Filters:
// - maxRank: when >0, limits to players with rank <= maxRank (e.g. 100 => top 100)
// - minElo:  when >0, limits to players with elo >= minElo
// Note: filter semantics depend on the remote API implementation.
func (a *App) GetRankedReplaysAnalytics(maxRank int, minElo int) RankedReplaysAnalyticsResponse {
	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return RankedReplaysAnalyticsResponse{}
	}

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
	}

	base := fmt.Sprintf("%s/v2/ranked-replays/analytics", apiUrl)
	parsed, parseErr := url.Parse(base)
	if parseErr != nil {
		log.Printf("GetRankedReplaysAnalytics parse failed url=%s err=%v", base, parseErr)
		return RankedReplaysAnalyticsResponse{}
	}

	q := parsed.Query()
	if maxRank > 0 {
		q.Set("maxRank", strconv.Itoa(maxRank))
	}
	if minElo > 0 {
		q.Set("minElo", strconv.Itoa(minElo))
	}
	parsed.RawQuery = q.Encode()
	finalURL := parsed.String()

	resp, err := makeRequest("GET", finalURL, nil, headers)
	if err != nil {
		log.Printf("GetRankedReplaysAnalytics request failed url=%s err=%v", finalURL, err)
		return RankedReplaysAnalyticsResponse{}
	}
	defer resp.Body.Close()

	bodyBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		log.Printf("GetRankedReplaysAnalytics read failed url=%s err=%v", finalURL, readErr)
		return RankedReplaysAnalyticsResponse{}
	}

	if resp.StatusCode != http.StatusOK {
		bodyText := string(bodyBytes)
		if len(bodyText) > 500 {
			bodyText = bodyText[:500] + "..."
		}
		log.Printf("GetRankedReplaysAnalytics non-OK url=%s status=%d body=%s", finalURL, resp.StatusCode, bodyText)
		return RankedReplaysAnalyticsResponse{}
	}

	var result RankedReplaysAnalyticsResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("GetRankedReplaysAnalytics decode failed url=%s err=%v", finalURL, err)
		return RankedReplaysAnalyticsResponse{}
	}

	log.Printf(
		"GetRankedReplaysAnalytics ok maxRank=%d minElo=%d totalGames=%d uniqueSubmitters=%d",
		maxRank,
		minElo,
		result.TotalGames,
		result.UniqueSubmitters,
	)

	return result
}
