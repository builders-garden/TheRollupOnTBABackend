import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	// Server
	PORT: z
		.string()
		.transform((val) => Number.parseInt(val, 10))
		.default("3000"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	// Database
	LIBSQL_DATABASE_URL: z.string().min(1),
	LIBSQL_DATABASE_TOKEN: z.string().min(1),

	// Neynar
	NEYNAR_API_KEY: z.string().min(1),

	// Application
	APP_URL: z.string().url().optional().default("https://checkmat.es"),

	// API Security
	API_SECRET_KEY: z.string().min(1),

	// Daimo Pay
	DAIMO_PAY_API_KEY: z.string().min(1),

	// Smart Contract
	BACKEND_PRIVATE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
