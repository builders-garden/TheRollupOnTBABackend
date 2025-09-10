import { env } from "../config/env";

export const baseOrigins = ["https://tba.rollup.com", "https://dev.rollup.com"];
export const localOrigins = [
	"http://localhost:3000",
	env.APP_URL ?? "http://localhost:3000",
];
