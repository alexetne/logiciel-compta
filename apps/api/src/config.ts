import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/compta_paramedicale'),
  JWT_SECRET: z.string().min(32).default('development-secret-change-me-32-characters'),
  UPLOAD_DIR: z.string().min(1).default('./storage/documents'),
});

export const config = environmentSchema.parse(process.env);
