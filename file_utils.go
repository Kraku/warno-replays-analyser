package main

import (
	"log"
	"os"
)

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
