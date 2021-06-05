"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../../spreadGame/common");
var utils_1 = require("../utils");
var name = "Preparation";
var values = [1, 2];
var simpleMap = {
    width: 500,
    height: 500,
    cells: [
        {
            id: 0,
            playerId: 0,
            position: [100, 100],
            radius: common_1.unitsToRadius(204),
            units: 204,
        },
        {
            id: 1,
            playerId: 1,
            position: [400, 100],
            radius: common_1.unitsToRadius(100),
            units: 100,
        },
    ],
    players: 2,
};
var replay = {
    gameSettings: { mechanics: "basic", updateFrequencyInMs: 25 },
    lengthInMs: 5000,
    map: simpleMap,
    players: [
        { id: 0, skills: [] },
        { id: 1, skills: [{ name: name, level: 2 }] },
    ],
    moveHistory: [
        {
            timestamp: 2000,
            data: {
                type: "sendunitsmove",
                data: { playerId: 0, senderIds: [0], receiverId: 1 },
            },
        },
    ],
};
var latestMoveTimeStamp = function (cell, eventHistory) {
    var lastAttackSent = eventHistory
        .filter(function (ev) {
        return ev.data.type === "SendBubbleEvent" && ev.data.sender.id === cell.id;
    })
        .slice(-1)[0];
    var lastConquered = eventHistory
        .filter(function (ev) { return ev.data.type === "LostCell" && ev.data.cellId === cell.id; })
        .slice(-1)[0];
    var latestTimeStamp = Math.max(lastAttackSent === undefined ? 0 : lastAttackSent.timestamp, lastConquered === undefined ? 0 : lastConquered.timestamp);
    return latestTimeStamp;
};
exports.Preparation = {
    name: name,
    values: values,
    description: "Raises combat abilities of your cells by " +
        utils_1.formatDescription(values, function (val) { return val.toString() + "%"; }, "/") +
        " for each second that cell did not send an attack.",
    effect: [
        {
            type: "DefenderFightEffect",
            getValue: function (lvl, defender, spreadGame) {
                if (lvl <= 0)
                    return { combatAbilityModifier: 0 };
                else {
                    var idleSince = latestMoveTimeStamp(defender, spreadGame.eventHistory);
                    return {
                        combatAbilityModifier: (values[Math.min(lvl, values.length) - 1] *
                            (spreadGame.timePassed - idleSince)) /
                            1000,
                    };
                }
            },
        },
    ],
    replay: replay,
};