import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

// 每個 serverless instance 只初始化一次
let initPromise: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = initDb();
  }
  return initPromise;
}

async function initDb(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      icon         TEXT NOT NULL DEFAULT '📌',
      color        TEXT NOT NULL DEFAULT '#6366f1',
      schedule_type TEXT NOT NULL DEFAULT 'weekly',
      weekly_target INTEGER,
      fixed_days   JSONB,
      day_slots    JSONB,
      time_slot    JSONB,
      timer_mode   TEXT NOT NULL DEFAULT 'none',
      countdown_minutes INTEGER,
      created_at   TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL,
      date       TEXT NOT NULL,
      start_time TEXT,
      end_time   TEXT,
      duration   INTEGER,
      completed  BOOLEAN NOT NULL DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id           INTEGER PRIMARY KEY DEFAULT 1,
      theme        TEXT NOT NULL DEFAULT 'system',
      accent_color TEXT NOT NULL DEFAULT '#6366f1'
    )
  `;

  // 確保 settings 有預設一筆資料
  await sql`
    INSERT INTO settings (id, theme, accent_color)
    VALUES (1, 'system', '#6366f1')
    ON CONFLICT (id) DO NOTHING
  `;
}
