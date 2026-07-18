import { app } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './database/client.js';

const server = app.listen(config.API_PORT, () => {
  console.log(`API disponible sur http://localhost:${config.API_PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} reçu, arrêt du serveur…`);
  server.close(() => { void closeDatabase().finally(() => process.exit(0)); });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
