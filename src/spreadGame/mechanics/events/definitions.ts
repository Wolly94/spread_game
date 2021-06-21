import Bubble from "../../bubble";
import Cell from "../../cell";
import { SpreadMap } from "../../map/map";
import Player from "../../player";
import { SpreadGameImplementation } from "../../spreadGame";
import {
    ConquerCellEffect,
    ConquerCellEvent,
    ConquerCellProps,
} from "./conquerCell";
import { CreateBubbleEffect, CreateBubbleEvent } from "./createBubble";
import {
    DefendCellEffect,
    DefendCellEvent,
    DefendCellProps,
} from "./defendCell";
import {
    BeforeFightEffect,
    BeforeFightEvent,
    BubbleFightProps,
    CellFightProps,
} from "./fight";
import { GrowthEffect, GrowthEvent, GrowthProps } from "./growth";
import { MoveEffect, MoveEvent, MoveProps } from "./move";
import { SendUnitsEffect, SendUnitsEvent, SendUnitsProps } from "./sendUnits";
import {
    StartGameCellProps,
    StartGameEffect,
    StartGameEvent,
} from "./startGame";
import { StolenPerksProps } from "./stolenPerk";
import { TimeStepEffect, TimeStepEvent } from "./timeStep";
import { VisualizeBubbleProps } from "./visualizeBubbleProps";
import { VisualizeCellProps } from "./visualizeCellProps";

export type PropUtils<TProps> = {
    combine: (a: TProps, b: TProps) => TProps;
    collect: (props: SpreadGameProps[]) => TProps;
    default: TProps;
};

export type NewSpreadGameEvent =
    | TimeStepEvent
    | StartGameEvent
    | CreateBubbleEvent
    | SendUnitsEvent
    | ConquerCellEvent
    | DefendCellEvent
    | BeforeFightEvent
    | GrowthEvent
    | MoveEvent;

export type SpreadGameProps =
    | StartGameCellProps
    | ConquerCellProps
    | SendUnitsProps
    | BubbleFightProps
    | CellFightProps
    | DefendCellProps
    | VisualizeCellProps
    | VisualizeBubbleProps
    | GrowthProps
    | MoveProps
    | StolenPerksProps;

export interface TimedProps<TProps> {
    expirationInMs: "Never" | number;
    value: TProps;
}

export interface Entity {
    type: "Player" | "Bubble" | "Cell";
    id: number | null;
}

export type ValueEntity =
    | { type: "Player"; val: Player }
    | { type: "Bubble"; val: Bubble }
    | { type: "Cell"; val: Cell };

export interface AttachProps<TProps> {
    entity: Entity | null;
    perkName: string;
    triggerType: string;
    props: TProps;
}

export interface Effect<TEvent> {
    getValue: (
        trigger: TEvent,
        spreadGame: SpreadGameImplementation
    ) => AttachProps<TimedProps<SpreadGameProps>>[];
}

export type SpreadGameEffect =
    | TimeStepEffect
    | StartGameEffect
    | ConquerCellEffect
    | SendUnitsEffect
    | CreateBubbleEffect
    | DefendCellEffect
    | BeforeFightEffect
    | GrowthEffect
    | MoveEffect;

/*

Events:

*/
