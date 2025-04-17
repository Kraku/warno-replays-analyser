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

func getLocalAppDataDir(appName string, directory ...string) (string, error) {
	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData == "" {
		return "", fmt.Errorf("LOCALAPPDATA environment variable is not set")
	}

	cacheDir := filepath.Join(localAppData, appName)
	if len(directory) > 0 {
		cacheDir = filepath.Join(cacheDir, directory[0])
	}

	if err := os.MkdirAll(cacheDir, os.ModePerm); err != nil {
		return "", err
	}

	return cacheDir, nil
}

func writeEmptyCache(cacheFilePath string) error {
	emptyFile, err := os.Create(cacheFilePath)
	if err != nil {
		return err
	}
	defer emptyFile.Close()

	return nil
}

func processFile(filePath string, result *sync.Map) error {
	fileInfo, err := os.Stat(filePath)
	if err != nil || fileInfo.IsDir() {
		return err
	}

	cacheDir, err := getLocalAppDataDir("warno-replays-analyser", "cache")
	if err != nil {
		return err
	}
	cacheFilePath := filepath.Join(cacheDir, filepath.Base(filePath)+".json")

	if _, err := os.Stat(cacheFilePath); err == nil {
		cachedContent, err := os.ReadFile(cacheFilePath)
		if err != nil {
			return err
		}

		if len(cachedContent) == 0 {
			return nil
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
		return writeEmptyCache(cacheFilePath)
	}

	jsons, err := extractJsons(content)
	if err != nil {
		return err
	}

	game := jsons[0]["game"].(map[string]interface{})
	if _, exists := game["WithHost"]; exists {
		return writeEmptyCache(cacheFilePath)
	}
	if _, exists := game["ServerName"]; exists {
		return writeEmptyCache(cacheFilePath)
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
