import { pool } from './database/client.js';

export async function audit(organizationId: string | null, actorId: string | null, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await pool.query(`INSERT INTO app.audit_events (organization_id, actor_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)`, [organizationId, actorId, action, entityType, entityId ?? null, JSON.stringify(metadata)]);
}
