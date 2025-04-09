package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

func readFilesFromDir(dir string) ([]os.DirEntry, error) {
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	log.Printf("Found %d files in directory: %s", len(files), dir)

	return files, nil
}

func readFileContent(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)

	if err != nil {
		return "", err
	}

	return string(content), nil
}

func getCacheDir(appName string, directory string) (string, error) {
	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData == "" {
		return "", fmt.Errorf("LOCALAPPDATA environment variable is not set")
	}

	cacheDir := filepath.Join(localAppData, appName, directory)
	if err := os.MkdirAll(cacheDir, os.ModePerm); err != nil {
		return "", err
	}

	return cacheDir, nil
}

func processFile(filePath string, result *sync.Map) error {
	fileInfo, err := os.Stat(filePath)
	if err != nil || fileInfo.IsDir() {
		return err
	}

	cacheDir, err := getCacheDir("warno-replays-analyser", "cache")
	if err != nil {
		return err
	}
	cacheFilePath := filepath.Join(cacheDir, filepath.Base(filePath)+".json")

	if _, err := os.Stat(cacheFilePath); err == nil {
		cachedContent, err := os.ReadFile(cacheFilePath)
		if err != nil {
			return err
		}

		var cachedData map[string]interface{}
		if err := json.Unmarshal(cachedContent, &cachedData); err != nil {
			return err
		}

		result.Store(filePath, cachedData)

		return nil
	}

	content, err := readFileContent(filePath)
	if err != nil {
		return err
	}

	if !strings.Contains(content, `"NbMaxPlayer":"2"`) || !strings.Contains(content, `"IsNetworkMode":"1"`) {
		return nil
	}

	jsons, err := extractJsons(content)
	if err != nil {
		return err
	}

	game := jsons[0]["game"].(map[string]interface{})
	if _, exists := game["WithHost"]; exists {
		return nil
	}
	if _, exists := game["ServerName"]; exists {
		return nil
	}

	merged := mergeJsons(filepath.Base(filePath), jsons, fileInfo)
	result.Store(filePath, merged)

	cachedData, err := json.Marshal(merged)
	if err != nil {
		return err
	}

	if err := os.WriteFile(cacheFilePath, cachedData, os.ModePerm); err != nil {
		return err
	}

	return nil
}
