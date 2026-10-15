-- AccessGuard AI Database Schema
-- Embedded SQLite database with foreign key support enabled

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Scans table (Prepared for real Playwright/axe-core scanner in Phase 2)
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  total_violations INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  serious_count INTEGER NOT NULL DEFAULT 0,
  moderate_count INTEGER NOT NULL DEFAULT 0,
  minor_count INTEGER NOT NULL DEFAULT 0,
  passes_count INTEGER NOT NULL DEFAULT 0,
  inapplicable_count INTEGER NOT NULL DEFAULT 0,
  incomplete_count INTEGER NOT NULL DEFAULT 0,
  max_pages INTEGER NOT NULL DEFAULT 1,
  max_depth INTEGER NOT NULL DEFAULT 1,
  pages_scanned INTEGER NOT NULL DEFAULT 1,
  pages_failed INTEGER NOT NULL DEFAULT 0,
  wcag_score INTEGER,
  wcag_grade TEXT,
  wcag_version TEXT NOT NULL DEFAULT 'WCAG 2.1 AA',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- Scanned pages table (Supports website-wide multi-page crawler)
CREATE TABLE IF NOT EXISTS scan_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  http_status INTEGER,
  depth INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  total_violations INTEGER NOT NULL DEFAULT 0,
  passes_count INTEGER NOT NULL DEFAULT 0,
  incomplete_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scan_pages_scan_id ON scan_pages(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_pages_status ON scan_pages(status);

-- Scan violations table (Records concrete evidence and deterministic guidance)
CREATE TABLE IF NOT EXISTS scan_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id INTEGER NOT NULL,
  page_url TEXT,
  rule_id TEXT NOT NULL,
  impact TEXT NOT NULL CHECK(impact IN ('critical', 'serious', 'moderate', 'minor')),
  description TEXT NOT NULL,
  help_text TEXT,
  help_url TEXT,
  wcag_tags TEXT,
  wcag_principle TEXT,
  selector TEXT,
  html_snippet TEXT,
  failure_summary TEXT,
  -- Built-in guidance is strictly deterministic rule-based guidance, never labeled as AI
  deterministic_guidance TEXT,
  -- AI columns remain null unless genuine AI API credentials are configured & called
  ai_explanation TEXT,
  ai_code_fix TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_violations_scan_id ON scan_violations(scan_id);
CREATE INDEX IF NOT EXISTS idx_violations_impact ON scan_violations(impact);

-- Scan manual checks table (Records items requiring human review from axe-core incomplete checks)
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
