import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { initDb } from './db';
import { authRouter } from './auth';
import { apiRouter } from './api';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

let dbReady = false;

app.get('/health', (_req, res) => res.json({ ok: true, db: dbReady }));
app.use('/auth', authRouter);
app.use('/api', apiRouter);

// Start server immediately so healthcheck passes, then connect DB
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Adobe Mint backend running on http://0.0.0.0:${config.port}`);
  initDb()
    .then(() => { dbReady = true; console.log('DB ready'); })
    .catch(err => console.error('DB init failed:', err.message));
});
