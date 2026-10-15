import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

/**
 * Initialize SQLite database connection and execute schema.
 * Supports in-memory database (:memory:) for unit and integration testing.
 */
export function initDatabase(dbPath = config.databasePath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for file-based database for concurrent read/write performance
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA foreign_keys = ON;');

  // Read and apply schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Apply non-destructive incremental schema updates for pre-existing database files
  ensureIncrementalSchema(db);

  dbInstance = db;

  // Startup recovery: reconcile previously running scans interrupted by server crash/restart
  reconcileOrphanedScans(dbInstance);

  return dbInstance;
}

/**
 * Ensures newly introduced columns exist in pre-existing database files.
 */
function ensureIncrementalSchema(db) {
  try {
    const scanCols = db.prepare('PRAGMA table_info(scans)').all().map((c) => c.name);
    if (!scanCols.includes('max_pages')) {
      db.exec('ALTER TABLE scans ADD COLUMN max_pages INTEGER NOT NULL DEFAULT 1;');
    }
    if (!scanCols.includes('max_depth')) {
      db.exec('ALTER TABLE scans ADD COLUMN max_depth INTEGER NOT NULL DEFAULT 1;');
    }
    if (!scanCols.includes('pages_scanned')) {
      db.exec('ALTER TABLE scans ADD COLUMN pages_scanned INTEGER NOT NULL DEFAULT 1;');
    }
    if (!scanCols.includes('pages_failed')) {
      db.exec('ALTER TABLE scans ADD COLUMN pages_failed INTEGER NOT NULL DEFAULT 0;');
    }
    if (!scanCols.includes('incomplete_count')) {
      db.exec('ALTER TABLE scans ADD COLUMN incomplete_count INTEGER NOT NULL DEFAULT 0;');
    }
    if (!scanCols.includes('wcag_score')) {
      db.exec('ALTER TABLE scans ADD COLUMN wcag_score INTEGER;');
    }
    if (!scanCols.includes('wcag_grade')) {
      db.exec('ALTER TABLE scans ADD COLUMN wcag_grade TEXT;');
    }

    // Retroactively ensure historical scans with critical violations do not hold Grade A
    db.exec(`
      UPDATE scans
      SET wcag_grade = 'B'
      WHERE wcag_grade = 'A' AND critical_count > 0;
    `);

    const pageCols = db.prepare('PRAGMA table_info(scan_pages)').all().map((c) => c.name);
    if (!pageCols.includes('incomplete_count')) {
      db.exec('ALTER TABLE scan_pages ADD COLUMN incomplete_count INTEGER NOT NULL DEFAULT 0;');
    }

    const violationCols = db.prepare('PRAGMA table_info(scan_violations)').all().map((c) => c.name);
    if (!violationCols.includes('page_url')) {
      db.exec('ALTER TABLE scan_violations ADD COLUMN page_url TEXT;');
    }
    if (!violationCols.includes('wcag_principle')) {
      db.exec('ALTER TABLE scan_violations ADD COLUMN wcag_principle TEXT;');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS scan_manual_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL,
        page_url TEXT,
        rule_id TEXT NOT NULL,
        impact TEXT,
        description TEXT NOT NULL,
        help_text TEXT,
        help_url TEXT,
        wcag_tags TEXT,
        wcag_principle TEXT,
        selector TEXT,
        html_snippet TEXT,
        failure_summary TEXT,
        review_guidance TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_manual_checks_scan_id ON scan_manual_checks(scan_id);
      CREATE INDEX IF NOT EXISTS idx_manual_checks_rule ON scan_manual_checks(rule_id);
    `);

    const manualCols = db.prepare('PRAGMA table_info(scan_manual_checks)').all().map((c) => c.name);
    if (!manualCols.includes('wcag_principle')) {
      db.exec('ALTER TABLE scan_manual_checks ADD COLUMN wcag_principle TEXT;');
    }
  } catch (err) {
    console.error('Incremental schema verification warning:', err.message);
  }
}

/**
 * Reconciles any orphaned scans left in 'running' state after a server restart or crash.
 * Marks them as failed with an interruption error message and completion timestamp.
 */
export function reconcileOrphanedScans(db = getDb()) {
  const stmt = db.prepare(`
    UPDATE scans 
    SET status = 'failed',
        error_message = 'Scan interrupted by server restart or process termination.',
        completed_at = datetime('now')
    WHERE status = 'running'
  `);
  const result = stmt.run();

  try {
    db.prepare(`
      UPDATE scan_pages 
      SET status = 'failed',
          error_message = 'Page audit interrupted by server restart or process termination.',
          completed_at = datetime('now')
      WHERE status IN ('running', 'pending')
    `).run();
  } catch {}

  return result.changes;
}

/**
 * Retrieve active database instance, initializing if not already done.
 */
export function getDb() {
  if (!dbInstance) {
    initDatabase();
  }
  return dbInstance;
}

/**
 * Helper to run an INSERT / UPDATE / DELETE statement.
 */
export function run(sql, ...params) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Helper to query a single row.
 */
export function get(sql, ...params) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Helper to query all matching rows.
 */
export function all(sql, ...params) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Executes a callback within an explicit SQLite transaction.
 * Rolls back automatically if an unhandled error occurs.
 */
export function transaction(fn) {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Closes current database connection (useful during teardown / tests).
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

