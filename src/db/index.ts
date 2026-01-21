import { env } from "@/src/utils/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/src/db/schema";

// Create the postgres client
const client = postgres(env.DATABASE_URL!);

// Create the drizzle database instance
// Keep SQL logs off by default; enable with DB_LOGGER=true when needed
const db = drizzle(client, { schema, logger: env.DB_LOGGER === 'true' });

export default db;
export { client };
