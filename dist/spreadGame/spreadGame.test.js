"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var baseAttack_1 = require("../skilltree/perks/baseAttack");
var basicMechanics_1 = require("./mechanics/basicMechanics");
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
    return (distance / 2 / basicMechanics_1.defaultSpeed) * 1000;
};
test("cell collision", function () {
    var _a;
    var cells = [
        { id: 0, playerId: 0, position: [100, 100], radius: 50, units: 50 },
        { id: 1, playerId: 1, position: [400, 500], radius: 50, units: 50 },
    ];
    var gameState = new spreadGame_1.SpreadGameImplementation(createMapHelper(cells), {
        mechanics: "basic",
        updateFrequencyInMs: 50,
    }, [
        { id: 0, skills: [] },
        { id: 1, skills: [] },
    ]);
    gameState.sendUnits(0, [0], 1);
    expect(gameState.bubbles.length).toBe(1);
    gameState.run(10000, 25);
    expect(gameState.bubbles.length).toBe(0);
    var sendUnitsEvent = gameState.eventHistory.find(function (ev) { return ev.data.type === "SendBubbleEvent"; });
    var fightEvent = (_a = gameState.eventHistory.find(function (ev) { return ev.data.type === "FightEvent"; })) === null || _a === void 0 ? void 0 : _a.data;
    var defeatBubbleEvent = gameState.eventHistory.find(function (ev) { return ev.data.type === "DefeatedBubble"; });
    expect(sendUnitsEvent === null || sendUnitsEvent === void 0 ? void 0 : sendUnitsEvent.timestamp).not.toBe(undefined);
    expect(fightEvent === null || fightEvent === void 0 ? void 0 : fightEvent.finished).toBe(true);
    expect(defeatBubbleEvent === null || defeatBubbleEvent === void 0 ? void 0 : defeatBubbleEvent.timestamp).not.toBe(undefined);
    expect(gameState.eventHistory.length).toBe(3);
});
test("bubble collision", function () {
    var _a;
    var cells = [
        { id: 0, playerId: 0, position: [100, 100], radius: 50, units: 50 },
        { id: 1, playerId: 1, position: [400, 500], radius: 50, units: 50 },
    ];
    var gameState = new spreadGame_1.SpreadGameImplementation(createMapHelper(cells), {
        mechanics: "basic",
        updateFrequencyInMs: 50,
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
    gameState.run(5000, 25);
    expect(gameState.bubbles.length).toBe(0);
    var sendUnitsEvent = gameState.eventHistory.find(function (ev) { return ev.data.type === "SendBubbleEvent"; });
    var fightEvent = (_a = gameState.eventHistory.find(function (ev) { return ev.data.type === "FightEvent"; })) === null || _a === void 0 ? void 0 : _a.data;
    var defeatBubbleEvent = gameState.eventHistory.find(function (ev) { return ev.data.type === "DefeatedBubble"; });
    expect(gameState.eventHistory.filter(function (ev) { return ev.data.type === "SendBubbleEvent"; })
        .length).toBe(2);
    expect(gameState.eventHistory.filter(function (ev) { return ev.data.type === "FightEvent"; }).length).toBe(1);
    expect(gameState.eventHistory.filter(function (ev) { return ev.data.type === "DefeatedBubble"; })
        .length).toBe(2);
    expect(gameState.eventHistory.length).toBe(5);
});
test("bubble collision with attack modifier", function () {
    var x = 10;
    var cells = [
        { id: 0, playerId: 0, position: [100, 100], radius: 50, units: 50 },
        { id: 1, playerId: 1, position: [400, 500], radius: 50, units: 50 },
    ];
    var gameState = new spreadGame_1.SpreadGameImplementation(createMapHelper(cells), {
        updateFrequencyInMs: 50,
        mechanics: "basic",
    }, [
        {
            id: 0,
            skills: [{ level: 1, perk: baseAttack_1.BaseAttack }],
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
