import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { getDb } from './db/index.js';
import reportsRouter from './routes/reports.js';
import exportsRouter from './routes/exports.js';
import sharedRouter from './routes/shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize database
getDb();

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow client scripts & inline styles in development
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Ledgerly Report Engine',
    timestamp: new Date().toISOString(),
    provider: config.llmProvider,
    geminiConfigured: Boolean(config.geminiApiKey),
  });
});

// Mount Routes
app.use('/api/reports', exportsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api', sharedRouter);

// Serve static frontend build if available (production mode)
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
app.use(express.static(clientDistPath));

// Fallback to client index.html for client-side routing in production
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

app.listen(config.port, () => {
  console.log(`[Ledgerly Server] Running on http://localhost:${config.port}`);
  console.log(`[Ledgerly Server] LLM Provider active: ${config.llmProvider.toUpperCase()}`);
});
