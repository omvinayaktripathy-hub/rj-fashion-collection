/**
 * RJ FASHION COLLECTION - AUTOMATED DATABASE BACKUP SYSTEM
 * Checkpoints SQLite WAL and creates timestamped snapshots in backups/
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dbPath = path.join(rootDir, 'database', 'database.sqlite');
const backupsDir = path.join(rootDir, 'backups');

function performBackup() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.warn('Backup Notice: database.sqlite not found to backup.');
      return null;
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Force SQLite to checkpoint WAL pages into main db file
    try {
      const db = require('../database/db');
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (e) {
      // ignore if db instance already open or locking
    }

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `backup-${dateStr}.sqlite`;
    const targetPath = path.join(backupsDir, backupFileName);

    fs.copyFileSync(dbPath, targetPath);

    const stats = fs.statSync(targetPath);
    console.log(`✓ Backup successfully created: ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`);

    // Backup rotation: keep last 14 snapshots
    rotateBackups(14);

    return {
      fileName: backupFileName,
      path: targetPath,
      sizeBytes: stats.size,
      timestamp: now.toISOString()
    };
  } catch (error) {
    console.error('Database backup failed:', error);
    return null;
  }
}

function rotateBackups(keepCount = 14) {
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
        console.log(`- Pruned old backup: ${file.name}`);
      });
    }
  } catch (err) {
    console.warn('Backup rotation notice:', err.message);
  }
}

// If run directly from terminal
if (require.main === module) {
  performBackup();
}

module.exports = { performBackup, rotateBackups };
