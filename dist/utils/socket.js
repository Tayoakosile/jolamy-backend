"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("register", (userId) => {
            // use mongoose _id as socket room
            socket.join(userId);
            console.log(`User ${userId} is now listening in their own room`);
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized yet. Call initSocket first.");
    }
    return io;
};
exports.getIO = getIO;
