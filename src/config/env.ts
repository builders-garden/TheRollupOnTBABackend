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

  // Application
  APP_URL: z.string().url().optional().default("https://rollup.com"),

  // API Security
  API_SECRET_KEY: z.string().optional(),

  // Smart Contract
  BACKEND_PRIVATE_KEY: z.string().optional(),

  // Turso Database
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_DATABASE_TOKEN: z.string(),

  // Redis
  REDIS_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
