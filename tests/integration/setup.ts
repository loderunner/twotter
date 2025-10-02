import * as childProcess from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(childProcess.exec);

/**
 * Setup function that runs before all integration tests.
 * Seeds the database with deterministic data.
 */
export async function setupIntegrationTests() {
  console.log('Running database migrations and seeding...');

  try {
    await exec('pnpm run db:migrate');
    await exec('pnpm run db:seed:integration');
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Failed to setup database:', error);
    throw error;
  }
}
