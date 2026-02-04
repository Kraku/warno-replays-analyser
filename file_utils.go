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

type cachedReplay struct {
	ModTimeUnixNano int64      `json:"modTimeUnixNano"`
	Size            int64      `json:"size"`
	Data            *WarnoData `json:"data,omitempty"`
}

var (
	cacheDirOnce sync.Once
	cacheDirPath string
	cacheDirErr  error
)

func getCacheDir() (string, error) {
	cacheDirOnce.Do(func() {
		cacheDirPath, cacheDirErr = getLocalAppDataDir("warno-replays-analyser", filepath.Join("cache", version))
	})
	return cacheDirPath, cacheDirErr
}

func writeCache(cacheFilePath string, fileInfo os.FileInfo, data *WarnoData) error {
	entry := cachedReplay{
		ModTimeUnixNano: fileInfo.ModTime().UnixNano(),
		Size:            fileInfo.Size(),
		Data:            data,
	}

	encoded, err := json.Marshal(entry)
	if err != nil {
		return err
	}

	return os.WriteFile(cacheFilePath, encoded, 0644)
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

func getLocalAppDataDir(appName string, directory ...string) (string, error) {
	var cacheDir string

	// Platform-specific cache directory detection
	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData != "" {
		// Windows
		cacheDir = filepath.Join(localAppData, appName)
	} else {
		// Linux/macOS - use XDG cache directory or fallback
		xdgCache := os.Getenv("XDG_CACHE_HOME")
		if xdgCache != "" {
			cacheDir = filepath.Join(xdgCache, appName)
		} else {
			home := os.Getenv("HOME")
			if home == "" {
				return "", fmt.Errorf("HOME environment variable is not set")
			}
			cacheDir = filepath.Join(home, ".cache", appName)
		}
	}

	if len(directory) > 0 {
		cacheDir = filepath.Join(cacheDir, directory[0])
	}

	if err := os.MkdirAll(cacheDir, os.ModePerm); err != nil {
		return "", err
	}

	return cacheDir, nil
}

func writeEmptyCache(cacheFilePath string) error {
	// Backwards-compat shim: keep behavior for existing callers.
	// Prefer writeCache(cacheFilePath, fileInfo, nil) which includes modtime/size.
	return os.WriteFile(cacheFilePath, []byte{}, 0644)
}

func processFile(filePath string, result *sync.Map) error {
	fileInfo, err := os.Stat(filePath)
	if err != nil || fileInfo.IsDir() {
		return err
	}

	cacheDir, err := getCacheDir()
	if err != nil {
		return err
	}
	cacheFilePath := filepath.Join(cacheDir, filepath.Base(filePath)+".json")

	if _, err := os.Stat(cacheFilePath); err == nil {
		cachedContent, err := os.ReadFile(cacheFilePath)
		if err != nil {
			return err
		}

		// Historical empty-cache format: treat as stale and reprocess.
		if len(cachedContent) == 0 {
			// Fall through to parsing and rewrite cache with metadata.
		} else {
			var cached cachedReplay
			if err := json.Unmarshal(cachedContent, &cached); err == nil {
				if cached.ModTimeUnixNano == fileInfo.ModTime().UnixNano() && cached.Size == fileInfo.Size() {
					if cached.Data != nil {
						result.Store(filePath, *cached.Data)
					}
					return nil
				}
			}
		}
	}

	content, err := readFileContent(filePath)
	if err != nil {
		return err
	}

	isTwoPlayerReplay := strings.Contains(content, `"NbMaxPlayer":"2"`)
	isNetworkMode := strings.Contains(content, `"IsNetworkMode":"1"`)
	if !isTwoPlayerReplay || !isNetworkMode {
		return writeCache(cacheFilePath, fileInfo, nil)
	}

	jsons, err := extractJsons(content)
	if err != nil {
		return err
	}

	gameAny, ok := jsons[0]["game"]
	if !ok {
		return writeCache(cacheFilePath, fileInfo, nil)
	}
	game, ok := gameAny.(map[string]interface{})
	if !ok {
		return writeCache(cacheFilePath, fileInfo, nil)
	}
	if _, exists := game["WithHost"]; exists {
		return writeCache(cacheFilePath, fileInfo, nil)
	}
	if _, exists := game["ServerName"]; exists {
		return writeCache(cacheFilePath, fileInfo, nil)
	}

	merged, err := mergeJsons(filePath, jsons, fileInfo)
	if err != nil {
		return writeCache(cacheFilePath, fileInfo, nil)
	}

	result.Store(filePath, merged)

	return writeCache(cacheFilePath, fileInfo, &merged)
}
