"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
// Runs every Sunday at 11:59 PM
node_cron_1.default.schedule("59 23 * * 0", () => {
    console.log("Running weekly bonus calculation at", new Date());
    // call your bonus calculation service here
});
