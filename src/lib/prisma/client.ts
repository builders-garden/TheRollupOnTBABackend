import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";

const adapter = new PrismaLibSQL({
	url: env.LIBSQL_DATABASE_URL,
	authToken: env.LIBSQL_DATABASE_TOKEN,
});
export const prisma = new PrismaClient({ adapter });
