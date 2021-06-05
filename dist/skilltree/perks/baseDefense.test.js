"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var spreadGame_1 = require("../../spreadGame");
var baseDefense_1 = require("./baseDefense");
test("test baseDefense", function () {
    var rep = baseDefense_1.BaseDefense.replay;
    var game = spreadGame_1.SpreadGameImplementation.fromReplay(rep);
    game.runReplay(rep, 2000);
    var clientState = game.toClientGameState();
    var cell2 = clientState.cells.find(function (c) { return c.id === 1; });
    expect(cell2 === null || cell2 === void 0 ? void 0 : cell2.playerId).toBe(1);
    game.runReplay(rep, 1000);
    var clientState = game.toClientGameState();
    cell2 = clientState.cells.find(function (c) { return c.id === 1; });
    expect(cell2 === null || cell2 === void 0 ? void 0 : cell2.playerId).toBe(1);
    expect(cell2 === null || cell2 === void 0 ? void 0 : cell2.defenderCombatAbilities).toBe(1.3);
});