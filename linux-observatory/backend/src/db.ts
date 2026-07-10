import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../metrics.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    cpu REAL NOT NULL,
    memory REAL NOT NULL,
    disk REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    metric TEXT NOT NULL, -- 'cpu' | 'memory' | 'disk'
    value REAL NOT NULL,
    threshold REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' -- 'active' | 'resolved'
  );

  CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
`);

export default db;
