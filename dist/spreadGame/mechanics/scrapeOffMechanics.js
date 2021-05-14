"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../common");
var entites_1 = require("../entites");
var basicMechanics_1 = __importDefault(require("./basicMechanics"));
var commonMechanics_1 = require("./commonMechanics");
exports.fightBubblePartial = function (att, def, fightModifier, dist) {
    var unitDiff = att - def;
    var maxUnits = common_1.radiusToUnits(dist);
    if (unitDiff >= maxUnits) {
        return [
            Math.pow(((unitDiff + maxUnits) / (2 * dist)), 2) * common_1.radiusToUnitsFixPoint,
            null,
        ];
    }
    else if (unitDiff <= -maxUnits) {
        return [
            null,
            Math.pow(((-unitDiff + maxUnits) / (2 * dist)), 2) * common_1.radiusToUnitsFixPoint,
        ];
    }
    else {
        return [
            Math.pow(((unitDiff + maxUnits) / (2 * dist)), 2) * common_1.radiusToUnitsFixPoint,
            Math.pow(((-unitDiff + maxUnits) / (2 * dist)), 2) * common_1.radiusToUnitsFixPoint,
        ];
    }
};
exports.cellFighters = function (bubbleUnits, bubbleSpace) {
    var fighters = bubbleUnits - common_1.radiusToUnits(bubbleSpace);
    return fighters;
};
var scrapeOffMechanics = {
    collideBubble: function (bubble1, bubble2, fightModifier) {
        if (commonMechanics_1.overlap(bubble1, bubble2) < commonMechanics_1.minOverlap + commonMechanics_1.calculationAccuracy)
            return [bubble1, bubble2];
        if (bubble1.playerId === bubble2.playerId)
            return [bubble1, bubble2];
        var dist = entites_1.distance(bubble1.position, bubble2.position);
        var _a = exports.fightBubblePartial(bubble1.units, bubble2.units, fightModifier, dist), u1 = _a[0], u2 = _a[1];
        if (u1 !== null) {
            bubble1.units = u1;
            bubble1.updateRadius();
        }
        if (u2 !== null) {
            bubble2.units = u2;
            bubble2.updateRadius();
        }
        return [u1 !== null ? bubble1 : null, u2 !== null ? bubble2 : null];
    },
    collideCell: function (bubble, cell, fightModifier) {
        if (commonMechanics_1.overlap(bubble, cell) < commonMechanics_1.minOverlap + commonMechanics_1.calculationAccuracy)
            return bubble;
        // if collides returns true, then dist <= bubble.radius
        var bubbleSpace = entites_1.distance(bubble.position, cell.position) - cell.radius;
        if (bubbleSpace <= commonMechanics_1.calculationAccuracy) {
            return basicMechanics_1.default.collideCell(bubble, cell, fightModifier);
        }
        else {
            var fighters = exports.cellFighters(bubble.units, bubbleSpace);
            // fighters >= here
            if (bubble.playerId === cell.playerId) {
                commonMechanics_1.reinforceCell(cell, fighters);
            }
            else {
                var result = commonMechanics_1.fight(fighters, cell.units, fightModifier);
                commonMechanics_1.takeOverCell(cell, result, bubble.playerId);
            }
            bubble.units -= fighters;
            bubble.updateRadius();
            return bubble;
        }
    },
    move: basicMechanics_1.default.move,
};
exports.default = scrapeOffMechanics;