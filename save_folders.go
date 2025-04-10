package main

import (
	"encoding/json"
	"log"
)

func (a *App) GetWarnoSaveFolders() string {
	warnoPaths, err := findWarnoSaveFolders()
	if err != nil {
		log.Println("Error:", err)
		return "[]"
	}

	if len(warnoPaths) == 0 {
		log.Println("No Warno save folders found.")
	} else {
		log.Println("Found Warno save folders:")
		for _, path := range warnoPaths {
			log.Println(path)
		}
	}

	warnoPathsJson, err := json.Marshal(warnoPaths)
	if err != nil {
		log.Println("Error marshaling warnoPaths to JSON:", err)
		return "[]"
	}

	return string(warnoPathsJson)
}
