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

type TeamNote struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

func getCompositeKey(enemy1PlayerId, enemy2PlayerId string) string {
	return fmt.Sprintf("%s, %s", enemy1PlayerId, enemy2PlayerId)
}

func getTeamNotesFilePath(enemy1PlayerId, enemy2PlayerId string) (string, error) {
	notesDir, err := getLocalAppDataDir("warno-replays-analyser", "teamNotes")

	if err != nil {
		return "", fmt.Errorf("getting teamNotes directory: %w", err)
	}

	if err := os.MkdirAll(notesDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("creating team notes directory: %w", err)
	}

	return filepath.Join(notesDir, fmt.Sprintf("%s.json", getCompositeKey(enemy1PlayerId, enemy2PlayerId))), nil
}

func loadTeamNotes(filePath string) ([]TeamNote, error) {
	var notes []TeamNote

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

func saveTeamNotes(filePath string, notes []TeamNote) error {
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

func (a *App) CreateTeamNote(enemyPlayer1Id, enemyPlayer2Id, content string) {
	filePath, err := getTeamNotesFilePath(enemyPlayer1Id, enemyPlayer2Id)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	notes, err := loadTeamNotes(filePath)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	newNote := TeamNote{
		ID:        uuid.New().String(),
		Content:   content,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	notes = append(notes, newNote)

	if err := saveTeamNotes(filePath, notes); err != nil {
		log.Printf("Error: %v", err)
	}
}

func (a *App) DeleteTeamNote(enemyPlayer1Id, enemy2PlayerId, noteId string) {
	filePath, err := getTeamNotesFilePath(enemyPlayer1Id, enemy2PlayerId)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	notes, err := loadTeamNotes(filePath)
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

	if err := saveTeamNotes(filePath, filtered); err != nil {
		log.Printf("Error: %v", err)
	}
}

func (a *App) GetTeamNotes(enemy1PlayerId, enemy2PlayerId string) string {
	filePath, err := getTeamNotesFilePath(enemy1PlayerId, enemy2PlayerId)
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
