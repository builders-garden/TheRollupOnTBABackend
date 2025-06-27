import { env } from "../config/env";

export const baseOrigins = [
	"https://checkmat.es",
	"https://dev-checkmates.vercel.app",
];
export const localOrigins = [
	"http://localhost:3000",
	env.APP_URL ?? "http://localhost:3000",
];
