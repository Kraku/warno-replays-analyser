package main

import (
	"encoding/json"
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

	finalResult := []map[string]any{}
	result.Range(func(_, value any) bool {
		finalResult = append(finalResult, value.(map[string]any))
		return true
	})

	resultArray, err := json.MarshalIndent(finalResult, "", "  ")
	if err != nil {
		log.Printf("Error marshaling result to JSON: %v", err)
		return nil
	}

	var warnoData []WarnoData
	err = json.Unmarshal(resultArray, &warnoData)
	if err != nil {
		log.Printf("Error unmarshaling JSON to WarnoData: %v", err)
		return nil
	}

	return warnoData
}

func (a *App) GetReplays(directories []string) []WarnoData {
	return getReplays(directories)
}
