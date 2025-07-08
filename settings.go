package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type DateRange struct {
	From *string `json:"from,omitempty"`
	To   *string `json:"to,omitempty"`
}

type Settings struct {
	PlayerIds                 []string `json:"playerIds,omitempty"`
	DateRangeFrom             string   `json:"dateRangeFrom,omitempty"`
	DateRangeTo               string   `json:"dateRangeTo,omitempty"`
	DailyRecapUser            string   `json:"dailyRecapUser,omitempty"`
	PlayerInfoSharingDisabled bool     `json:"playerInfoSharingDisabled,omitempty"`
	GameMode                  string   `json:"gameMode,omitempty"`
}

type PlayerIdsOption struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

func getSettingsFilePath() (string, error) {
	settingsDir, err := getLocalAppDataDir("warno-replays-analyser")
	if err != nil {
		return "", fmt.Errorf("failed to get cache directory: %w", err)
	}

	settingsFilePath := fmt.Sprintf("%s/settings.json", settingsDir)

	return settingsFilePath, nil
}

func (a *App) GetSettings() (Settings, error) {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get settings file path: %w", err)
	}

	f, err := os.Open(settingsFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return Settings{}, nil
		}
		return Settings{}, fmt.Errorf("failed to open settings file: %w", err)
	}
	defer f.Close()

	var settings Settings
	if err := json.NewDecoder(f).Decode(&settings); err != nil {
		fmt.Printf("failed to decode settings, returning default settings: %v\n", err)
		return Settings{}, nil
	}

	return settings, nil
}

func (a *App) SaveSettings(settings Settings) {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		fmt.Printf("failed to get settings file path: %v\n", err)
	}

	settingsJSON, err := json.Marshal(settings)
	if err != nil {
		fmt.Printf("failed to marshal settings: %v", err)
	}

	err = os.WriteFile(settingsFilePath, settingsJSON, 0644)
	if err != nil {
		fmt.Printf("failed to write settings to file: %v", err)
	}
}

func (a *App) GetPlayerIdsOptions() []PlayerIdsOption {
	saveFolders, err := findWarnoSaveFolders()
	if err != nil {
		fmt.Printf("failed to find Warno save folders: %v\n", err)
		return nil
	}

	var folderKeys []string
	for _, value := range saveFolders {
		folderKeys = append(folderKeys, value)
	}

	replays := getReplays(folderKeys)

	var options []PlayerIdsOption
	playerMap := make(map[string]string)
	for _, replay := range replays {
		var player = replay.Warno.Players[replay.Warno.LocalPlayerKey]

		if existingNames, exists := playerMap[player.PlayerUserId]; exists {
			nameSet := make(map[string]struct{})
			for _, name := range append(strings.Split(existingNames, ", "), player.PlayerName) {
				nameSet[name] = struct{}{}
			}

			var uniqueNames []string
			for name := range nameSet {
				uniqueNames = append(uniqueNames, name)
			}

			playerMap[player.PlayerUserId] = strings.Join(uniqueNames, ", ")
		} else {
			playerMap[player.PlayerUserId] = player.PlayerName
		}
	}

	for userId, names := range playerMap {
		options = append(options, PlayerIdsOption{
			Label: names,
			Value: userId,
		})
	}

	return options
}
