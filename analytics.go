package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type AnalyticsPayload struct {
	AppID   string `json:"app_id"`
	Version string `json:"version"`
	Event   string `json:"event"`
}

func getOrCreateAppId() string {
	settingsDir, err := getLocalAppDataDir("warno-replays-analyser")
	if err != nil {
		fmt.Printf("Failed to get cache directory: %v\n", err)
		return ""
	}
	idPath := fmt.Sprintf("%s/id.bin", settingsDir)

	if data, err := os.ReadFile(idPath); err == nil && len(data) == 16 {
		id, err := uuid.FromBytes(data)
		if err == nil {
			return id.String()
		}
	}

	id := uuid.New()
	err = os.MkdirAll(filepath.Dir(idPath), os.ModePerm)
	if err != nil {
		fmt.Printf("Failed to create directory: %v\n", err)
		return ""
	}

	err = os.WriteFile(idPath, id[:], 0644)
	if err != nil {
		fmt.Printf("Failed to write UUID file: %v\n", err)
		return ""
	}

	return id.String()
}

func sendAppInitEvent() {
	appID := getOrCreateAppId()

	if apiUrl == "" || apiKey == "" {
		log.Println("Error: API_URL or API_KEY is not set")
		return
	}

	payload := AnalyticsPayload{
		AppID:   appID,
		Version: version,
		Event:   "init",
	}

	data, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("Failed to marshal analytics payload: %v\n", err)
		return
	}

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
		"Content-Type":  "application/json",
	}

	resp, err := makeRequest("POST", apiUrl+"/analytics", data, headers)
	if err != nil {
		fmt.Printf("Failed to send analytics event: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Unexpected response status: %v\n", resp.Status)
	}
}
