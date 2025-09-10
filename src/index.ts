import cookieParserMiddleware from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morganLogger from "morgan";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env";
import {
	JoinStreamHandler,
	TipSentHandler,
	TokenTradedHandler,
	VoteCastedHandler,
	StartSentimentPollHandler,
	EndSentimentPollHandler,
} from "./handlers";
import { baseOrigins, localOrigins } from "./lib/cors";
import { setIOInstance } from "./lib/socket";
import { handleError, handleNotFound } from "./middleware/error.middleware";
import responseMiddleware from "./middleware/response";
import type {
	EndSentimentPollEvent,
	JoinStreamEvent,
	StartSentimentPollEvent,
	TipSentEvent,
	TokenTradedEvent,
	VoteCastedEvent,
} from "./types";
import { ClientToServerSocketEvents } from "./types/enums";

// Load environment variables
dotenv.config();

const app = express();

const allowedOrigins =
	env.NODE_ENV === "development"
		? [...baseOrigins, ...localOrigins]
		: baseOrigins;

// Middleware
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
	}),
);
app.use(cookieParserMiddleware());
app.use(express.json());
app.use(helmet());
app.use(morganLogger("dev"));
app.use(responseMiddleware);

// Create HTTP server to attach socket.io
const httpServer = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: allowedOrigins,
		// credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
	},
});

// Set the Socket.IO instance
setIOInstance(io);

// Socket.IO connection logic
io.on("connection", (socket) => {
	console.log("0. client connected:", socket.id);

	socket.on(
		ClientToServerSocketEvents.JOIN_STREAM,
		async (data: JoinStreamEvent) => {
			const handler = new JoinStreamHandler(socket, io);
			await handler.handle(data);
		},
	);

	socket.on(ClientToServerSocketEvents.TIP_SENT, async (data: TipSentEvent) => {
		const handler = new TipSentHandler(socket, io);
		await handler.handle(data);
	});

	socket.on(
		ClientToServerSocketEvents.TOKEN_TRADED,
		async (data: TokenTradedEvent) => {
			const handler = new TokenTradedHandler(socket, io);
			await handler.handle(data);
		},
	);

	socket.on(
		ClientToServerSocketEvents.VOTE_CASTED,
		async (data: VoteCastedEvent) => {
			const handler = new VoteCastedHandler(socket, io);
			await handler.handle(data);
		},
	);

	socket.on(
		ClientToServerSocketEvents.START_SENTIMENT_POLL,
		async (data: StartSentimentPollEvent) => {
			const handler = new StartSentimentPollHandler(socket, io);
			await handler.handle(data);
		},
	);

	socket.on(
		ClientToServerSocketEvents.END_SENTIMENT_POLL,
		async (data: EndSentimentPollEvent) => {
			const handler = new EndSentimentPollHandler(socket, io);
			await handler.handle(data);
		},
	);

	// disconnect
	socket.on("disconnect", async () => {
		console.log("user disconnected:", socket.id);
	});
});

// Health check route (unprotected)
app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

// Use custom middlewares for handling 404 and errors
app.use(handleNotFound);
app.use(handleError);

// Start HTTP server (not app.listen anymore)
const port = env.PORT;
httpServer.listen(port, () => {
	console.log(`🚀 Server with WS enabled is running on port ${port}`);
});

// Cleanup on server shutdown
process.on("SIGINT", () => {
	console.log("Shutting down server...");
	httpServer.close();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("Shutting down server...");
	httpServer.close();
	process.exit(0);
});
