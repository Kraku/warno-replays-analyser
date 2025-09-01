export namespace main {
	
	export class DailyRecap {
	    eloChange: number;
	    gamesPlayed: number;
	    wins: number;
	    losses: number;
	
	    static createFrom(source: any = {}) {
	        return new DailyRecap(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.eloChange = source["eloChange"];
	        this.gamesPlayed = source["gamesPlayed"];
	        this.wins = source["wins"];
	        this.losses = source["losses"];
	    }
	}
	export class EugenPlayer {
	    _id: string;
	    _rev: string;
	    "@time_challenge_played": string;
	    "@nb_dca_bought": string;
	    "@nb_art_bought": string;
	    ranked_nation_0: string;
	    "@campaign_nato": string;
	    "@campaign_wins": string;
	    "@campaign_last_game": string;
	    "@time_campaign_played": string;
	    "@multi_pact": string;
	    "@multi_loss": string;
	    "@xp_skirmish": string;
	    "@deployment_breakthrough": string;
	    "@nb_tank_bought": string;
	    "@time_tutorial_played": string;
	    "@nb_reco_bought": string;
	    ELO: string;
	    ranked_win: string;
	    ranked_nation_1: string;
	    ranked_last_game: string;
	    ELO_LB_delta_value: string;
	    ELO_LB_delta_rank: string;
	    ELO_LB_value: string;
	    ranked_loss: string;
	    ELO_LB_rank: string;
	    "@skirmish_played": string;
	    "@deployment_closequarter_conquest": string;
	    "@multi_draw": string;
	    "@skirmish_win": string;
	    "@skirmish_loss": string;
	    "@skirmish_last_game": string;
	    "@time_armory_played": string;
	    "@deployment_conquest": string;
	    "@skirmish_nato": string;
	    "@level": string;
	    "@total_unit_bought": string;
	    "@skirmish_win_ai_6": string;
	    "@xp_ranked": string;
	    "@multi_win": string;
	    "@time_skirmish_played": string;
	    "@skirmish_win_ai_5": string;
	    "@skirmish_win_ai_4": string;
	    "@skirmish_win_ai_3": string;
	    "@skirmish_win_ai_2": string;
	    "@skirmish_draw": string;
	    "@xp_multi": string;
	    "@nb_air_bought": string;
	    "@nb_sup_bought": string;
	    "@skirmish_pact": string;
	    "@multi_last_game": string;
	    "@time_ranked_played": string;
	    "@time_menu_played": string;
	    ranked_foul: string;
	    "@deployment_strategic": string;
	    "@multi_played": string;
	    "@time_multi_played": string;
	    "@multi_nato": string;
	    "@nb_inf_bought": string;
	    "@time_replay_played": string;
	    "@nb_at_bought": string;
	    "@xp_campaign": string;
	    "@time_strategic_played": string;
	
	    static createFrom(source: any = {}) {
	        return new EugenPlayer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this._id = source["_id"];
	        this._rev = source["_rev"];
	        this["@time_challenge_played"] = source["@time_challenge_played"];
	        this["@nb_dca_bought"] = source["@nb_dca_bought"];
	        this["@nb_art_bought"] = source["@nb_art_bought"];
	        this.ranked_nation_0 = source["ranked_nation_0"];
	        this["@campaign_nato"] = source["@campaign_nato"];
	        this["@campaign_wins"] = source["@campaign_wins"];
	        this["@campaign_last_game"] = source["@campaign_last_game"];
	        this["@time_campaign_played"] = source["@time_campaign_played"];
	        this["@multi_pact"] = source["@multi_pact"];
	        this["@multi_loss"] = source["@multi_loss"];
	        this["@xp_skirmish"] = source["@xp_skirmish"];
	        this["@deployment_breakthrough"] = source["@deployment_breakthrough"];
	        this["@nb_tank_bought"] = source["@nb_tank_bought"];
	        this["@time_tutorial_played"] = source["@time_tutorial_played"];
	        this["@nb_reco_bought"] = source["@nb_reco_bought"];
	        this.ELO = source["ELO"];
	        this.ranked_win = source["ranked_win"];
	        this.ranked_nation_1 = source["ranked_nation_1"];
	        this.ranked_last_game = source["ranked_last_game"];
	        this.ELO_LB_delta_value = source["ELO_LB_delta_value"];
	        this.ELO_LB_delta_rank = source["ELO_LB_delta_rank"];
	        this.ELO_LB_value = source["ELO_LB_value"];
	        this.ranked_loss = source["ranked_loss"];
	        this.ELO_LB_rank = source["ELO_LB_rank"];
	        this["@skirmish_played"] = source["@skirmish_played"];
	        this["@deployment_closequarter_conquest"] = source["@deployment_closequarter_conquest"];
	        this["@multi_draw"] = source["@multi_draw"];
	        this["@skirmish_win"] = source["@skirmish_win"];
	        this["@skirmish_loss"] = source["@skirmish_loss"];
	        this["@skirmish_last_game"] = source["@skirmish_last_game"];
	        this["@time_armory_played"] = source["@time_armory_played"];
	        this["@deployment_conquest"] = source["@deployment_conquest"];
	        this["@skirmish_nato"] = source["@skirmish_nato"];
	        this["@level"] = source["@level"];
	        this["@total_unit_bought"] = source["@total_unit_bought"];
	        this["@skirmish_win_ai_6"] = source["@skirmish_win_ai_6"];
	        this["@xp_ranked"] = source["@xp_ranked"];
	        this["@multi_win"] = source["@multi_win"];
	        this["@time_skirmish_played"] = source["@time_skirmish_played"];
	        this["@skirmish_win_ai_5"] = source["@skirmish_win_ai_5"];
	        this["@skirmish_win_ai_4"] = source["@skirmish_win_ai_4"];
	        this["@skirmish_win_ai_3"] = source["@skirmish_win_ai_3"];
	        this["@skirmish_win_ai_2"] = source["@skirmish_win_ai_2"];
	        this["@skirmish_draw"] = source["@skirmish_draw"];
	        this["@xp_multi"] = source["@xp_multi"];
	        this["@nb_air_bought"] = source["@nb_air_bought"];
	        this["@nb_sup_bought"] = source["@nb_sup_bought"];
	        this["@skirmish_pact"] = source["@skirmish_pact"];
	        this["@multi_last_game"] = source["@multi_last_game"];
	        this["@time_ranked_played"] = source["@time_ranked_played"];
	        this["@time_menu_played"] = source["@time_menu_played"];
	        this.ranked_foul = source["ranked_foul"];
	        this["@deployment_strategic"] = source["@deployment_strategic"];
	        this["@multi_played"] = source["@multi_played"];
	        this["@time_multi_played"] = source["@time_multi_played"];
	        this["@multi_nato"] = source["@multi_nato"];
	        this["@nb_inf_bought"] = source["@nb_inf_bought"];
	        this["@time_replay_played"] = source["@time_replay_played"];
	        this["@nb_at_bought"] = source["@nb_at_bought"];
	        this["@xp_campaign"] = source["@xp_campaign"];
	        this["@time_strategic_played"] = source["@time_strategic_played"];
	    }
	}
	export class Game {
	    CombatRule: string;
	    DeploymentMode: string;
	    GameMode: string;
	    GameType: string;
	    IncomeRate: string;
	    InitMoney: string;
	    IsNetworkMode: string;
	    Map: string;
	    ModList: string;
	    ModTagList: string;
	    NbMaxPlayer: string;
	    Private: string;
	    ScoreLimit: string;
	    Seed: string;
	    TimeLimit: string;
	    UniqueSessionId: string;
	    Version: string;
	
	    static createFrom(source: any = {}) {
	        return new Game(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.CombatRule = source["CombatRule"];
	        this.DeploymentMode = source["DeploymentMode"];
	        this.GameMode = source["GameMode"];
	        this.GameType = source["GameType"];
	        this.IncomeRate = source["IncomeRate"];
	        this.InitMoney = source["InitMoney"];
	        this.IsNetworkMode = source["IsNetworkMode"];
	        this.Map = source["Map"];
	        this.ModList = source["ModList"];
	        this.ModTagList = source["ModTagList"];
	        this.NbMaxPlayer = source["NbMaxPlayer"];
	        this.Private = source["Private"];
	        this.ScoreLimit = source["ScoreLimit"];
	        this.Seed = source["Seed"];
	        this.TimeLimit = source["TimeLimit"];
	        this.UniqueSessionId = source["UniqueSessionId"];
	        this.Version = source["Version"];
	    }
	}
	export class GetReplay {
	    id: number;
	    division: string;
	    eugenId: string;
	    // Go type: time
	    createdAt: any;
	    userID: number;
	
	    static createFrom(source: any = {}) {
	        return new GetReplay(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.division = source["division"];
	        this.eugenId = source["eugenId"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.userID = source["userID"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetUser {
	    usernames: string[];
	    ranks: number[];
	    eugenId: number;
	    steamId: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    lastKnownRank: number;
	    // Go type: time
	    lastKnownRankCreatedAt: any;
	    // Go type: time
	    oldestReplayCreatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new GetUser(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.usernames = source["usernames"];
	        this.ranks = source["ranks"];
	        this.eugenId = source["eugenId"];
	        this.steamId = source["steamId"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.lastKnownRank = source["lastKnownRank"];
	        this.lastKnownRankCreatedAt = this.convertValues(source["lastKnownRankCreatedAt"], null);
	        this.oldestReplayCreatedAt = this.convertValues(source["oldestReplayCreatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LeaderboardEntry {
	    id: number;
	    elo: number;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new LeaderboardEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.elo = source["elo"];
	        this.name = source["name"];
	    }
	}
	export class Player {
	    PlayerAlliance: string;
	    PlayerAvatar: string;
	    PlayerDeckContent: string;
	    PlayerElo: string;
	    PlayerIALevel: string;
	    PlayerIncomeRate: string;
	    PlayerIsEnteredInLobby: string;
	    PlayerLevel: string;
	    PlayerName: string;
	    PlayerRank: string;
	    PlayerReady: string;
	    PlayerScoreLimit: string;
	    PlayerSkinIndexUsed: string;
	    PlayerUserId: string;
	
	    static createFrom(source: any = {}) {
	        return new Player(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.PlayerAlliance = source["PlayerAlliance"];
	        this.PlayerAvatar = source["PlayerAvatar"];
	        this.PlayerDeckContent = source["PlayerDeckContent"];
	        this.PlayerElo = source["PlayerElo"];
	        this.PlayerIALevel = source["PlayerIALevel"];
	        this.PlayerIncomeRate = source["PlayerIncomeRate"];
	        this.PlayerIsEnteredInLobby = source["PlayerIsEnteredInLobby"];
	        this.PlayerLevel = source["PlayerLevel"];
	        this.PlayerName = source["PlayerName"];
	        this.PlayerRank = source["PlayerRank"];
	        this.PlayerReady = source["PlayerReady"];
	        this.PlayerScoreLimit = source["PlayerScoreLimit"];
	        this.PlayerSkinIndexUsed = source["PlayerSkinIndexUsed"];
	        this.PlayerUserId = source["PlayerUserId"];
	    }
	}
	export class PlayerGame {
	    gameId: string;
	    score: string;
	    date: string;
	    playerName: string;
	    enemyName: string;
	    playerElo: string[];
	    enemyElo: string[];
	    playerEloChange: string;
	    enemyEloChange: string;
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new PlayerGame(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.gameId = source["gameId"];
	        this.score = source["score"];
	        this.date = source["date"];
	        this.playerName = source["playerName"];
	        this.enemyName = source["enemyName"];
	        this.playerElo = source["playerElo"];
	        this.enemyElo = source["enemyElo"];
	        this.playerEloChange = source["playerEloChange"];
	        this.enemyEloChange = source["enemyEloChange"];
	        this.result = source["result"];
	    }
	}
	export class PlayerIdsOption {
	    label: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new PlayerIdsOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.value = source["value"];
	    }
	}
	export class PostReplay {
	    division: string;
	    eugenId: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new PostReplay(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.division = source["division"];
	        this.eugenId = source["eugenId"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PostUser {
	    usernames: string[];
	    ranks: number[];
	    eugenId: number;
	    steamId: string;
	    lastKnownRank: number;
	    // Go type: time
	    lastKnownRankCreatedAt: any;
	    // Go type: time
	    oldestReplayCreatedAt: any;
	    replays?: PostReplay[];
	
	    static createFrom(source: any = {}) {
	        return new PostUser(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.usernames = source["usernames"];
	        this.ranks = source["ranks"];
	        this.eugenId = source["eugenId"];
	        this.steamId = source["steamId"];
	        this.lastKnownRank = source["lastKnownRank"];
	        this.lastKnownRankCreatedAt = this.convertValues(source["lastKnownRankCreatedAt"], null);
	        this.oldestReplayCreatedAt = this.convertValues(source["oldestReplayCreatedAt"], null);
	        this.replays = this.convertValues(source["replays"], PostReplay);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Result {
	    Duration: string;
	    Victory: string;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Duration = source["Duration"];
	        this.Victory = source["Victory"];
	    }
	}
	export class Settings {
	    playerIds?: string[];
	    dateRangeFrom?: string;
	    dateRangeTo?: string;
	    dailyRecapUser?: string;
	    playerInfoSharingDisabled?: boolean;
	    gameMode?: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.playerIds = source["playerIds"];
	        this.dateRangeFrom = source["dateRangeFrom"];
	        this.dateRangeTo = source["dateRangeTo"];
	        this.dailyRecapUser = source["dailyRecapUser"];
	        this.playerInfoSharingDisabled = source["playerInfoSharingDisabled"];
	        this.gameMode = source["gameMode"];
	    }
	}
	export class SteamPlayer {
	    steamid: string;
	    communityvisibilitystate: number;
	    profilestate: number;
	    personaname: string;
	    profileurl: string;
	    avatar: string;
	    avatarmedium: string;
	    avatarfull: string;
	    avatarhash: string;
	    lastlogoff: number;
	    personastate: number;
	    primaryclanid: string;
	    timecreated: number;
	    personastateflags: number;
	    gameextrainfo?: string;
	    gameid?: string;
	    loccountrycode?: string;
	
	    static createFrom(source: any = {}) {
	        return new SteamPlayer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.steamid = source["steamid"];
	        this.communityvisibilitystate = source["communityvisibilitystate"];
	        this.profilestate = source["profilestate"];
	        this.personaname = source["personaname"];
	        this.profileurl = source["profileurl"];
	        this.avatar = source["avatar"];
	        this.avatarmedium = source["avatarmedium"];
	        this.avatarfull = source["avatarfull"];
	        this.avatarhash = source["avatarhash"];
	        this.lastlogoff = source["lastlogoff"];
	        this.personastate = source["personastate"];
	        this.primaryclanid = source["primaryclanid"];
	        this.timecreated = source["timecreated"];
	        this.personastateflags = source["personastateflags"];
	        this.gameextrainfo = source["gameextrainfo"];
	        this.gameid = source["gameid"];
	        this.loccountrycode = source["loccountrycode"];
	    }
	}
	export class Warno {
	    game: Game;
	    localPlayerEugenId: string;
	    localPlayerKey: string;
	    players: Record<string, Player>;
	    playerCount: number;
	    result: Result;
	
	    static createFrom(source: any = {}) {
	        return new Warno(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.game = this.convertValues(source["game"], Game);
	        this.localPlayerEugenId = source["localPlayerEugenId"];
	        this.localPlayerKey = source["localPlayerKey"];
	        this.players = this.convertValues(source["players"], Player, true);
	        this.playerCount = source["playerCount"];
	        this.result = this.convertValues(source["result"], Result);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WarnoData {
	    fileName: string;
	    filePath: string;
	    key: string;
	    createdAt: string;
	    warno: Warno;
	
	    static createFrom(source: any = {}) {
	        return new WarnoData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileName = source["fileName"];
	        this.filePath = source["filePath"];
	        this.key = source["key"];
	        this.createdAt = source["createdAt"];
	        this.warno = this.convertValues(source["warno"], Warno);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

