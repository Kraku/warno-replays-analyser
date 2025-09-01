package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type EugenPlayer struct {
	ID                     string `json:"_id"`
	Rev                    string `json:"_rev"`
	TimeChallengePlayed    string `json:"@time_challenge_played"`
	NbDcaBought            string `json:"@nb_dca_bought"`
	NbArtBought            string `json:"@nb_art_bought"`
	RankedNation0          string `json:"ranked_nation_0"`
	CampaignNato           string `json:"@campaign_nato"`
	CampaignWins           string `json:"@campaign_wins"`
	CampaignLastGame       string `json:"@campaign_last_game"`
	TimeCampaignPlayed     string `json:"@time_campaign_played"`
	MultiPact              string `json:"@multi_pact"`
	MultiLoss              string `json:"@multi_loss"`
	XpSkirmish             string `json:"@xp_skirmish"`
	DeploymentBreakthrough string `json:"@deployment_breakthrough"`
	NbTankBought           string `json:"@nb_tank_bought"`
	TimeTutorialPlayed     string `json:"@time_tutorial_played"`
	NbRecoBought           string `json:"@nb_reco_bought"`
	ELO                    string `json:"ELO"`
	RankedWin              string `json:"ranked_win"`
	RankedNation1          string `json:"ranked_nation_1"`
	RankedLastGame         string `json:"ranked_last_game"`
	ELOLBDeltaValue        string `json:"ELO_LB_delta_value"`
	ELOLBDeltaRank         string `json:"ELO_LB_delta_rank"`
	ELOLBValue             string `json:"ELO_LB_value"`
	RankedLoss             string `json:"ranked_loss"`
	ELOLBRank              string `json:"ELO_LB_rank"`
	SkirmishPlayed         string `json:"@skirmish_played"`
	DeploymentCloseQuarter string `json:"@deployment_closequarter_conquest"`
	MultiDraw              string `json:"@multi_draw"`
	SkirmishWin            string `json:"@skirmish_win"`
	SkirmishLoss           string `json:"@skirmish_loss"`
	SkirmishLastGame       string `json:"@skirmish_last_game"`
	TimeArmoryPlayed       string `json:"@time_armory_played"`
	DeploymentConquest     string `json:"@deployment_conquest"`
	SkirmishNato           string `json:"@skirmish_nato"`
	Level                  string `json:"@level"`
	TotalUnitBought        string `json:"@total_unit_bought"`
	SkirmishWinAi6         string `json:"@skirmish_win_ai_6"`
	XpRanked               string `json:"@xp_ranked"`
	MultiWin               string `json:"@multi_win"`
	TimeSkirmishPlayed     string `json:"@time_skirmish_played"`
	SkirmishWinAi5         string `json:"@skirmish_win_ai_5"`
	SkirmishWinAi4         string `json:"@skirmish_win_ai_4"`
	SkirmishWinAi3         string `json:"@skirmish_win_ai_3"`
	SkirmishWinAi2         string `json:"@skirmish_win_ai_2"`
	SkirmishDraw           string `json:"@skirmish_draw"`
	XpMulti                string `json:"@xp_multi"`
	NbAirBought            string `json:"@nb_air_bought"`
	NbSupBought            string `json:"@nb_sup_bought"`
	SkirmishPact           string `json:"@skirmish_pact"`
	MultiLastGame          string `json:"@multi_last_game"`
	TimeRankedPlayed       string `json:"@time_ranked_played"`
	TimeMenuPlayed         string `json:"@time_menu_played"`
	RankedFoul             string `json:"ranked_foul"`
	DeploymentStrategic    string `json:"@deployment_strategic"`
	MultiPlayed            string `json:"@multi_played"`
	TimeMultiPlayed        string `json:"@time_multi_played"`
	MultiNato              string `json:"@multi_nato"`
	NbInfBought            string `json:"@nb_inf_bought"`
	TimeReplayPlayed       string `json:"@time_replay_played"`
	NbAtBought             string `json:"@nb_at_bought"`
	XpCampaign             string `json:"@xp_campaign"`
	TimeStrategicPlayed    string `json:"@time_strategic_played"`
}

func (a *App) GetEugenPlayer(playerId string) (*EugenPlayer, error) {
	url := fmt.Sprintf(eugenApiUrl+"/stats/u29_%s", playerId)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch player data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var player EugenPlayer
	if err := json.Unmarshal(body, &player); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return &player, nil
}
