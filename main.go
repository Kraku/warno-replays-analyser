package main

import (
	"context"
	"embed"
	"sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

var version = "v1.7.1"
var apiUrl string
var apiKey string
var steamApiKey string

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	ctx         context.Context
	watchedDirs map[string]struct{}
	mu          sync.Mutex
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.watchedDirs = make(map[string]struct{})

	sendAppInitEvent()
}

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "warno-replays-analyser (" + version + ")",
		Width:  1600,
		Height: 1024,
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
