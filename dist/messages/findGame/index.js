"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var findGameClient = __importStar(require("./findGameClientMessages"));
exports.findGameClient = findGameClient;
var findGameServer = __importStar(require("./findGameServerMessages"));
exports.findGameServer = findGameServer;
