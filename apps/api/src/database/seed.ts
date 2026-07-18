import { hashPassword } from '../security/password.js';
import { closeDatabase, pool } from './client.js';

const ids = {
  user: '10000000-0000-4000-8000-000000000001',
  organization: '20000000-0000-4000-8000-000000000001',
};

const categories = [
  ['Honoraires', 'income', 'HONORAIRES'], ['Rétrocessions reçues', 'income', 'RETRO_RECUES'],
  ['Loyer et charges', 'expense', 'LOYER'], ['Petit matériel', 'expense', 'MATERIEL'],
  ['Assurances', 'expense', 'ASSURANCES'], ['Cotisations sociales', 'expense', 'COTISATIONS'],
];

const transactions = [
  ['2026-07-16', 'Encaissements CPAM', 'income', 284000, 'HONORAIRES', 'reconciled'],
  ['2026-07-15', 'Rétrocession cabinet République', 'expense', 125000, 'LOYER', 'pending'],
  ['2026-07-14', 'Règlement mutuelle santé', 'income', 96000, 'HONORAIRES', 'reconciled'],
  ['2026-07-12', 'Matériel de soins', 'expense', 18420, 'MATERIEL', 'needs_review'],
  ['2026-06-24', 'Honoraires juin', 'income', 3650000, 'HONORAIRES', 'reconciled'],
  ['2026-05-24', 'Honoraires mai', 'income', 3860000, 'HONORAIRES', 'reconciled'],
  ['2026-04-24', 'Honoraires avril', 'income', 3080000, 'HONORAIRES', 'reconciled'],
  ['2026-03-24', 'Honoraires mars', 'income', 3320000, 'HONORAIRES', 'reconciled'],
  ['2026-02-24', 'Honoraires février', 'income', 2850000, 'HONORAIRES', 'reconciled'],
] as const;

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await hashPassword('Demo123!');
    await client.query(`INSERT INTO app.users (id,email,password_hash,first_name,last_name,profession) VALUES ($1,'demo@paramecompta.fr',$2,'Camille','Martin','IDEL') ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`, [ids.user, passwordHash]);
    await client.query(`INSERT INTO app.organizations (id,name,siret) VALUES ($1,'Cabinet République','12345678901234') ON CONFLICT (id) DO NOTHING`, [ids.organization]);
    await client.query(`INSERT INTO app.memberships (user_id,organization_id,role) VALUES ($1,$2,'owner') ON CONFLICT (user_id,organization_id) DO UPDATE SET role='owner'`, [ids.user, ids.organization]);
    for (const [name, kind, code] of categories) {
      await client.query(`INSERT INTO app.categories (organization_id,name,kind,code,is_default) VALUES ($1,$2,$3,$4,true) ON CONFLICT (organization_id,code) DO UPDATE SET name=EXCLUDED.name,kind=EXCLUDED.kind`, [ids.organization, name, kind, code]);
    }
    for (const [date, label, kind, amount, categoryCode, status] of transactions) {
      await client.query(`INSERT INTO app.transactions (organization_id,created_by,category_id,kind,transaction_date,label,counterparty,amount_cents,status,external_reference) SELECT $1,$2,c.id,$3,$4,$5,$5,$6,$7,$8 FROM app.categories c WHERE c.organization_id=$1 AND c.code=$9 AND NOT EXISTS (SELECT 1 FROM app.transactions t WHERE t.organization_id=$1 AND t.external_reference=$8)`, [ids.organization, ids.user, kind, date, label, amount, status, `demo-${date}-${categoryCode}`, categoryCode]);
    }
    await client.query('COMMIT');
    console.log('Données de démonstration créées : demo@paramecompta.fr / Demo123!');
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally {
    client.release(); await closeDatabase();
  }
}

seed().catch((error) => { console.error('Échec du seed', error); process.exitCode = 1; });
