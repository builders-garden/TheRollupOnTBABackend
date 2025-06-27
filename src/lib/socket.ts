import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const setIOInstance = (instance: SocketIOServer) => {
	io = instance;
};

export const getIOInstance = (): SocketIOServer => {
	if (!io) {
		throw new Error("Socket.IO instance not initialized");
	}
	return io;
};
