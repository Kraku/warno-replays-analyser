package main

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/sys/windows/registry"
)

func getSteamPath() (string, error) {
	key, err := registry.OpenKey(registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Valve\Steam`, registry.QUERY_VALUE)
	if err != nil {
		return "", err
	}
	defer key.Close()

	steamPath, _, err := key.GetStringValue("InstallPath")
	if err != nil {
		return "", err
	}
	return steamPath, nil
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
