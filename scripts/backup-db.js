/**
 * RJ FASHION COLLECTION — AUTOMATED DAILY DATABASE BACKUP ENGINE
 * 
 * Capabilities:
 * 1. Flushes & Checkpoints SQLite Write-Ahead Log (WAL) to main DB file
 * 2. Pre-backup source database integrity check
 * 3. Creates timestamped snapshot in backups/daily/
 * 4. Post-backup integrity validation on the generated snapshot
 * 5. Generates SHA-256 cryptographic checksums for tamper detection
 * 6. Appends to persistent audit manifest (backups/backup-manifest.json)
 * 7. Enforces retention policy (retains last 30 daily snapshots, prunes older)
 * 8. Dispatches instant emergency alert to store owner if backup fails
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const rootDir = path.join(__dirname, '..');
const dbPath = path.join(rootDir, 'database', 'database.sqlite');
const backupsDir = path.join(rootDir, 'backups', 'daily');
const manifestPath = path.join(rootDir, 'backups', 'backup-manifest.json');

function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function verifyDatabaseIntegrity(filePath) {
  try {
    const testDb = new DatabaseSync(filePath, { readOnly: true });
    const check = testDb.prepare('PRAGMA integrity_check;').all();
    testDb.close();
    return check && check.length > 0 && check[0].integrity_check === 'ok';
  } catch (err) {
    console.error(`[Backup Integrity Error] on ${filePath}:`, err.message);
    return false;
  }
}

function updateManifest(backupRecord) {
  try {
    let manifest = { lastUpdated: new Date().toISOString(), totalBackups: 0, backups: [] };
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (_) {}
    }
    manifest.backups.unshift(backupRecord);
    // Keep last 100 manifest entries
    manifest.backups = manifest.backups.slice(0, 100);
    manifest.totalBackups = manifest.backups.length;
    manifest.lastUpdated = new Date().toISOString();
    manifest.latestBackup = backupRecord;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Manifest Notice]:', err.message);
  }
}

function performBackup() {
  const now = new Date();
  console.log(`[DAILY-BACKUP] [${now.toISOString()}] Initiating automated daily database backup...`);

  try {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database source file not found at ${dbPath}`);
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // 1. Force WAL checkpoint to flush in-flight transactions into database.sqlite
    try {
      const activeDb = require('../database/db');
      activeDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (e) {
      // Non-fatal if checkpoint is running
    }

    // 2. Pre-backup source integrity verification
    const isSourceHealthy = verifyDatabaseIntegrity(dbPath);
    if (!isSourceHealthy) {
      throw new Error('Source database failed PRAGMA integrity_check! Snapshot aborted to prevent saving corrupted state.');
    }

    // 3. Create timestamped snapshot
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `backup-${dateStr}.sqlite`;
    const targetPath = path.join(backupsDir, backupFileName);

    fs.copyFileSync(dbPath, targetPath);

    // 4. Post-backup integrity validation on the created snapshot
    const isSnapshotHealthy = verifyDatabaseIntegrity(targetPath);
    if (!isSnapshotHealthy) {
      try { fs.unlinkSync(targetPath); } catch (_) {}
      throw new Error('Created backup file failed post-verification integrity check!');
    }

    // 5. Compute SHA-256 checksum & file size
    const stats = fs.statSync(targetPath);
    const sha256 = computeSha256(targetPath);

    const record = {
      fileName: backupFileName,
      path: targetPath,
      sizeBytes: stats.size,
      sizeKb: (stats.size / 1024).toFixed(2),
      sha256,
      integrity: 'VERIFIED_OK',
      timestamp: now.toISOString(),
      type: 'AUTOMATED_DAILY'
    };

    // 6. Update manifest
    updateManifest(record);

    console.log(`[DAILY-BACKUP] ✅ Daily backup created successfully: ${backupFileName} (${record.sizeKb} KB, SHA-256: ${sha256.substring(0, 16)}...)`);

    // 7. Enforce retention policy (keep last 30 daily backups)
    rotateBackups(30);

    return record;
  } catch (error) {
    console.error('[DAILY-BACKUP] ❌ Backup failed:', error.message);

    // Alert store owner immediately if alertService is available
    try {
      const alertService = require('../services/alertService');
      alertService.notifyOwner({
        type: 'DATABASE_BACKUP_FAILURE',
        title: 'Daily Database Backup Failed',
        message: `Automated daily backup failed with error: ${error.message}`,
        severity: 'CRITICAL',
        stack: error.stack
      });
    } catch (_) {}

    return null;
  }
}

function rotateBackups(keepCount = 30) {
  try {
    if (!fs.existsSync(backupsDir)) return;
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'))
      .map(f => ({
        name: f,
        path: path.join(backupsDir, f),
        mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime); // newest first

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`[DAILY-BACKUP] - Pruned aged backup snapshot: ${file.name}`);
      });
    }
  } catch (err) {
    console.warn('[DAILY-BACKUP] Rotation notice:', err.message);
  }
}

// If run directly from CLI
if (require.main === module) {
  const result = performBackup();
  process.exit(result ? 0 : 1);
}

module.exports = { performBackup, rotateBackups, verifyDatabaseIntegrity };
