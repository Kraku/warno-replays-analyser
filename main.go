package main

import (
	"context"
	"embed"
	"encoding/json"
	"log"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

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

func (a *App) Analyse(directories []string) string {
	var result []map[string]any

	for _, directory := range directories {
		dir, err := filepath.Abs(directory)
		if err != nil {
			log.Printf("Failed to get directory: %v", err)
			continue
		}

		log.Printf("Scanning directory: %s", dir)

		files, err := readFilesFromDir(dir)
		if err != nil {
			log.Printf("Failed to read directory: %v", err)
			continue
		}

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

			if !strings.Contains(content, `"NbMaxPlayer":"2"`) || !strings.Contains(content, `"IsNetworkMode":"1"`) {
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

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "warno-replays-analyser",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
