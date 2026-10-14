import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, run, get, all, reconcileOrphanedScans, transaction } from '../src/db/database.js';

describe('SQLite Database Layer & Schema', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('Initializes tables for users, scans, scan_violations, and scan_manual_checks', () => {
    const tables = all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tableNames = tables.map((t) => t.name);

    assert.ok(tableNames.includes('users'), 'Expected users table to exist');
    assert.ok(tableNames.includes('scans'), 'Expected scans table to exist');
    assert.ok(tableNames.includes('scan_violations'), 'Expected scan_violations table to exist');
    assert.ok(tableNames.includes('scan_manual_checks'), 'Expected scan_manual_checks table to exist');
  });

  test('Enforces unique email constraint in users table', () => {
    run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      'ada@example.com',
      'hashed_pwd_ada',
      'Ada Lovelace'
    );

    assert.throws(
      () => {
        run(
          'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
          'ada@example.com',
          'another_pwd',
          'Duplicate Ada'
        );
      },
      /UNIQUE constraint failed/i
    );
  });

  test('transaction() commits on success and rolls back on unhandled error', () => {
    const userRes = run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      'tx@example.com',
      'hash',
      'Tx User'
    );
    const userId = userRes.lastInsertRowid;

    // Successful transaction
    transaction(() => {
      run("INSERT INTO scans (user_id, url, status) VALUES (?, 'https://committed.org', 'completed')", userId);
    });

    const committedScan = get("SELECT * FROM scans WHERE url = 'https://committed.org'");
    assert.ok(committedScan, 'Committed scan should exist');

    // Failing transaction rolls back
    assert.throws(() => {
      transaction(() => {
        run("INSERT INTO scans (user_id, url, status) VALUES (?, 'https://rolledback.org', 'completed')", userId);
        throw new Error('Forced transaction failure');
      });
    }, /Forced transaction failure/);

    const rolledBackScan = get("SELECT * FROM scans WHERE url = 'https://rolledback.org'");
    assert.equal(rolledBackScan, undefined, 'Rolled back scan must not exist');
  });

  test('Stores deterministic_guidance explicitly separate from AI fields in scan_violations', () => {
    const userRes = run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      'user@example.com',
      'hashed',
      'User'
    );

    const scanRes = run(
      'INSERT INTO scans (user_id, url, status) VALUES (?, ?, ?)',
      userRes.lastInsertRowid,
      'https://example.gov',
      'completed'
    );

    run(
      `INSERT INTO scan_violations 
        (scan_id, rule_id, impact, description, selector, deterministic_guidance, ai_explanation) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      scanRes.lastInsertRowid,
      'image-alt',
      'critical',
      'Images must have alternate text',
      'img#banner',
      'Add an alt attribute describing the image content or alt="" if decorative (WCAG 1.1.1).',
      null // AI is strictly null unless real AI API credentials was queried
    );

    const violation = get(
      'SELECT * FROM scan_violations WHERE scan_id = ?',
      scanRes.lastInsertRowid
    );

    assert.equal(violation.rule_id, 'image-alt');
    assert.equal(violation.impact, 'critical');
    assert.ok(violation.deterministic_guidance.includes('WCAG 1.1.1'));
    assert.equal(violation.ai_explanation, null);
  });

  test('reconcileOrphanedScans() marks orphaned running scans as failed while preserving others', () => {
    const userRes = run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      'orphantest@example.com',
      'hashed',
      'Orphan Tester'
    );
    const userId = userRes.lastInsertRowid;

    // Scan 1: Completed
    const s1 = run("INSERT INTO scans (user_id, url, status, total_violations) VALUES (?, ?, 'completed', 2)", userId, 'https://completed.org');
    // Scan 2: Running (orphaned)
    const s2 = run("INSERT INTO scans (user_id, url, status) VALUES (?, ?, 'running')", userId, 'https://running.org');
    // Scan 3: Failed
    const s3 = run("INSERT INTO scans (user_id, url, status, error_message) VALUES (?, ?, 'failed', 'Pre-existing error')", userId, 'https://failed.org');

    const recovered = reconcileOrphanedScans();
    assert.equal(recovered, 1, 'Expected 1 orphaned scan to be recovered');

    const scan1 = get('SELECT * FROM scans WHERE id = ?', s1.lastInsertRowid);
    assert.equal(scan1.status, 'completed');
    assert.equal(scan1.total_violations, 2);

    const scan2 = get('SELECT * FROM scans WHERE id = ?', s2.lastInsertRowid);
    assert.equal(scan2.status, 'failed');
    assert.ok(scan2.error_message.includes('Scan interrupted by server restart'));
    assert.ok(scan2.completed_at);

    const scan3 = get('SELECT * FROM scans WHERE id = ?', s3.lastInsertRowid);
    assert.equal(scan3.status, 'failed');
    assert.equal(scan3.error_message, 'Pre-existing error');
  });
});
