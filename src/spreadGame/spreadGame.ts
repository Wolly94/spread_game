import { ClientGameState } from "../messages/inGame/clientGameState";
import { GameSettings } from "../messages/inGame/gameServerMessages";
import SpreadReplay, { HistoryEntry, Move } from "../messages/replay/replay";
import {
    AfterFightState,
    BeforeFightState,
    CapturedCellEvent,
    combinedFightEvents,
    createFightEvent,
    DefeatedBubbleEvent,
    FightEvent,
    finishFightEvent,
    latestDistance,
    SpreadGameEvent,
} from "../skilltree/events";
import {
    GeneralPerk,
    allPerks,
    perkFromBackUp,
    backupFromPerk,
} from "../skilltree/perks/perk";
import Bubble from "./bubble";
import Cell from "./cell";
import { distance } from "./entites";
import { growthUtils } from "./gameProps/cellGrowth";
import { SpreadMap } from "./map/map";
import basicMechanics from "./mechanics/basicMechanics";
import bounceMechanics from "./mechanics/bounceMechanics";
import { SpreadGameMechanics } from "./mechanics/commonMechanics";
import {
    ConquerCellEvent,
    conquerCellUtils,
} from "./mechanics/events/conquerCell";
import { CreateBubbleEvent } from "./mechanics/events/createBubble";
import {
    DefendCellEvent,
    defendCellUtils,
} from "./mechanics/events/defendCell";
import {
    AttachProps,
    Entity,
    NewSpreadGameEvent,
    SpreadGameProps,
    TimedProps,
} from "./mechanics/events/definitions";
import {
    BubbleFightProps,
    bubbleFightUtils,
    CellFightProps,
    cellFightUtils,
} from "./mechanics/events/fight";
import { SendUnitsEvent, sendUnitsUtils } from "./mechanics/events/sendUnits";
import {
    VisualizeBubbleProps,
    visualizeBubbleUtils,
} from "./mechanics/events/visualizeBubbleProps";
import {
    VisualizeCellProps,
    visualizeCellUtils,
} from "./mechanics/events/visualizeCellProps";
import scrapeOffMechanics from "./mechanics/scrapeOffMechanics";
import Player, { dataFromPlayer, playerFromData } from "./player";

const getMechanics = (settings: GameSettings): SpreadGameMechanics => {
    if (settings.mechanics === "basic") {
        return basicMechanics;
    } else if (settings.mechanics === "scrapeoff") {
        return scrapeOffMechanics;
    } else if (settings.mechanics === "bounce") {
        return bounceMechanics;
    } else throw Error("unregistered mechanics");
};

export interface SpreadGameState {
    cells: Cell[];
    bubbles: Bubble[];
    players: Player[];
    timePassed: number;
}

export interface SpreadGameInteraction {
    applyMove: (move: Move) => void;
}

export interface SpreadGameFunctions {
    step: (ms: number) => void;
    toClientGameState: () => ClientGameState;
    getReplay: () => SpreadReplay;
}

export type SpreadGame = SpreadGameState &
    SpreadGameFunctions &
    SpreadGameInteraction;

export class SpreadGameImplementation implements SpreadGame {
    map: SpreadMap;
    gameSettings: GameSettings;
    cells: Cell[];
    bubbles: Bubble[];
    players: Player[];
    pastMoves: HistoryEntry<Move>[];
    mechanics: SpreadGameMechanics;
    timePassed: number;
    eventHistory: HistoryEntry<SpreadGameEvent>[];
    perks: GeneralPerk[];
    attachedProps: AttachProps<TimedProps<SpreadGameProps>>[];

    constructor(
        map: SpreadMap,
        gameSettings: GameSettings,
        players: Player[],
        perks?: GeneralPerk[]
    ) {
        //const players = getPlayerIds(map);
        this.gameSettings = gameSettings;
        this.mechanics = getMechanics(gameSettings);
        this.map = map;
        this.cells = map.cells.map((mapCell) => {
            const cell: Cell = {
                id: mapCell.id,
                playerId: mapCell.playerId,
                position: mapCell.position,
                radius: mapCell.radius,
                units: mapCell.units,
            };
            return cell;
        });
        this.bubbles = [];
        this.players = players;
        this.timePassed = 0;
        this.pastMoves = [];
        this.eventHistory = [];
        this.perks = perks === undefined ? allPerks : perks;
        this.attachedProps = [];
        this.triggerStart();
    }

    triggerStart() {
        this.cells = this.cells.map((cell) => {
            const perks =
                cell.playerId !== null
                    ? this.getSkilledPerks(cell.playerId)
                    : [];
            /*             const defStartProps: DefenderStartProps = defenderStartUtils.collect(
                perks,
                {},
                this
            ); */
            /*             return {
                ...cell,
                units: cell.units + defStartProps.additionalUnits,
            }; */
            return cell;
        });
    }

    static fromReplay(replay: SpreadReplay) {
        const perks = replay.perks
            .map(perkFromBackUp)
            .filter((p): p is GeneralPerk => p !== null);
        const spreadGame = new SpreadGameImplementation(
            replay.map,
            replay.gameSettings,
            replay.players.map(playerFromData),
            perks
        );
        return spreadGame;
    }

    attachProps(props: AttachProps<TimedProps<SpreadGameProps>>[]) {
        props.forEach((prop) => {
            const existingIndex = this.attachedProps.findIndex(
                (ap) =>
                    ap.perkName === prop.perkName &&
                    ap.props.value.type === prop.props.value.type &&
                    ap.triggerType === prop.triggerType &&
                    ap.entity?.type === prop.entity?.type &&
                    ap.entity?.id === prop.entity?.id
            );
            if (existingIndex >= 0) this.attachedProps[existingIndex] = prop;
            else if (prop.entity !== null) {
                this.attachedProps.push(prop);
            }
        });
    }

    // attaches every prop that is supposed to be attached
    // and returns all other props
    handleEvent(event: NewSpreadGameEvent) {
        const props = this.perks.flatMap((perk) => {
            return perk.triggers.flatMap((tr) => {
                if (tr.type === "ConquerCell" && event.type === "ConquerCell")
                    return tr.getValue(event, this);
                else if (tr.type === "SendUnits" && event.type === "SendUnits")
                    return tr.getValue(event, this);
                else if (
                    tr.type === "CreateBubble" &&
                    event.type == "CreateBubble"
                ) {
                    return tr.getValue(event, this);
                } else return [];
            });
        });
        this.attachProps(props);
        const result = props
            .filter((props) => props.entity === null)
            .map((prop) => prop.props.value);
        return result;
    }

    runReplay(replay: SpreadReplay, ms: number) {
        const movesToDo = replay.moveHistory.filter(
            (mv) =>
                mv.timestamp >= this.timePassed &&
                mv.timestamp < this.timePassed + ms
        );
        const finalTime = Math.min(this.timePassed + ms, replay.lengthInMs);
        while (this.timePassed < finalTime) {
            movesToDo.forEach((mv) => {
                if (mv.timestamp === this.timePassed) {
                    this.applyMove(mv.data);
                }
            });
            this.step(replay.gameSettings.updateFrequencyInMs);
        }
    }

    getReplay() {
        const rep: SpreadReplay = {
            map: this.map,
            gameSettings: this.gameSettings,
            moveHistory: this.pastMoves,
            players: this.players.map((pl) => dataFromPlayer(pl)),
            lengthInMs: this.timePassed,
            perks: this.perks.map((p) => backupFromPerk(p)),
        };
        return rep;
    }

    applyMove(move: Move) {
        if (move.type === "sendunitsmove") {
            this.sendUnits(
                move.data.playerId,
                move.data.senderIds,
                move.data.receiverId
            );
        }
    }

    run(ms: number, updateFrequencyInMs: number) {
        if (ms <= 0) return;
        else {
            this.step(updateFrequencyInMs);
            this.run(ms - updateFrequencyInMs, updateFrequencyInMs);
        }
    }

    step(ms: number) {
        this.bubbles = this.bubbles.map((bubble) =>
            this.mechanics.move(bubble, ms)
        );
        this.cells = this.cells.map((cell) => {
            const growthProps = growthUtils.default;
            return this.mechanics.grow(cell, ms, growthProps);
        });
        this.collideBubblesWithCells();
        this.collideBubblesWithBubbles();
        this.checkForFinishedFights();
        this.timePassed += ms;
    }

    collideBubblesWithBubbles() {
        const fightResults: [BeforeFightState, AfterFightState][] = [];
        var remainingBubbles: (Bubble | null)[] = [];
        this.bubbles.forEach((bubble) => {
            var currentBubble: Bubble | null = bubble;
            remainingBubbles = remainingBubbles.map((bubble2) => {
                if (
                    currentBubble !== null &&
                    bubble2 !== null &&
                    this.mechanics.collidesWithBubble(bubble2, currentBubble)
                ) {
                    const bubbleFightProps: BubbleFightProps = bubbleFightUtils.collect(
                        this.attachedProps
                            .filter(
                                (ap) =>
                                    ap.entity?.type === "Bubble" &&
                                    ap.entity.id === currentBubble?.id
                            )
                            .map((prop) => prop.props.value)
                    );
                    const bubble2FightProps: BubbleFightProps = bubbleFightUtils.collect(
                        this.attachedProps
                            .filter(
                                (ap) =>
                                    ap.entity?.type === "Bubble" &&
                                    ap.entity.id === bubble2.id
                            )
                            .map((prop) => prop.props.value)
                    );

                    const [rem1, rem2] = this.mechanics.collideBubble(
                        bubble2,
                        currentBubble,
                        bubble2FightProps,
                        bubbleFightProps
                    );
                    fightResults.push([
                        {
                            attacker: bubble2,
                            defender: { type: "Bubble", val: currentBubble },
                        },
                        {
                            attacker: rem1,
                            defender: { type: "Bubble", val: rem2 },
                        },
                    ]);
                    currentBubble = rem2;
                    return rem1;
                } else {
                    return bubble2;
                }
            });
            if (currentBubble != null) {
                remainingBubbles.push(currentBubble);
            }
        });
        this.bubbles = remainingBubbles.filter((b): b is Bubble => b !== null);
        fightResults.forEach(([before, after]) =>
            this.processFight(before, after)
        );
    }
    checkForFinishedFights() {
        this.eventHistory = this.eventHistory.map((ev) => {
            if (ev.data.type === "FightEvent" && !ev.data.finished) {
                let returnEvent = { ...ev.data };
                const eventData = ev.data;
                const currentAttacker = this.bubbles.find(
                    (b) => b.id === eventData.before.attacker.id
                );
                const currentDefender =
                    eventData.before.defender.type === "Cell"
                        ? this.cells.find(
                              (c) => c.id === eventData.before.defender.val.id
                          )
                        : this.bubbles.find(
                              (b) => b.id === eventData.before.defender.val.id
                          );
                if (
                    currentAttacker === undefined ||
                    currentDefender === undefined
                ) {
                    // attacker or defender got killed by someone else
                    finishFightEvent(returnEvent);
                } else if (
                    latestDistance(eventData) <
                    distance(currentAttacker.position, currentDefender.position)
                ) {
                    // they are moving away from each other
                    finishFightEvent(returnEvent);
                }
                return { ...ev, data: returnEvent };
            } else return ev;
        });
    }
    // this either adds a FightEvent or a PartialFightEvent or modifies a PartialFightEvent in the event history
    processFight(before: BeforeFightState, after: AfterFightState) {
        const capturedCellEvent: CapturedCellEvent | null =
            before.defender.type === "Cell" &&
            after.defender.val !== null &&
            after.defender.val.playerId !== null &&
            before.defender.val.playerId !== after.defender.val.playerId
                ? {
                      afterPlayerId: after.defender.val.playerId,
                      beforePlayerId: before.defender.val.playerId,
                      cellId: before.defender.val.id,
                      type: "CapturedCell",
                  }
                : null;
        const defeatedBubbleEvents: DefeatedBubbleEvent[] = [];
        if (after.attacker === null) {
            defeatedBubbleEvents.push({
                type: "DefeatedBubble",
                defender: after.defender,
            });
        }
        if (after.defender.type === "Bubble" && after.defender.val === null) {
            defeatedBubbleEvents.push({
                type: "DefeatedBubble",
                defender: { type: "Bubble", val: after.attacker },
            });
        }
        const existingPartialFightEvent:
            | FightEvent
            | undefined = this.eventHistory.find(
            (ev): ev is HistoryEntry<FightEvent> =>
                ev.data.type === "FightEvent" &&
                !ev.data.finished &&
                ev.data.before.attacker.id === before.attacker.id &&
                ev.data.before.defender.type === before.defender.type &&
                ev.data.before.defender.val.id === before.defender.val.id
        )?.data;
        if (
            existingPartialFightEvent !== undefined &&
            combinedFightEvents(
                existingPartialFightEvent,
                before,
                after,
                this.timePassed
            )
        ) {
        } else {
            const newEvent = createFightEvent(before, after, this.timePassed);
            this.eventHistory.push({
                timestamp: this.timePassed,
                data: newEvent,
            });
        }
        if (capturedCellEvent !== null)
            this.eventHistory.push({
                timestamp: this.timePassed,
                data: capturedCellEvent,
            });
        defeatedBubbleEvents.forEach((ev) =>
            this.eventHistory.push({ timestamp: this.timePassed, data: ev })
        );
    }
    collideBubblesWithCells() {
        const fightResults: [BeforeFightState, AfterFightState][] = [];
        var remainingBubbles: Bubble[] = [];
        this.bubbles.forEach((bubble) => {
            var currentBubble: Bubble | null = bubble;
            this.cells = this.cells.map((cell) => {
                if (
                    currentBubble != null &&
                    (currentBubble.motherId !== cell.id ||
                        currentBubble.playerId !== cell.playerId) &&
                    this.mechanics.collidesWithCell(bubble, cell)
                ) {
                    const bubbleFightProps: BubbleFightProps = bubbleFightUtils.collect(
                        this.attachedProps
                            .filter(
                                (ap) =>
                                    ap.entity?.type === "Bubble" &&
                                    ap.entity.id === currentBubble?.id
                            )
                            .map((prop) => prop.props.value)
                    );
                    const cellFightProps: CellFightProps = cellFightUtils.collect(
                        this.attachedProps
                            .filter(
                                (ap) =>
                                    ap.entity?.type === "Cell" &&
                                    ap.entity.id === cell.id
                            )
                            .map((prop) => prop.props.value)
                    );
                    let [
                        newCurrentBubble,
                        newCell,
                    ] = this.mechanics.collideCell(
                        currentBubble,
                        cell,
                        bubbleFightProps,
                        cellFightProps
                    );
                    fightResults.push([
                        {
                            attacker: currentBubble,
                            defender: { type: "Cell", val: cell },
                        },
                        {
                            attacker: newCurrentBubble,
                            defender: { type: "Cell", val: newCell },
                        },
                    ]);

                    if (newCell.playerId !== cell.playerId) {
                        const conquerEvent: ConquerCellEvent = {
                            type: "ConquerCell",
                            before: { cell: { ...cell } },
                            after: { cell: { ...newCell } },
                        };
                        const props = this.handleEvent(conquerEvent);
                        const fromAttachedProps = this.fromAttachedProps({
                            type: "Cell",
                            id: cell.id,
                        });
                        const conquerProps = conquerCellUtils.collect(
                            fromAttachedProps.concat(props)
                        );
                        newCell = {
                            ...newCell,
                            units: newCell.units + conquerProps.additionalUnits,
                        };
                    } else {
                        /* if (newCell.playerId === cell.playerId) { */
                        const defendEvent: DefendCellEvent = {
                            type: "DefendCell",
                            before: { cell: { ...cell } },
                            after: { cell: { ...newCell } },
                        };
                        const props = this.handleEvent(defendEvent);
                        const fromAttachedProps = this.fromAttachedProps({
                            type: "Cell",
                            id: newCell.id,
                        });
                        const conquerProps = defendCellUtils.collect(
                            fromAttachedProps.concat(props)
                        );
                        newCell = {
                            ...newCell,
                            units: newCell.units + conquerProps.additionalUnits,
                        };
                    }
                    currentBubble = newCurrentBubble;
                    //if (event !== null) eventsToAdd.push(event);
                    return newCell;
                } else {
                    return cell;
                }
            });
            if (currentBubble != null) {
                remainingBubbles.push(currentBubble);
            }
        });
        this.bubbles = remainingBubbles;
        fightResults.forEach(([before, after]) =>
            this.processFight(before, after)
        );
    }
    fromAttachedProps(entity: Entity) {
        const result = this.attachedProps
            .filter(
                (prop) =>
                    (prop.props.expirationInMs === "Never" ||
                        prop.props.expirationInMs >= this.timePassed) &&
                    prop.entity?.type === entity.type &&
                    prop.entity.id === entity.id
            )
            .map((prop) => prop.props.value);
        return result;
    }
    sendUnits(playerId: number, senderIds: number[], receiverId: number) {
        const eventsToAdd: SpreadGameEvent[] = [];
        const player = this.players.find((p) => p.id == playerId);
        if (player == undefined) return false;
        const targetCell = this.cells.find((c) => c.id == receiverId);
        if (targetCell == undefined) return false;
        const sentIds: number[] = [];
        this.cells = this.cells.map((sender) => {
            if (
                senderIds.some((id) => id === sender.id) &&
                sender.playerId === playerId &&
                sender.id !== receiverId
            ) {
                const event: SendUnitsEvent = {
                    sender: sender,
                    target: targetCell,
                    type: "SendUnits",
                };
                const unsavedProps = this.handleEvent(event);
                const fromAttachedProps = this.fromAttachedProps({
                    type: "Cell",
                    id: sender.id,
                }).concat(
                    this.fromAttachedProps({ type: "Cell", id: receiverId })
                );
                const sendUnitsProps = sendUnitsUtils.collect(
                    fromAttachedProps.concat(unsavedProps)
                );
                const [remCell, bubble] = this.mechanics.sendBubble(
                    sender,
                    targetCell,
                    this.timePassed,
                    sendUnitsProps
                );
                if (bubble !== null) {
                    const createBubbleEvent: CreateBubbleEvent = {
                        sendUnitsEvent: event,
                        after: { bubble: bubble, sender: remCell },
                        type: "CreateBubble",
                    };
                    this.handleEvent(createBubbleEvent);

                    this.bubbles.push(bubble);
                    eventsToAdd.push({
                        type: "SendBubbleEvent",
                        sender: sender,
                        receiver: targetCell,
                    });
                    sentIds.push(sender.id);
                }
                return remCell;
            } else {
                return sender;
            }
        });
        this.pastMoves.push({
            timestamp: this.timePassed,
            data: {
                type: "sendunitsmove",
                data: {
                    receiverId: targetCell.id,
                    senderIds: sentIds,
                    playerId: playerId,
                },
            },
        });
        this.eventHistory = this.eventHistory.concat(
            eventsToAdd.map((ev) => {
                return { timestamp: this.timePassed, data: ev };
            })
        );
    }

    getSkilledPerk(perkName: string, playerId: number | null) {
        const st = this.players.find((pl) => pl.id === playerId);
        const perk = st?.skills.find((p) => p.perk.name === perkName);
        return perk !== undefined ? perk : null;
    }

    toClientGameState() {
        const gs: ClientGameState = {
            timePassedInMs: this.timePassed,
            cells: this.cells.map((cell) => {
                const cellProps: VisualizeCellProps = visualizeCellUtils.collect(
                    this.fromAttachedProps({ type: "Cell", id: cell.id })
                );
                return {
                    id: cell.id,
                    playerId: cell.playerId,
                    units: cell.units,
                    position: cell.position,
                    radius: cell.radius,
                    defenderCombatAbilities: cellProps.combatAbilityModifier,
                    attackerCombatAbilities: cellProps.rageValue
                };
            }),
            bubbles: this.bubbles.map((bubble) => {
                const bubbleProps: VisualizeBubbleProps = visualizeBubbleUtils.collect(
                    this.fromAttachedProps({ type: "Bubble", id: bubble.id })
                );
                return {
                    id: bubble.id,
                    playerId: bubble.playerId,
                    units: bubble.units,
                    position: bubble.position,
                    radius: bubble.radius,

                    attackCombatAbilities: bubbleProps.combatAbilityModifier,
                };
            }),
        };
        return gs;
    }
    getSkilledPerks(playerId: number) {
        const pl = this.players.find((pl) => pl.id === playerId);
        if (pl === undefined) return [];
        else return pl.skills;
    }
}
