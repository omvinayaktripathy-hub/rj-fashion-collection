/**
 * RJ FASHION COLLECTION — AUTOMATED DATABASE RESTORE TEST SUITE
 * 
 * Verifies that database backups can be safely and completely restored
 * without data loss or corruption, without altering production data.
 * 
 * Verification Steps:
 * 1. Locates latest verified backup in backups/daily/
 * 2. Restores snapshot into isolated test sandbox: database/database.test-restore.sqlite
 * 3. Inspects binary magic header ("SQLite format 3")
 * 4. Executes PRAGMA integrity_check (Full B-tree & page verification)
 * 5. Executes PRAGMA quick_check (Quick page verification)
 * 6. Executes PRAGMA foreign_key_check (Relational integrity check)
 * 7. Confirms all critical schema tables exist
 * 8. Verifies 100% row count parity between live DB and restored snapshot
 * 9. Executes sample data read queries to verify data readability
 * 10. Cleanly tears down the test database
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { performBackup } = require('./backup-db');

const rootDir = path.join(__dirname, '..');
const liveDbPath = path.join(rootDir, 'database', 'database.sqlite');
const backupsDir = path.join(rootDir, 'backups', 'daily');
const restoreTestDbPath = path.join(rootDir, 'database', 'database.test-restore.sqlite');

let passed = 0;
let failed = 0;

function assert(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name} -> ${errorMsg}`);
    failed++;
  }
}

async function runRestoreTest() {
  console.log('============================================================');
  console.log('🔄 DATABASE RESTORE & DISASTER RECOVERY TEST');
  console.log('============================================================\n');

  // 1. Locate or generate latest backup
  let latestBackupPath = null;
  if (fs.existsSync(backupsDir)) {
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'))
      .map(f => ({
        name: f,
        path: path.join(backupsDir, f),
        mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 0) {
      latestBackupPath = files[0].path;
    }
  }

  if (!latestBackupPath) {
    console.log('[RESTORE-TEST] No existing backup found. Generating fresh backup snapshot...');
    const rec = performBackup();
    if (!rec) {
      throw new Error('Failed to create backup snapshot for restore test.');
    }
    latestBackupPath = rec.path;
  }

  console.log(`[RESTORE-TEST] Testing restore of snapshot: ${path.basename(latestBackupPath)}`);
  assert('Target backup snapshot exists and is non-empty', fs.existsSync(latestBackupPath) && fs.statSync(latestBackupPath).size > 0);

  // 2. Clean previous test restore artifacts if any
  try {
    if (fs.existsSync(restoreTestDbPath)) fs.unlinkSync(restoreTestDbPath);
    if (fs.existsSync(restoreTestDbPath + '-wal')) fs.unlinkSync(restoreTestDbPath + '-wal');
    if (fs.existsSync(restoreTestDbPath + '-shm')) fs.unlinkSync(restoreTestDbPath + '-shm');
  } catch (_) {}

  // 3. Simulate Restore: Copy snapshot to sandbox test database
  fs.copyFileSync(latestBackupPath, restoreTestDbPath);
  assert('Backup successfully restored to isolated test instance', fs.existsSync(restoreTestDbPath));

  // 4. Verify SQLite file header magic bytes (first 16 bytes: "SQLite format 3\0")
  const fd = fs.openSync(restoreTestDbPath, 'r');
  const magicBuf = Buffer.alloc(16);
  fs.readSync(fd, magicBuf, 0, 16, 0);
  fs.closeSync(fd);
  const magicString = magicBuf.toString('utf8');
  assert('Header magic bytes match valid SQLite 3 signature', magicString.startsWith('SQLite format 3'));

  // 5. Open restored database in read-only sandbox mode
  const restoredDb = new DatabaseSync(restoreTestDbPath, { readOnly: true });

  // 6. Execute PRAGMA integrity_check
  const integrityResult = restoredDb.prepare('PRAGMA integrity_check;').all();
  assert(
    'PRAGMA integrity_check returns ok',
    integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok',
    `Got: ${JSON.stringify(integrityResult)}`
  );

  // 7. Execute PRAGMA quick_check
  const quickResult = restoredDb.prepare('PRAGMA quick_check;').all();
  assert(
    'PRAGMA quick_check returns ok',
    quickResult.length === 1 && quickResult[0].quick_check === 'ok',
    `Got: ${JSON.stringify(quickResult)}`
  );

  // 8. Execute PRAGMA foreign_key_check
  const fkResult = restoredDb.prepare('PRAGMA foreign_key_check;').all();
  assert(
    'PRAGMA foreign_key_check reports zero violations',
    fkResult.length === 0,
    `Violations: ${JSON.stringify(fkResult)}`
  );

  // 9. Verify critical schema tables exist in restored database
  const requiredTables = [
    'users',
    'products',
    'categories',
    'orders',
    'order_items',
    'addresses',
    'cart_items',
    'wishlist_items'
  ];

  const existingTables = restoredDb.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  ).all().map(r => r.name);

  const missingTables = requiredTables.filter(t => !existingTables.includes(t));
  assert(
    'All core schema tables present in restored database',
    missingTables.length === 0,
    `Missing: ${missingTables.join(', ')}`
  );

  // 10. Verify Row Count Parity with Live Production Database
  const liveDb = new DatabaseSync(liveDbPath, { readOnly: true });

  for (const table of requiredTables) {
    if (existingTables.includes(table)) {
      const liveCount = liveDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const restoredCount = restoredDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      assert(
        `Row count parity for table '${table}': ${restoredCount} rows`,
        liveCount === restoredCount,
        `Live had ${liveCount}, restored had ${restoredCount}`
      );
    }
  }

  // 11. Test Sample Queries on Restored Database
  const sampleProduct = restoredDb.prepare('SELECT id, name, price, stock FROM products WHERE active = 1 LIMIT 1').get();
  assert(
    'Sample product query executes successfully',
    sampleProduct && sampleProduct.name && Number(sampleProduct.price) > 0,
    `Got: ${JSON.stringify(sampleProduct)}`
  );

  const sampleCategories = restoredDb.prepare('SELECT id, name, slug FROM categories').all();
  assert(
    'Sample categories query executes successfully',
    sampleCategories && sampleCategories.length > 0,
    `Category count: ${sampleCategories ? sampleCategories.length : 0}`
  );

  // 12. Close database handles
  liveDb.close();
  restoredDb.close();

  // 13. Teardown Sandbox Test Restore Database
  try {
    fs.unlinkSync(restoreTestDbPath);
    console.log('[RESTORE-TEST] Sandbox test database safely cleaned up.');
  } catch (_) {}

  console.log('\n============================================================');
  console.log(`DATABASE RESTORE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ RESTORE VERIFICATION COMPLETE: Backups are 100% restorable and data-consistent.');
  }
}

runRestoreTest().catch(err => {
  console.error('[RESTORE-TEST] Unexpected failure:', err);
  process.exit(1);
});
