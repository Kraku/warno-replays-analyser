export namespace main {
	
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
	export class Players {
	    player1: Player;
	    player2: Player;
	
	    static createFrom(source: any = {}) {
	        return new Players(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.player1 = this.convertValues(source["player1"], Player);
	        this.player2 = this.convertValues(source["player2"], Player);
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
	    startDate?: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.playerIds = source["playerIds"];
	        this.startDate = source["startDate"];
	    }
	}
	export class Warno {
	    game: Game;
	    ingamePlayerId: number;
	    players: Players;
	    result: Result;
	
	    static createFrom(source: any = {}) {
	        return new Warno(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.game = this.convertValues(source["game"], Game);
	        this.ingamePlayerId = source["ingamePlayerId"];
	        this.players = this.convertValues(source["players"], Players);
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
	    key: string;
	    createdAt: string;
	    warno: Warno;
	
	    static createFrom(source: any = {}) {
	        return new WarnoData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileName = source["fileName"];
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

