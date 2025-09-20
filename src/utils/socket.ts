import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId: string) => {
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
export const getIO = () => {
    if (!io) {
      throw new Error("Socket.io not initialized yet. Call initSocket first.");
    }
    return io;
  };