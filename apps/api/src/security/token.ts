import { SignJWT, jwtVerify } from 'jose';

import { config } from '../config.js';

const secret = new TextEncoder().encode(config.JWT_SECRET);

export type Session = { userId: string; organizationId: string; role: string };

export async function createToken(session: Session): Promise<string> {
  return new SignJWT({ organizationId: session.organizationId, role: session.role })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(session.userId).setIssuedAt().setExpirationTime('8h').sign(secret);
}

export async function verifyToken(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub || typeof payload.organizationId !== 'string' || typeof payload.role !== 'string') throw new Error('Jeton incomplet');
  return { userId: payload.sub, organizationId: payload.organizationId, role: payload.role };
}
