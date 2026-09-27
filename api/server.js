import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const port = Number(process.env.PORT || 3001);
const authSecret = process.env.AUTH_SECRET;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH_B64
  ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, 'base64').toString('utf8')
  : process.env.ADMIN_PASSWORD_HASH;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'track_app',
  user: process.env.DB_USER || 'track_user',
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '10mb' }));

const isAdmin = (req) => {
  if (!authSecret) return false;
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return false;
  try {
    const payload = jwt.verify(token, authSecret);
    return payload?.sub === adminUsername && payload?.role === 'admin';
  } catch {
    return false;
  }
};
const emptyState = () => ({ individualEntries: [], relayTeams: [], draws: {}, results: {} });

async function readState() {
  const [rows] = await pool.query('SELECT individual_entries, relay_teams, draws, results FROM meet_state WHERE id = 1');
  if (!rows.length) return emptyState();
  const row = rows[0];
  const parse = (value, fallback) => {
    try { return typeof value === 'string' ? JSON.parse(value) : (value ?? fallback); } catch { return fallback; }
  };
  return {
    individualEntries: parse(row.individual_entries, []),
    relayTeams: parse(row.relay_teams, []),
    draws: parse(row.draws, {}),
    results: parse(row.results, {})
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'database_unavailable' });
  }
});

// 画面側のログイン情報をAPIで確認し、JWTセッションを発行します。
app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!authSecret || !adminUsername || !adminPasswordHash) return res.status(503).json({ error: 'auth_not_configured' });
  const valid = username === adminUsername && await bcrypt.compare(password, adminPasswordHash);
  if (!valid) return res.status(401).json({ error: 'invalid_credentials' });
  const token = jwt.sign({ sub: adminUsername, role: 'admin' }, authSecret, { expiresIn: '12h' });
  return res.json({ token, user: { name: adminUsername, email: adminUsername, picture: '' } });
});

// 速報ページは結果を含む大会状態を読み取り専用で取得します。
app.get('/api/state', async (_req, res) => {
  try {
    res.json(await readState());
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: 'state_unavailable' });
  }
});

// 管理画面からの一括保存。書き込みには管理トークンが必要です。
app.put('/api/state', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'admin_required' });
  const body = req.body || {};
  const state = {
    individualEntries: Array.isArray(body.individualEntries) ? body.individualEntries : [],
    relayTeams: Array.isArray(body.relayTeams) ? body.relayTeams : [],
    draws: body.draws && typeof body.draws === 'object' ? body.draws : {},
    results: body.results && typeof body.results === 'object' ? body.results : {}
  };
  try {
    await pool.query(
      `INSERT INTO meet_state (id, individual_entries, relay_teams, draws, results)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE individual_entries = VALUES(individual_entries), relay_teams = VALUES(relay_teams), draws = VALUES(draws), results = VALUES(results)`,
      [JSON.stringify(state.individualEntries), JSON.stringify(state.relayTeams), JSON.stringify(state.draws), JSON.stringify(state.results)]
    );
    res.json({ ok: true, state });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: 'state_save_failed' });
  }
});

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('MariaDB connection: OK');
    app.listen(port, '0.0.0.0', () => console.log(`track-app-api listening on ${port}`));
  } catch (error) {
    console.error('MariaDB connection: FAILED', error.message);
    process.exit(1);
  }
};

start();
