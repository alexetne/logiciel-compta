import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

import { parse } from 'csv-parse/sync';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { audit } from './audit.js';
import { config } from './config.js';
import { pool } from './database/client.js';
import { calculatePercentageRetrocession } from './domain/retrocession.js';
import { type AuthenticatedRequest, HttpError, requireAuth, requireRole } from './http.js';
import { hashPassword, verifyPassword } from './security/password.js';
import { createToken } from './security/token.js';

export const apiRouter = Router();

const emailSchema = z.string().trim().toLowerCase().email();
const loginSchema = z.object({ email: emailSchema, password: z.string().min(8) });
const registerSchema = loginSchema.extend({ firstName: z.string().trim().min(2), lastName: z.string().trim().min(2), organizationName: z.string().trim().min(2), profession: z.string().trim().optional() });

apiRouter.post('/auth/login', async (request, response) => {
  const input = loginSchema.parse(request.body);
  const result = await pool.query(`SELECT u.id,u.email,u.password_hash,u.first_name,u.last_name,m.organization_id,m.role,o.name organization_name FROM app.users u JOIN app.memberships m ON m.user_id=u.id JOIN app.organizations o ON o.id=m.organization_id WHERE u.email=$1 ORDER BY m.created_at LIMIT 1`, [input.email]);
  const user = result.rows[0];
  if (!user || !await verifyPassword(input.password, user.password_hash as string)) throw new HttpError(401, 'Identifiants invalides');
  const token = await createToken({ userId: user.id, organizationId: user.organization_id, role: user.role });
  await audit(user.organization_id, user.id, 'auth.login', 'user', user.id);
  response.json({ token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name }, organization: { id: user.organization_id, name: user.organization_name, role: user.role } });
});

apiRouter.post('/auth/register', async (request, response) => {
  const input = registerSchema.parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT 1 FROM app.users WHERE email=$1', [input.email]);
    if (existing.rowCount) throw new HttpError(409, 'Cette adresse e-mail est déjà utilisée');
    const user = (await client.query(`INSERT INTO app.users (email,password_hash,first_name,last_name,profession) VALUES ($1,$2,$3,$4,$5) RETURNING id,email,first_name,last_name`, [input.email, await hashPassword(input.password), input.firstName, input.lastName, input.profession ?? null])).rows[0];
    const organization = (await client.query(`INSERT INTO app.organizations (name) VALUES ($1) RETURNING id,name`, [input.organizationName])).rows[0];
    await client.query(`INSERT INTO app.memberships (user_id,organization_id,role) VALUES ($1,$2,'owner')`, [user.id, organization.id]);
    const defaults = [['Honoraires','income','HONORAIRES'],['Loyer et charges','expense','LOYER'],['Petit matériel','expense','MATERIEL'],['Assurances','expense','ASSURANCES'],['Cotisations sociales','expense','COTISATIONS']];
    for (const category of defaults) await client.query(`INSERT INTO app.categories (organization_id,name,kind,code,is_default) VALUES ($1,$2,$3,$4,true)`, [organization.id, ...category]);
    await client.query(`INSERT INTO app.audit_events (organization_id,actor_id,action,entity_type,entity_id) VALUES ($1,$2,'organization.created','organization',$1)`, [organization.id, user.id]);
    await client.query('COMMIT');
    response.status(201).json({ token: await createToken({ userId: user.id, organizationId: organization.id, role: 'owner' }), user, organization: { ...organization, role: 'owner' } });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

apiRouter.use(requireAuth);

apiRouter.get('/me', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const result = await pool.query(`SELECT u.id,u.email,u.first_name "firstName",u.last_name "lastName",u.profession,o.id "organizationId",o.name "organizationName",m.role FROM app.users u JOIN app.memberships m ON m.user_id=u.id JOIN app.organizations o ON o.id=m.organization_id WHERE u.id=$1 AND o.id=$2`, [session.userId, session.organizationId]);
  response.json(result.rows[0]);
});

apiRouter.get('/organizations/members', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const result = await pool.query(`SELECT u.id,u.email,u.first_name "firstName",u.last_name "lastName",u.profession,m.role,m.created_at "createdAt" FROM app.memberships m JOIN app.users u ON u.id=m.user_id WHERE m.organization_id=$1 ORDER BY u.last_name`, [session.organizationId]);
  response.json({ items: result.rows });
});

apiRouter.patch('/organizations/members/:userId', requireRole('owner', 'admin'), async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const role = z.object({ role: z.enum(['admin','practitioner','manager','reader']) }).parse(request.body).role;
  const result = await pool.query(`UPDATE app.memberships SET role=$1 WHERE user_id=$2 AND organization_id=$3 AND role<>'owner' RETURNING user_id,role`, [role, request.params.userId, session.organizationId]);
  if (!result.rowCount) throw new HttpError(404, 'Membre introuvable ou propriétaire non modifiable');
  await audit(session.organizationId, session.userId, 'membership.role_updated', 'user', String(request.params.userId), { role });
  response.json(result.rows[0]);
});

apiRouter.get('/categories', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const kind = z.enum(['income','expense']).optional().parse(request.query.kind);
  const result = await pool.query(`SELECT id,name,kind,code,is_default "isDefault" FROM app.categories WHERE organization_id=$1 AND ($2::text IS NULL OR kind=$2) ORDER BY kind,name`, [session.organizationId, kind ?? null]);
  response.json({ items: result.rows });
});

const retrocessionRuleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  rate: z.number().min(0).max(100),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date().nullable().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
}).refine((input) => !input.effectiveTo || input.effectiveTo >= input.effectiveFrom, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['effectiveTo'],
});

apiRouter.get('/retrocession-rules', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const result = await pool.query(`SELECT id,name,rate::float8,effective_from "effectiveFrom",effective_to "effectiveTo",status,created_at "createdAt",updated_at "updatedAt" FROM app.retrocession_rules WHERE organization_id=$1 ORDER BY status='active' DESC,effective_from DESC,created_at DESC`, [session.organizationId]);
  response.json({ items: result.rows });
});

apiRouter.post('/retrocession-rules', requireRole('owner','admin','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const input = retrocessionRuleSchema.parse(request.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (input.status === 'active') await client.query(`UPDATE app.retrocession_rules SET status='archived',updated_at=now() WHERE organization_id=$1 AND status='active'`, [session.organizationId]);
    const result = await client.query(`INSERT INTO app.retrocession_rules (organization_id,name,rate,effective_from,effective_to,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,rate::float8,effective_from "effectiveFrom",effective_to "effectiveTo",status,created_at "createdAt"`, [session.organizationId,input.name,input.rate,input.effectiveFrom,input.effectiveTo ?? null,input.status,session.userId]);
    await client.query('COMMIT');
    await audit(session.organizationId,session.userId,'retrocession_rule.created','retrocession_rule',result.rows[0].id,{ rate: input.rate, status: input.status });
    response.status(201).json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

apiRouter.patch('/retrocession-rules/:id/activate', requireRole('owner','admin','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rule = await client.query('SELECT id FROM app.retrocession_rules WHERE id=$1 AND organization_id=$2', [request.params.id,session.organizationId]);
    if (!rule.rowCount) throw new HttpError(404,'Règle de rétrocession introuvable');
    await client.query(`UPDATE app.retrocession_rules SET status='archived',updated_at=now() WHERE organization_id=$1 AND status='active'`, [session.organizationId]);
    const result = await client.query(`UPDATE app.retrocession_rules SET status='active',updated_at=now() WHERE id=$1 RETURNING id,name,rate::float8,effective_from "effectiveFrom",effective_to "effectiveTo",status`, [request.params.id]);
    await client.query('COMMIT');
    await audit(session.organizationId,session.userId,'retrocession_rule.activated','retrocession_rule',String(request.params.id));
    response.json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

apiRouter.post('/categories', requireRole('owner','admin','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const input = z.object({ name: z.string().trim().min(2), kind: z.enum(['income','expense']), code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]+$/) }).parse(request.body);
  const result = await pool.query(`INSERT INTO app.categories (organization_id,name,kind,code) VALUES ($1,$2,$3,$4) RETURNING id,name,kind,code`, [session.organizationId, input.name, input.kind, input.code]);
  await audit(session.organizationId, session.userId, 'category.created', 'category', result.rows[0].id);
  response.status(201).json(result.rows[0]);
});

const transactionSchema = z.object({ kind: z.enum(['income','expense']), transactionDate: z.iso.date(), label: z.string().trim().min(2), counterparty: z.string().trim().optional(), amountCents: z.number().int().positive(), categoryId: z.uuid().optional(), paymentMethod: z.enum(['bank_transfer','card','cash','check']).default('bank_transfer') });

apiRouter.get('/transactions', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const query = z.object({ kind: z.enum(['income','expense']).optional(), categoryId: z.uuid().optional(), status: z.enum(['pending','reconciled','needs_review']).optional(), search: z.string().trim().max(100).optional(), from: z.iso.date().optional(), to: z.iso.date().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(25) }).parse(request.query);
  const values: unknown[] = [session.organizationId]; const conditions = ['t.organization_id=$1'];
  const add = (sql: string, value: unknown) => { values.push(value); conditions.push(sql.replace('?', `$${values.length}`)); };
  if (query.kind) add('t.kind=?', query.kind); if (query.categoryId) add('t.category_id=?', query.categoryId); if (query.status) add('t.status=?', query.status);
  if (query.search) { values.push(`%${query.search}%`); conditions.push(`(t.label ILIKE $${values.length} OR t.counterparty ILIKE $${values.length})`); }
  if (query.from) add('t.transaction_date>=?', query.from); if (query.to) add('t.transaction_date<=?', query.to);
  values.push(query.limit, (query.page - 1) * query.limit);
  const result = await pool.query(`SELECT t.id,t.kind,to_char(t.transaction_date,'YYYY-MM-DD') "transactionDate",t.label,t.counterparty,t.amount_cents::int "amountCents",t.payment_method "paymentMethod",t.status,c.id "categoryId",c.name "categoryName",COUNT(*) OVER()::int total FROM app.transactions t LEFT JOIN app.categories c ON c.id=t.category_id WHERE ${conditions.join(' AND ')} ORDER BY t.transaction_date DESC,t.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  response.json({ items: result.rows.map((row) => ({ id: row.id, kind: row.kind, transactionDate: row.transactionDate, label: row.label, counterparty: row.counterparty, amountCents: row.amountCents, paymentMethod: row.paymentMethod, status: row.status, categoryId: row.categoryId, categoryName: row.categoryName })), total: result.rows[0]?.total ?? 0, page: query.page, limit: query.limit });
});

apiRouter.post('/transactions', requireRole('owner','admin','practitioner','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest; const input = transactionSchema.parse(request.body);
  if (input.categoryId) { const allowed = await pool.query('SELECT 1 FROM app.categories WHERE id=$1 AND organization_id=$2 AND kind=$3', [input.categoryId, session.organizationId, input.kind]); if (!allowed.rowCount) throw new HttpError(400, 'Catégorie incompatible'); }
  const result = await pool.query(`INSERT INTO app.transactions (organization_id,created_by,category_id,kind,transaction_date,label,counterparty,amount_cents,payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,kind,to_char(transaction_date,'YYYY-MM-DD') "transactionDate",label,amount_cents::int "amountCents",status`, [session.organizationId, session.userId, input.categoryId ?? null, input.kind, input.transactionDate, input.label, input.counterparty ?? null, input.amountCents, input.paymentMethod]);
  await audit(session.organizationId, session.userId, 'transaction.created', 'transaction', result.rows[0].id, { kind: input.kind, amountCents: input.amountCents });
  response.status(201).json(result.rows[0]);
});

apiRouter.patch('/transactions/:id/reconcile', requireRole('owner','admin','practitioner','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest; const status = z.object({ status: z.enum(['pending','reconciled','needs_review']) }).parse(request.body).status;
  const result = await pool.query(`UPDATE app.transactions SET status=$1,updated_at=now() WHERE id=$2 AND organization_id=$3 RETURNING id,status`, [status, request.params.id, session.organizationId]);
  if (!result.rowCount) throw new HttpError(404, 'Transaction introuvable');
  await audit(session.organizationId, session.userId, 'transaction.status_updated', 'transaction', String(request.params.id), { status }); response.json(result.rows[0]);
});

apiRouter.post('/imports/csv', requireRole('owner','admin','practitioner','manager'), async (request, response) => {
  const { session } = request as AuthenticatedRequest; const csv = z.object({ csv: z.string().min(1).max(2_000_000) }).parse(request.body).csv;
  const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true, delimiter: [';', ','] }) as Record<string,string>[];
  const rowSchema = z.object({ date: z.iso.date(), label: z.string().min(2), amount: z.coerce.number().positive(), kind: z.enum(['income','expense']), category: z.string().optional() });
  let imported = 0; const errors: { row: number; message: string }[] = [];
  for (const [index, record] of records.entries()) {
    try { const row = rowSchema.parse(record); const category = row.category ? await pool.query('SELECT id FROM app.categories WHERE organization_id=$1 AND (code=$2 OR lower(name)=lower($2)) AND kind=$3 LIMIT 1', [session.organizationId,row.category,row.kind]) : null;
      await pool.query(`INSERT INTO app.transactions (organization_id,created_by,category_id,kind,transaction_date,label,amount_cents,status,imported_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'needs_review',now())`, [session.organizationId,session.userId,category?.rows[0]?.id ?? null,row.kind,row.date,row.label,Math.round(row.amount*100)]); imported++;
    } catch (error) { errors.push({ row: index + 2, message: error instanceof Error ? error.message : 'Ligne invalide' }); }
  }
  await audit(session.organizationId, session.userId, 'transactions.csv_imported', 'import', undefined, { imported, rejected: errors.length }); response.status(201).json({ imported, rejected: errors.length, errors: errors.slice(0, 50) });
});

const uploadDirectory = resolve(config.UPLOAD_DIR); mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(basename(file.originalname)).toLowerCase()}`) }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_request, file, callback) => callback(null, ['application/pdf','image/jpeg','image/png'].includes(file.mimetype)) });

apiRouter.post('/documents', requireRole('owner','admin','practitioner','manager'), upload.single('file'), async (request, response) => {
  const { session } = request as AuthenticatedRequest; if (!request.file) throw new HttpError(400, 'Fichier PDF, JPEG ou PNG requis');
  const transactionId = z.uuid().optional().parse(request.body.transactionId || undefined);
  if (transactionId) { const allowed = await pool.query('SELECT 1 FROM app.transactions WHERE id=$1 AND organization_id=$2', [transactionId,session.organizationId]); if (!allowed.rowCount) throw new HttpError(404,'Transaction introuvable'); }
  const checksum = createHash('sha256').update(await import('node:fs/promises').then(({ readFile }) => readFile(request.file!.path))).digest('hex');
  const result = await pool.query(`INSERT INTO app.documents (organization_id,uploaded_by,transaction_id,original_name,storage_name,mime_type,size_bytes,checksum_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,original_name "originalName",mime_type "mimeType",size_bytes::int "sizeBytes",created_at "createdAt"`, [session.organizationId,session.userId,transactionId ?? null,basename(request.file.originalname),request.file.filename,request.file.mimetype,request.file.size,checksum]);
  await audit(session.organizationId,session.userId,'document.uploaded','document',result.rows[0].id,{ transactionId }); response.status(201).json(result.rows[0]);
});

apiRouter.get('/documents', async (request, response) => { const { session } = request as AuthenticatedRequest; const result = await pool.query(`SELECT d.id,d.original_name "originalName",d.mime_type "mimeType",d.size_bytes::int "sizeBytes",d.transaction_id "transactionId",d.created_at "createdAt" FROM app.documents d WHERE d.organization_id=$1 ORDER BY d.created_at DESC LIMIT 100`, [session.organizationId]); response.json({ items: result.rows }); });

apiRouter.get('/dashboard', async (request, response) => {
  const { session } = request as AuthenticatedRequest;
  const [summary, chart, recent, retrocessionRule] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(amount_cents) FILTER (WHERE kind='income'),0)::int income,COALESCE(SUM(amount_cents) FILTER (WHERE kind='expense'),0)::int expense,COUNT(*) FILTER (WHERE status<>'reconciled')::int pending FROM app.transactions WHERE organization_id=$1 AND transaction_date>=date_trunc('month',CURRENT_DATE)`, [session.organizationId]),
    pool.query(`WITH months AS (SELECT generate_series(date_trunc('month',CURRENT_DATE)-interval '5 months',date_trunc('month',CURRENT_DATE),interval '1 month') AS month_start) SELECT to_char(m.month_start,'YYYY-MM') AS month,COALESCE(SUM(t.amount_cents) FILTER (WHERE t.kind='income'),0)::int AS value FROM months m LEFT JOIN app.transactions t ON t.organization_id=$1 AND date_trunc('month',t.transaction_date)=m.month_start GROUP BY m.month_start ORDER BY m.month_start`, [session.organizationId]),
    pool.query(`SELECT t.id,to_char(t.transaction_date,'YYYY-MM-DD') "transactionDate",t.label,t.kind,t.amount_cents::int "amountCents",t.status,c.name "categoryName" FROM app.transactions t LEFT JOIN app.categories c ON c.id=t.category_id WHERE t.organization_id=$1 ORDER BY t.transaction_date DESC,t.created_at DESC LIMIT 5`, [session.organizationId]),
    pool.query(`SELECT id,name,rate::float8,effective_from "effectiveFrom",effective_to "effectiveTo" FROM app.retrocession_rules WHERE organization_id=$1 AND status='active' AND effective_from<=CURRENT_DATE AND (effective_to IS NULL OR effective_to>=CURRENT_DATE) LIMIT 1`, [session.organizationId]),
  ]);
  const s = summary.rows[0];
  const rule = retrocessionRule.rows[0];
  const eligibleAmountCents = s.income as number;
  response.json({ summary: { incomeCents: s.income, expenseCents: s.expense, netCents: s.income-s.expense, pendingCount: s.pending }, chart: chart.rows, recent: recent.rows, retrocession: rule ? { ...rule, eligibleAmountCents, dueAmountCents: calculatePercentageRetrocession({ eligibleAmountInCents: eligibleAmountCents, rate: rule.rate }) } : null });
});

apiRouter.get('/audit-events', requireRole('owner','admin','reader'), async (request, response) => { const { session } = request as AuthenticatedRequest; const result = await pool.query(`SELECT a.id,a.action,a.entity_type "entityType",a.entity_id "entityId",a.metadata,a.created_at "createdAt",concat(u.first_name,' ',u.last_name) actor FROM app.audit_events a LEFT JOIN app.users u ON u.id=a.actor_id WHERE a.organization_id=$1 ORDER BY a.created_at DESC LIMIT 100`, [session.organizationId]); response.json({ items: result.rows }); });
