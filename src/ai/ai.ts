import {
  ClientCell,
  ClientGameState,
} from "../messages/inGame/clientGameState";
import { SendUnitsMessage } from "../messages/inGame/clientInGameMessage";
import { Move } from "../messages/replay/replay";

export interface Ai {
  getMove: (state: ClientGameState, playerId: number) => Move | null;
}

const availableAttackers = (cell: ClientCell) => {
  return cell.units / 2;
};

const estimatedDefenders = (attacker: ClientCell, defender: ClientCell) => {
  return defender.units;
};

export class GreedyAi implements Ai {
  getMove(state: ClientGameState, playerId: number) {
    const myCells = state.cells
      .filter((c) => c.playerId === playerId)
      .filter((c) => c.units >= 15)
      // strongest cells first
      .sort((c1, c2) => c2.units - c1.units);
    const weakestUnownedCells = state.cells
      .filter((c) => c.playerId !== playerId)
      // weakest cells first
      .sort((c1, c2) => c1.units - c2.units);

    if (weakestUnownedCells.length === 0) return null;
    const weakestUnownedCell = weakestUnownedCells[0];
    let senderIds: number[] = [];
    const attackers = myCells.reduce((units, cell) => {
      if (units - 1 < weakestUnownedCell.units) {
        senderIds.push(cell.id);
        return units + availableAttackers(cell);
      } else {
        return units;
      }
    }, 0);
    if (attackers < weakestUnownedCell.units) return null;

    const result: SendUnitsMessage = {
      type: "sendunits",
      data: { receiverId: weakestUnownedCell.id, senderIds: senderIds },
    };

    return result;
  }
}