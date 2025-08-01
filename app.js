"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var mongoose_1 = require("mongoose");
var body_parser_1 = require("body-parser");
// Initialize the app
var app = (0, express_1.default)();
// Middleware to parse JSON data
app.use(body_parser_1.default.json());
// Connect to MongoDB
mongoose_1.default
    .connect("mongodb://localhost:27017/mydatabase")
    .then(function () { return console.log("MongoDB connected"); })
    .catch(function (err) { return console.log("MongoDB connection error:", err); });
// Define a basic route
app.get("/", function (req, res) {
    res.send("Hello, Express with MongoDB!");
});
// Start the server
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
