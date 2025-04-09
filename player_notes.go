package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type PlayerNote struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

func getNotesFilePath(playerId string) (string, error) {
	notesDir, err := getCacheDir("warno-replays-analyser", "playerNotes")
	if err != nil {
		return "", fmt.Errorf("getting playerNotes directory: %w", err)
	}

	if err := os.MkdirAll(notesDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("creating notes directory: %w", err)
	}

	return filepath.Join(notesDir, fmt.Sprintf("%s.json", playerId)), nil
}

func loadPlayerNotes(filePath string) ([]PlayerNote, error) {
	var notes []PlayerNote

	f, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return notes, nil
		}
		return nil, fmt.Errorf("opening file: %w", err)
	}

	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("reading file: %w", err)
	}
	if err := json.Unmarshal(data, &notes); err != nil {
		return nil, fmt.Errorf("unmarshaling JSON: %w", err)
	}

	return notes, nil
}

func savePlayerNotes(filePath string, notes []PlayerNote) error {
	data, err := json.MarshalIndent(notes, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling JSON: %w", err)
	}

	f, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("creating file: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(data); err != nil {
		return fmt.Errorf("writing to file: %w", err)
	}

	return nil
}

func (a *App) CreatePlayerNote(playerId, content string) {
	filePath, err := getNotesFilePath(playerId)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	notes, err := loadPlayerNotes(filePath)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	newNote := PlayerNote{
		ID:        uuid.New().String(),
		Content:   content,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	notes = append(notes, newNote)

	if err := savePlayerNotes(filePath, notes); err != nil {
		log.Printf("Error: %v", err)
	}
}

func (a *App) DeletePlayerNote(playerId, noteId string) {
	filePath, err := getNotesFilePath(playerId)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	notes, err := loadPlayerNotes(filePath)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	filtered := notes[:0]
	for _, note := range notes {
		if note.ID != noteId {
			filtered = append(filtered, note)
		}
	}

	if err := savePlayerNotes(filePath, filtered); err != nil {
		log.Printf("Error: %v", err)
	}
}

func (a *App) GetPlayerNotes(playerId string) string {
	filePath, err := getNotesFilePath(playerId)
	if err != nil {
		log.Printf("Error: %v", err)
		return "[]"
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Error reading notes: %v", err)
		}
		return "[]"
	}

	return string(data)
}
