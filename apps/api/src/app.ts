import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.WEB_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'compta-paramedicale-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Ressource introuvable' });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  response.status(500).json({ error: 'Erreur interne du serveur' });
});
