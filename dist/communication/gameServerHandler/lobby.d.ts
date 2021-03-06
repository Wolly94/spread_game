import { ClientLobbyMessage, SkilledPerkData } from "../../messages/inGame/clientLobbyMessage";
import { GameServerMessage, GameSettings, LobbyStateMessage, ServerLobbyMessage, SetPlayerIdMessage } from "../../messages/inGame/gameServerMessages";
import { SkillTree } from "../../skilltree/skilltree";
import { SpreadMap } from "../../spreadGame/map/map";
import { AiPlayer, PlayerData, RegisteredToken, SeatedPlayer } from "./common";
import InGameImplementation, { InGame } from "./inGame";
export interface LobbyState {
    type: "lobby";
    map: SpreadMap | null;
    seatedPlayers: SeatedPlayer[];
    unseatedPlayers: RegisteredToken[];
    gameSettings: GameSettings;
}
interface LobbyFunctions {
    unseatPlayer: (token: string) => void;
    onReceiveMessage: (token: string, msg: ClientLobbyMessage) => [boolean, GameServerMessage | null];
    onConnect: (token: string, playerData: PlayerData) => GameServerMessage | null;
    updateClientsMessage: () => LobbyStateMessage;
    startGame: () => InGame | null;
}
export declare type Lobby = LobbyState & LobbyFunctions;
declare class LobbyImplementation implements Lobby {
    type: "lobby";
    map: SpreadMap | null;
    gameSettings: GameSettings;
    seatedPlayers: SeatedPlayer[];
    unseatedPlayers: RegisteredToken[];
    skillTree: SkillTree;
    constructor();
    startGame(): InGameImplementation | null;
    onReceiveMessage(token: string, message: ClientLobbyMessage): [boolean, ServerLobbyMessage | null];
    setAiSkillTree(token: string, skilledPerkData: SkilledPerkData[], playerId: number): void;
    setSkillTree(token: string, skilledPerkData: SkilledPerkData[]): void;
    updateClientsMessage(): LobbyStateMessage;
    clearAiSeat(playerId: number): AiPlayer | null;
    takeSeat(token: string, playerId: number): SetPlayerIdMessage | null;
    clearSeat(token: string, playerId: number): void;
    seatAi(token: string, playerId: number): void;
    remainingLobbySeats(): number[];
    seatPlayer(token: string): SetPlayerIdMessage | null;
    unseatPlayer(token: string): void;
    onConnect(token: string, playerData: PlayerData): SetPlayerIdMessage | null;
    setMap(token: string, map: SpreadMap): SetPlayerIdMessage | null;
}
export default LobbyImplementation;
