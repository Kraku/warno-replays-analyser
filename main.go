package main

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	ctx context.Context
	DB  *sql.DB
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
	var wg sync.WaitGroup
	result := sync.Map{}
	fileChan := make(chan string, 100)

	numWorkers := runtime.NumCPU()

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for filePath := range fileChan {
				if err := processFile(filePath, &result); err != nil {
					log.Printf("Error processing file %s: %v", filePath, err)
				}
			}
		}()
	}

	for _, directory := range directories {
		dir, err := filepath.Abs(directory)
		if err != nil {
			log.Printf("Failed to get absolute path for directory %s: %v", directory, err)
			continue
		}

		log.Printf("Scanning directory: %s", dir)

		files, err := readFilesFromDir(dir)
		if err != nil {
			log.Printf("Error reading files from directory %s: %v", dir, err)
			continue
		}

		for _, file := range files {
			if file.IsDir() || strings.ToLower(filepath.Ext(file.Name())) != ".rpl3" {
				continue
			}
			fileChan <- filepath.Join(dir, file.Name())
		}
	}

	close(fileChan)
	wg.Wait()

	finalResult := []map[string]any{}
	result.Range(func(_, value any) bool {
		finalResult = append(finalResult, value.(map[string]any))
		return true
	})

	resultArray, err := json.MarshalIndent(finalResult, "", "  ")
	if err != nil {
		log.Printf("Error marshaling result to JSON: %v", err)
		return "[]"
	}

	return string(resultArray)
}

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "warno-replays-analyser (" + getAppVersion() + ")",
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
