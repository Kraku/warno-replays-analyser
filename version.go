package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
)

func (a *App) GetAppVersions() []string {
	latestVersion := ""

	resp, err := http.Get("https://api.github.com/repos/Kraku/warno-replays-analyser/releases/latest")
	if err != nil {
		log.Printf("Error fetching latest version: %v", err)
	} else {
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Error reading response body: %v", err)
		} else {
			var result map[string]any
			if err := json.Unmarshal(body, &result); err != nil {
				log.Printf("Error unmarshaling JSON: %v", err)
			} else if tagName, ok := result["tag_name"].(string); ok {
				latestVersion = tagName
			}
		}
	}

	return []string{version, latestVersion}
}
