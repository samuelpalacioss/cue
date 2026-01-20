import "dotenv/config";
import { fileURLToPath } from "url";
import db, { client } from ".";
import { sql } from "drizzle-orm";
import {
  users,
  clients,
  organizations,
  durations,
  persons,
  events,
  eventOptions,
  prices,
  bookings,
  payments,
  userCustomers,
  availabilitySchedules,
} from "./schema";

async function deleteData() {
  console.log("🧹 Cleaning up existing data...");

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraint violations
    // Wrap each delete in try-catch to handle cases where tables might not exist
    const deleteOperations = [
      { name: "payments", fn: () => db.delete(payments) },
      { name: "bookings", fn: () => db.delete(bookings) },
      { name: "prices", fn: () => db.delete(prices) },
      { name: "eventOptions", fn: () => db.delete(eventOptions) },
      { name: "availabilitySchedules", fn: () => db.delete(availabilitySchedules) },
      { name: "events", fn: () => db.delete(events) },
      { name: "userCustomers", fn: () => db.delete(userCustomers) },
      { name: "users", fn: () => db.delete(users) },
      { name: "clients", fn: () => db.delete(clients) },
      { name: "persons", fn: () => db.delete(persons) },
      { name: "durations", fn: () => db.delete(durations) },
      { name: "organizations", fn: () => db.delete(organizations) },
    ];

    for (const op of deleteOperations) {
      try {
        await op.fn();
      } catch (error: any) {
        // If table doesn't exist, skip it (might have been dropped already)
        if (error?.code === "42P01" || error?.cause?.code === "42P01") {
          console.log(`  ⚠️  Table ${op.name} does not exist, skipping...`);
          continue;
        }
        throw error;
      }
    }

    console.log("✅ Cleanup complete");

    // Reset all ID sequences to start from 1
    console.log("🔄 Resetting sequences...");
    const sequences = await client`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      AND sequence_name LIKE '%_id_seq'
    `;

    for (const seq of sequences) {
      const sequenceName = seq.sequence_name;
      await db.execute(sql.raw(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1`));
    }

    console.log(`✅ Reset ${sequences.length} sequences`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

/**
 * Drop all tables from the database
 * This will completely remove all tables, sequences, and related database objects
 * Use with caution - this is destructive!
 */
async function dropAllTables() {
  console.log("🗑️ Dropping all tables...");

  try {
    // Get all table names from the public schema
    const tables = await client`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      console.log("ℹ️ No tables found to drop");
      return;
    }

    console.log(`Found ${tables.length} tables to drop`);

    // Drop all tables with CASCADE to handle foreign key dependencies
    // CASCADE will automatically drop dependent objects (foreign keys, indexes, etc.)
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`  Dropping table: ${tableName}`);
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
    }

    // Also drop all sequences (they might not be dropped with CASCADE in some cases)
    const sequences = await client`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `;

    for (const seq of sequences) {
      const sequenceName = seq.sequence_name;
      console.log(`  Dropping sequence: ${sequenceName}`);
      await db.execute(sql.raw(`DROP SEQUENCE IF EXISTS "${sequenceName}" CASCADE`));
    }

    // Drop all enums (they might persist after dropping tables)
    const enums = await client`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
    `;

    for (const enumType of enums) {
      const enumName = enumType.enum_name;
      console.log(`  Dropping enum: ${enumName}`);
      await db.execute(sql.raw(`DROP TYPE IF EXISTS "${enumName}" CASCADE`));
    }

    console.log("✅ All tables, sequences, and enums dropped successfully");
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
    throw error;
  }
}

// Run if called directly (check if this file is the main module)
const isMainModule = 
  import.meta.url === `file://${process.argv[1]}` ||
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1]?.endsWith('delete.ts') ||
  process.argv[1]?.includes('delete.ts');

if (isMainModule) {
  // Check command line arguments to determine which function to run
  const args = process.argv.slice(2);
  const shouldDropTables = args.includes("--drop-tables") || args.includes("-d");

  if (shouldDropTables) {
    dropAllTables()
      .then(() => {
        console.log("✅ Drop tables script completed successfully");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Drop tables script failed:", error);
        process.exit(1);
      });
  } else {
    deleteData()
      .then(() => {
        console.log("✅ Delete script completed successfully");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Delete script failed:", error);
        process.exit(1);
      });
  }
}

export default deleteData;
export { dropAllTables };