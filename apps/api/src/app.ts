import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config.js';
import { errorHandler } from './http.js';
import { apiRouter } from './routes.js';

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

app.use('/api', apiRouter);

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Ressource introuvable' });
});

app.use(errorHandler);
