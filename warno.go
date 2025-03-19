package main

import (
	"os"
	"path/filepath"
)

func findWarnoSaveFolders() (map[string]string, error) {
	steamPath, err := getSteamPath()
	if err != nil {
		return nil, err
	}

	userdataPath := filepath.Join(steamPath, "userdata")
	entries, err := os.ReadDir(userdataPath)
	if err != nil {
		return nil, err
	}

	warnoPaths := make(map[string]string)
	gameID := "1611600"

	// Iterate through each account ID folder inside userdata
	for _, entry := range entries {
		if entry.IsDir() {
			accountID := entry.Name()
			warnoPath := filepath.Join(userdataPath, accountID, gameID, "remote")

			// Check if the Warno save folder exists
			if _, err := os.Stat(warnoPath); err == nil {
				username, err := getSteamUsername(accountID, userdataPath)
				if err != nil {
					username = "Unknown"
				}
				warnoPaths[username] = warnoPath
			}
		}
	}

	return warnoPaths, nil
}
