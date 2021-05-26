"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var attack_1 = require("../skilltree/attack/attack");
var cell_1 = __importDefault(require("./cell"));
var spreadGame_1 = require("./spreadGame");
var createMapHelper = function (cells) {
    return {
        height: 1000,
        width: 1000,
        players: 10,
        cells: cells,
    };
};
var calculatedCollisionTimeInMs = function (b1, b2) {
    var distance = Math.sqrt(Math.pow((b1.position[0] - b2.position[0]), 2) +
        Math.pow((b1.position[1] - b2.position[1]), 2));
    return (distance / 2 / b1.speed) * 1000;
};
test("bubble collision", function () {
    var cells = [
        new cell_1.default(0, 0, [100, 100], 50, 50),
        new cell_1.default(1, 1, [400, 500], 50, 50),
    ];
    var gameState = new spreadGame_1.SpreadGameImplementation(createMapHelper(cells), {
        mechanics: "basic",
    }, [
        { id: 0, skills: [] },
        { id: 1, skills: [] },
    ]);
    gameState.sendUnits(0, [0], 1);
    gameState.sendUnits(1, [1], 0);
    expect(gameState.bubbles.length).toBe(2);
    var b1 = gameState.bubbles[0];
    var b2 = gameState.bubbles[1];
    var ms = calculatedCollisionTimeInMs(b1, b2);
    gameState.step(ms);
    expect(gameState.bubbles.length).toBe(0);
});
test("bubble collision with attack modifier", function () {
    var x = 10;
    var cells = [
        new cell_1.default(0, 0, [100, 100], 50, 50),
        new cell_1.default(1, 1, [400, 500], 50, 50),
    ];
    var gameState = new spreadGame_1.SpreadGameImplementation(createMapHelper(cells), {
        mechanics: "basic",
    }, [
        {
            id: 0,
            skills: [{ level: 1, perk: attack_1.BaseAttack }],
        },
        { id: 1, skills: [] },
    ]);
    gameState.sendUnits(0, [0], 1);
    gameState.sendUnits(1, [1], 0);
    expect(gameState.bubbles.length).toBe(2);
    var b1 = gameState.bubbles[0];
    var b2 = gameState.bubbles[1];
    var ms = calculatedCollisionTimeInMs(b1, b2);
    gameState.step(ms);
    expect(gameState.bubbles.length).toBe(1);
    var remBubble = gameState.bubbles[0];
    expect(remBubble.playerId).toBe(0);
});