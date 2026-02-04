//go:build !windows
// +build !windows

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type SteamPlayersResponse struct {
	Response struct {
		Players []SteamPlayer `json:"players"`
	} `json:"response"`
}

type SteamPlayer struct {
	SteamID                  string `json:"steamid"`
	CommunityVisibilityState int    `json:"communityvisibilitystate"`
	ProfileState             int    `json:"profilestate"`
	PersonaName              string `json:"personaname"`
	ProfileURL               string `json:"profileurl"`
	Avatar                   string `json:"avatar"`
	AvatarMedium             string `json:"avatarmedium"`
	AvatarFull               string `json:"avatarfull"`
	AvatarHash               string `json:"avatarhash"`
	LastLogoff               int64  `json:"lastlogoff"`
	PersonaState             int    `json:"personastate"`
	PrimaryClanID            string `json:"primaryclanid"`
	TimeCreated              int64  `json:"timecreated"`
	PersonaStateFlags        int    `json:"personastateflags"`
	GameExtraInfo            string `json:"gameextrainfo,omitempty"`
	GameID                   string `json:"gameid,omitempty"`
	LocCountryCode           string `json:"loccountrycode,omitempty"`
}

func getSteamPath() (string, error) {
	// Check environment variable first
	if steamPath := os.Getenv("STEAM_PATH"); steamPath != "" {
		if _, err := os.Stat(steamPath); err == nil {
			return steamPath, nil
		}
	}

	// Check common Steam installation paths on Linux
	commonPaths := []string{
		filepath.Join(os.Getenv("HOME"), ".steam", "steam"),
		filepath.Join(os.Getenv("HOME"), ".local", "share", "Steam"),
		"/usr/local/share/steam",
		"/usr/share/steam",
	}

	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}

	return "", fmt.Errorf("Steam installation not found. Set STEAM_PATH environment variable")
}

func getSteamUsername(steamID, userdataPath string) (string, error) {
	configPath := filepath.Join(userdataPath, steamID, "config", "localconfig.vdf")

	file, err := os.Open(configPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	usernamePattern := regexp.MustCompile(`"PersonaName"\s+"(.+?)"`)
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		matches := usernamePattern.FindStringSubmatch(line)
		if len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "Unknown", nil
}

func (a *App) GetSteamPlayer(steamID string) (*SteamPlayer, error) {
	url := fmt.Sprintf("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s", steamApiKey, steamID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var summaries SteamPlayersResponse
	if err := json.Unmarshal(body, &summaries); err != nil {
		return nil, err
	}

	if len(summaries.Response.Players) == 0 {
		return nil, fmt.Errorf("no player data found")
	}

	return &summaries.Response.Players[0], nil
}
