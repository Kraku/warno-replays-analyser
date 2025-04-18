package main

import (
	"context"
	"database/sql"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

var version = "v1.3.1"

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

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "warno-replays-analyser (" + version + ")",
		Width:  1248,
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
