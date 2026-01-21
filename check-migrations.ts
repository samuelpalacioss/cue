import { client } from './src/db/index';

async function checkMigrations() {
  try {
    const result = await client`
      SELECT * FROM __drizzle_migrations ORDER BY id;
    `;
    console.log('Applied migrations:');
    console.table(result);

    if (result.length === 0) {
      console.log('\nNo migrations have been applied yet.');
    }
  } catch (error) {
    console.error('Error checking migrations:', error);
  } finally {
    await client.end();
  }
}

checkMigrations();
