"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mailerlite_nodejs_1 = __importDefault(require("@mailerlite/mailerlite-nodejs"));
const mailerlite = new mailerlite_nodejs_1.default({
    api_key: process.env.MAILERLITE_API_KEY,
});
const sendEmail = (to, subject, html) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`📧 Dummy email sent to: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML:\n${html}`);
            resolve(true);
        }, 1000);
    });
};
exports.sendEmail = sendEmail;
