package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func extractJsons(data string) ([]map[string]any, error) {
	cleanedData := strings.ReplaceAll(data, "\n", "")

	gameRegex := regexp.MustCompile(`\{"game":.*?"ingamePlayerId":[01]\}`)
	resultRegex := regexp.MustCompile(`\{"result":.*?\}\}`)

	gameMatch := gameRegex.FindString(cleanedData)
	resultMatch := resultRegex.FindString(cleanedData)

	var gameJson, resultJson map[string]any

	if err := json.Unmarshal([]byte(gameMatch), &gameJson); err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(resultMatch), &resultJson); err != nil {
		return nil, err
	}

	return []map[string]any{gameJson, resultJson}, nil
}

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

func getFileInfo(file os.DirEntry) (os.FileInfo, error) {
	return file.Info()
}

func mergeJsons(fileName string, jsons []map[string]any, fileInfo os.FileInfo) map[string]any {
	merged := map[string]any{
		"fileName":  fileName,
		"key":       fileName,
		"createdAt": fileInfo.ModTime(),
		"warno": map[string]any{
			"game":           jsons[0]["game"],
			"result":         jsons[1]["result"],
			"ingamePlayerId": jsons[0]["ingamePlayerId"],
			"players": map[string]any{
				"player1": jsons[0]["player_2"],
				"player2": jsons[0]["player_4"],
			},
		},
	}

	return merged
}

func (a *App) Analyse(directory string) string {
	dir, err := filepath.Abs(directory)

	log.Printf("Scanning directory: %s", dir)

	if err != nil {
		log.Printf("Failed to get directory: %v", err)
		return "[]"
	}

	files, err := readFilesFromDir(dir)
	if err != nil {
		log.Printf("Failed to read directory: %v", err)
		return "[]"
	}

	var result []map[string]any

	for _, file := range files {
		if file.IsDir() || strings.ToLower(filepath.Ext(file.Name())) != ".rpl3" {
			continue
		}

		filePath := filepath.Join(dir, file.Name())
		content, err := readFileContent(filePath)
		if err != nil {
			log.Printf("Failed to read file %s: %v", file.Name(), err)
			continue
		}

		if !strings.Contains(content, `"NbMaxPlayer":"2"`) {
			continue
		}

		if !strings.Contains(content, `"IsNetworkMode":"1"`) {
			continue
		}

		jsons, err := extractJsons(content)
		if err != nil {
			log.Printf("Error extracting JSONs from %s: %v", file.Name(), err)
			continue
		}

		fileInfo, err := getFileInfo(file)
		if err != nil {
			log.Printf("Failed to get file info for %s: %v", file.Name(), err)
			continue
		}

		game := jsons[0]["game"].(map[string]any)
		if _, exists := game["WithHost"]; exists {
			continue
		}

		if _, exists := game["ServerName"]; exists {
			continue
		}

		merged := mergeJsons(file.Name(), jsons, fileInfo)
		result = append(result, merged)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[j]["createdAt"].(time.Time).Before(result[i]["createdAt"].(time.Time))
	})

	resultArray, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		log.Printf("Error marshaling result to JSON: %v", err)
		return "[]"
	}

	log.Printf("Result: %s", string(resultArray))

	return string(resultArray)
}
