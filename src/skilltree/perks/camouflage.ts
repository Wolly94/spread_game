import { idFromToken } from "../../communication/gameServerHandler/common";
import { Player } from "../../spreadGame";
import {
    AttachProps,
    Entity,
    TimedProps,
} from "../../spreadGame/mechanics/events/definitions";
import {
    bubbleHideUtils,
    PlayerBubbleHideProps,
    VisualizeBubbleProps,
    visualizeBubbleUtils,
} from "../../spreadGame/mechanics/events/visualizeBubbleProps";
import {
    cellHideUtils,
    PlayerCellHideProps,
    VisualizeCellProps,
    visualizeCellUtils,
} from "../../spreadGame/mechanics/events/visualizeCellProps";
import { CreatePerk, getPerkValue } from "./perk";

const name = "Camouflage";
const defaultValue = 0;
const defaultValues = [1];

const getResultVisualProps = (
    entityId: number,
    props: VisualizeCellProps | VisualizeBubbleProps
) => {
    if (props.type === "VisualizeBubbleProps") {
        const result: AttachProps<TimedProps<VisualizeBubbleProps>> = {
            entity: {
                type: "Bubble",
                id: entityId,
            },
            perkName: name,
            triggerType: name,
            props: {
                expirationInMs: "Never",
                value: props,
            },
        };
        return result;
    } else {
        const result: AttachProps<TimedProps<VisualizeCellProps>> = {
            entity: {
                type: "Cell",
                id: entityId,
            },
            perkName: name,
            triggerType: name,
            props: {
                expirationInMs: "Never",
                value: props,
            },
        };
        return result;
    }
};

const getVisualProps = (
    playerId: number | null,
    players: Player[]
): [VisualizeCellProps, VisualizeBubbleProps] => {
    const cellHideProps: PlayerCellHideProps = new Map();
    const bubbleHideProps: PlayerBubbleHideProps = new Map();
    players
        .filter((pl) => pl.id !== playerId)
        .forEach((pl) => {
            cellHideProps.set(pl.id, {
                ...cellHideUtils.default,
                showUnits: false,
            });
            bubbleHideProps.set(pl.id, {
                ...bubbleHideUtils.default,
                invisible: true,
            });
        });
    const cellProps: VisualizeCellProps = {
        ...visualizeCellUtils.default,
        hideProps: cellHideProps,
    };
    const bubbleProps: VisualizeBubbleProps = {
        ...visualizeBubbleUtils.default,
        hideProps: bubbleHideProps,
    };
    return [cellProps, bubbleProps];
};

export const CamouflagePerk: CreatePerk<number> = {
    name: name,
    createFromValues: (values = defaultValues) => {
        return {
            name: name,
            displayName: name,
            defaultValue: defaultValue,
            values: values,
            description: (lvl) =>
                "The enemy can only see the cell capacity of your cells, but not population or bubble-size.",
            triggers: [
                {
                    type: "CreateBubble",
                    getValue: (
                        trigger,
                        game
                    ): AttachProps<
                        TimedProps<VisualizeBubbleProps | VisualizeCellProps>
                    >[] => {
                        const playerId = trigger.after.bubble.playerId;
                        const val = getPerkValue(
                            game,
                            name,
                            playerId,
                            values,
                            defaultValue
                        );
                        if (val === defaultValue) return [];

                        const [, props] = getVisualProps(
                            playerId,
                            game.players
                        );
                        return [
                            getResultVisualProps(
                                trigger.after.bubble.id,
                                props
                            ),
                        ];
                    },
                },
                {
                    type: "ConquerCell",
                    getValue: (
                        trigger,
                        game
                    ): AttachProps<
                        TimedProps<VisualizeBubbleProps | VisualizeCellProps>
                    >[] => {
                        const playerId = trigger.after.cell.playerId;
                        const val = getPerkValue(
                            game,
                            name,
                            playerId,
                            values,
                            defaultValue
                        );
                        if (val === defaultValue) return [];

                        const [props] = getVisualProps(playerId, game.players);
                        return [
                            getResultVisualProps(trigger.after.cell.id, props),
                        ];
                    },
                },
                {
                    type: "StartGame",
                    getValue: (
                        trigger,
                        game
                    ): AttachProps<
                        TimedProps<VisualizeBubbleProps | VisualizeCellProps>
                    >[] => {
                        return game.players.flatMap((pl) => {
                            const playerId = pl.id;
                            const val = getPerkValue(
                                game,
                                name,
                                playerId,
                                values,
                                defaultValue
                            );
                            if (val === defaultValue) return [];

                            const [props] = getVisualProps(
                                playerId,
                                game.players
                            );
                            return game.cells.flatMap((cell) => {
                                if (cell.playerId === playerId)
                                    return [
                                        getResultVisualProps(cell.id, props),
                                    ];
                                else return [];
                            });
                        });
                    },
                },
            ],
        };
    },
    replay: {
        gameSettings: { mechanics: "basic", updateFrequencyInMs: 25 },
        lengthInMs: 5000,
        map: {
            width: 500,
            height: 500,
            cells: [
                {
                    id: 0,
                    playerId: 0,
                    position: [100, 100],
                    radius: 50,
                    units: 10,
                },
                {
                    id: 1,
                    playerId: 1,
                    position: [400, 100],
                    radius: 50,
                    units: 50,
                },
            ],
            players: 2,
        },
        moveHistory: [
            {
                timestamp: 0,
                data: {
                    type: "sendunitsmove",
                    data: { playerId: 1, senderIds: [1], receiverId: 0 },
                },
            },
        ],
        perks: [
            {
                name: name,
                data: {
                    type: "number",
                    val: defaultValues,
                },
            },
        ],
        players: [
            { id: 0, skills: [] },
            { id: 1, skills: [{ name: name, level: 1 }] },
        ],
    },
};