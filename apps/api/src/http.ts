import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import type { Session } from './security/token.js';
import { verifyToken } from './security/token.js';

export type AuthenticatedRequest = Request & { session: Session };

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Authentification requise');
    (request as AuthenticatedRequest).session = await verifyToken(authorization.slice(7));
    next();
  } catch {
    next(new HttpError(401, 'Session invalide ou expirée'));
  }
}

export function requireRole(...roles: string[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!roles.includes((request as AuthenticatedRequest).session.role)) return next(new HttpError(403, 'Action non autorisée'));
    next();
  };
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({ error: 'Données invalides', details: error.issues }); return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message }); return;
  }
  console.error(error);
  response.status(500).json({ error: 'Erreur interne du serveur' });
}
