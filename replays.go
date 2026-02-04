package main

import (
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

func getReplays(directories []string) []WarnoData {
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

	finalResult := make([]WarnoData, 0, 256)
	result.Range(func(_, value any) bool {
		if wd, ok := value.(WarnoData); ok {
			finalResult = append(finalResult, wd)
		}
		return true
	})

	return finalResult
}

func (a *App) GetReplays(directories []string) []WarnoData {
	for _, dir := range directories {
		a.mu.Lock()

		if _, alreadyWatching := a.watchedDirs[dir]; !alreadyWatching {
			a.watchedDirs[dir] = struct{}{}
			go a.watchFolder(dir)
		}

		a.mu.Unlock()
	}

	return getReplays(directories)
}
