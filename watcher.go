package main

import (
	"log"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) watchFolder(path string) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Println("Watcher error:", err)
		return
	}
	defer watcher.Close()

	err = watcher.Add(path)
	if err != nil {
		log.Println("Add path error:", err)
		return
	}

	for {
		select {
		case event := <-watcher.Events:
			if event.Op&fsnotify.Create == fsnotify.Create {
				runtime.EventsEmit(a.ctx, "replay-file-added", event.Name)
			}
		case err := <-watcher.Errors:
			log.Println("Watcher error:", err)
		}
	}
}
