import { env } from "@/src/utils/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/src/db/schema";


const connectionString = process.env.DATABASE_URL!;

// Create the postgres client
const client = postgres(connectionString, { prepare: false })

// Create the drizzle database instance
// Keep SQL logs off by default; enable with DB_LOGGER=true when needed
const db = drizzle(client);

export default db;
export { client };
