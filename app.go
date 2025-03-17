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
	return os.ReadDir(dir)
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

func (a *App) Analyse(name string) string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Failed to get user home directory: %v", err)
	}

	dir, err := filepath.Abs(filepath.Join(homeDir, "Downloads/replay_2025-03-16_13-40-49"))
	if err != nil {
		log.Fatalf("Failed to get directory: %v", err)
	}

	files, err := readFilesFromDir(dir)
	if err != nil {
		log.Fatalf("Failed to read directory: %v", err)
	}

	var result []map[string]any

	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".rpl3" {
			continue
		}

		filePath := filepath.Join(dir, file.Name())
		content, err := readFileContent(filePath)
		if err != nil {
			log.Printf("Failed to read file %s: %v", file.Name(), err)
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
		}

		game := jsons[0]["game"].(map[string]any)
		if game["NbMaxPlayer"].(string) != "2" || game["IsNetworkMode"].(string) != "1" {
			continue
		}

		if _, exists := game["WithHost"]; exists {
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
		log.Fatalf("Error marshaling result to JSON: %v", err)
	}

	return string(resultArray)
}
