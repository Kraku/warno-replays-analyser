package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type PostUser struct {
	Usernames              []string  `json:"usernames"`
	Ranks                  []uint    `json:"ranks"`
	EugenId                uint      `json:"eugenId"`
	LastKnownRank          uint      `json:"lastKnownRank"`
	LastKnownRankCreatedAt time.Time `json:"lastKnownRankCreatedAt"`
	OldestReplayCreatedAt  time.Time `json:"oldestReplayCreatedAt"`
}

type GetUser struct {
	Usernames              []string  `json:"usernames"`
	Ranks                  []uint    `json:"ranks"`
	EugenId                uint      `json:"eugenId"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
	LastKnownRank          uint      `json:"lastKnownRank"`
	LastKnownRankCreatedAt time.Time `json:"lastKnownRankCreatedAt"`
	OldestReplayCreatedAt  time.Time `json:"oldestReplayCreatedAt"`
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

func (a *App) SendUsersToAPI(users []PostUser) map[string]bool {
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
