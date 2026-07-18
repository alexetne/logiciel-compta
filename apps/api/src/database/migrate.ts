import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closeDatabase, pool } from './client.js';

const migrationDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS app');
    await client.query(`CREATE TABLE IF NOT EXISTS app.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = await client.query<{ version: string }>('SELECT version FROM app.schema_migrations');
    const appliedVersions = new Set(applied.rows.map((row) => row.version));
    const files = (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      if (appliedVersions.has(file)) continue;
      console.log(`Application de ${file}…`);
      await client.query('BEGIN');
      try {
        await client.query(await readFile(join(migrationDirectory, file), 'utf8'));
        await client.query('INSERT INTO app.schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log('Base de données à jour.');
  } finally {
    client.release();
    await closeDatabase();
  }
}

migrate().catch((error) => {
  console.error('Échec de la migration', error);
  process.exitCode = 1;
});
