import { Pool } from 'pg';

// Railway internal Postgres (.railway.internal) uses plain TCP — no SSL needed.
// External/public URLs may require SSL. Let the connection string's sslmode control it.
const useSSL = process.env.DATABASE_URL
  ? !process.env.DATABASE_URL.includes('railway.internal')
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      email      TEXT NOT NULL,
      name       TEXT NOT NULL,
      avatar     TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id),
      title           TEXT NOT NULL,
      description     TEXT,
      keywords        TEXT NOT NULL,
      category        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      thumbnail_uri   TEXT,
      earnings        NUMERIC(10,2) NOT NULL DEFAULT 0,
      downloads       INTEGER NOT NULL DEFAULT 0,
      requires_review BOOLEAN NOT NULL DEFAULT FALSE,
      review_reason   TEXT,
      photo_hash      TEXT,
      submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at     TIMESTAMPTZ
    );

    -- Idempotent migration for existing deployments
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS photo_hash TEXT;

    -- Prevent the same user from uploading the same photo twice.
    -- NULL photo_hash rows (legacy) are allowed multiple times by Postgres.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_photo_hash
      ON submissions (user_id, photo_hash);
  `);
  console.log('Database ready');
}

export async function upsertUser(user: {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}) {
  await pool.query(
    `INSERT INTO users (id, email, name, avatar)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       email  = EXCLUDED.email,
       name   = EXCLUDED.name,
       avatar = EXCLUDED.avatar`,
    [user.id, user.email, user.name, user.avatar]
  );
}

export async function createSubmission(sub: {
  id: string;
  user_id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  status: string;
  thumbnail_uri: string | null;
  requires_review: boolean;
  review_reason: string | null;
  photo_hash: string | null;
}) {
  await pool.query(
    `INSERT INTO submissions
       (id, user_id, title, description, keywords, category, status, thumbnail_uri, requires_review, review_reason, photo_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      sub.id, sub.user_id, sub.title, sub.description,
      JSON.stringify(sub.keywords), sub.category, sub.status,
      sub.thumbnail_uri, sub.requires_review, sub.review_reason, sub.photo_hash,
    ]
  );
}

// Update editable metadata on a submission the user owns. Returns true if a row was updated.
export async function updateSubmission(
  id: string,
  userId: string,
  fields: { title: string; description: string; keywords: string[]; category: string }
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE submissions
       SET title = $1, description = $2, keywords = $3, category = $4
     WHERE id = $5 AND user_id = $6`,
    [fields.title, fields.description, JSON.stringify(fields.keywords), fields.category, id, userId]
  );
  return (rowCount ?? 0) > 0;
}

// Delete a submission the user owns. Returns true if a row was deleted.
export async function deleteSubmission(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM submissions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}

// Returns all non-null photo hashes a user has already uploaded.
export async function getSubmissionHashes(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT photo_hash FROM submissions WHERE user_id = $1 AND photo_hash IS NOT NULL`,
    [userId]
  );
  return rows.map(r => r.photo_hash);
}

export async function getSubmissions(userId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM submissions WHERE user_id = $1 ORDER BY submitted_at DESC`,
    [userId]
  );
  return rows.map(r => ({
    ...r,
    keywords:       JSON.parse(r.keywords),
    requiresReview: r.requires_review,
    reviewReason:   r.review_reason,
    submittedAt:    r.submitted_at,
    reviewedAt:     r.reviewed_at,
  }));
}

export async function getStats(userId: string) {
  const { rows: [totals] } = await pool.query(
    `SELECT
       COALESCE(SUM(earnings), 0)                          AS total_earnings,
       COALESCE(SUM(downloads), 0)                         AS total_downloads,
       COUNT(*) FILTER (WHERE status = 'approved')         AS approved_count,
       COUNT(*) FILTER (WHERE status = 'reviewing')        AS reviewing_count,
       COUNT(*)                                            AS total_count
     FROM submissions WHERE user_id = $1`,
    [userId]
  );

  const { rows: monthly } = await pool.query(
    `SELECT
       TO_CHAR(submitted_at, 'Mon') AS month,
       TO_CHAR(submitted_at, 'YYYY-MM') AS year_month,
       COALESCE(SUM(earnings), 0) AS amount
     FROM submissions
     WHERE user_id = $1 AND status = 'approved'
     GROUP BY year_month, TO_CHAR(submitted_at, 'Mon')
     ORDER BY year_month DESC
     LIMIT 6`,
    [userId]
  );

  return {
    totalEarnings:  parseFloat(totals.total_earnings),
    totalDownloads: parseInt(totals.total_downloads),
    approvedCount:  parseInt(totals.approved_count),
    reviewingCount: parseInt(totals.reviewing_count),
    totalCount:     parseInt(totals.total_count),
    monthly:        monthly.reverse(),
  };
}
