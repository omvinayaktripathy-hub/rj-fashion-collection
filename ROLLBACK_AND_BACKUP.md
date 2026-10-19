# RJ FASHION COLLECTION — ROLLBACK & BACKUP OPERATIONAL RUNBOOK

This runbook provides exact, non-destructive procedures for backing up, verifying, and rolling back code, database state, and Firebase Hosting releases.

---

## 1. Database Backup & Integrity Verification

The production database is an embedded SQLite engine operating in **WAL mode** with foreign keys enabled at `database/database.sqlite`.

### Create an On-Demand Backup
Run the following PowerShell command from the project root:
```powershell
node -e "
const fs = require('fs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = './backups/backup-' + timestamp + '.sqlite';
fs.copyFileSync('./database/database.sqlite', backupPath);
console.log('Successfully created database backup:', backupPath);
"
```

### Verify Backup Integrity
Verify that the database file is structurally sound and free from page corruption:
```powershell
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./database/database.sqlite');
const result = db.prepare('PRAGMA integrity_check;').all();
console.log('Integrity check result:', result);
"
```
*Expected output:* `[ { integrity_check: 'ok' } ]`

### Restore from Backup
In the event of accidental data modification or corruption:
1. Stop the Node.js server process:
   ```powershell
   Get-Process -Name node | Stop-Process
   ```
2. Locate the desired backup file in `backups/` (e.g. `backups/backup-2026-10-18T17-08-47.sqlite`).
3. Replace the active database file:
   ```powershell
   Copy-Item -Path "backups/backup-2026-10-18T17-08-47.sqlite" -Destination "database/database.sqlite" -Force
   ```
4. Remove stale WAL/SHM temporary files:
   ```powershell
   Remove-Item "database/database.sqlite-wal", "database/database.sqlite-shm" -ErrorAction SilentlyContinue
   ```
5. Restart the server:
   ```powershell
   node server.js
   ```

---

## 2. Git Codebase Rollback Procedures

### Rollback to Last Verified Security Snapshot
If code changes cause regressions or unintended behavior, revert to the verified audit branch:
```powershell
# View recent commits
git log --oneline -n 5

# Revert working tree to the baseline commit
git checkout pre-launch-security-audit
```

### Clean Working Tree Without Touching Database
```powershell
# Discard uncommitted changes in code files while preserving the database
git checkout -- public/ routes/ services/ middleware/
```

---

## 3. Firebase Hosting Rollback Procedures

If a newly deployed static frontend introduces UI errors or broken assets, roll back instantly using either the Firebase Console or the Firebase CLI.

### Option A: Firebase Web Console (Instant & Recommended)
1. Open [Firebase Console &rarr; Hosting](https://console.firebase.google.com/project/rj-fashion-collection/hosting/sites/rj-fashion-collection).
2. Scroll to the **Release History** table.
3. Locate the previous working release (view timestamp and deployer).
4. Click the three dots (`...`) on the right side of the row.
5. Click **Rollback**.
6. The previous version is immediately served on the global CDN within seconds.

### Option B: Firebase CLI Channel Deployment
To redeploy a specific verified local version:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection\serviceAccountKey.json"
npx --yes firebase-tools deploy --only hosting --project rj-fashion-collection
```

---

## 4. Disaster Recovery Playbook

| Scenario | Severity | Immediate Action | Recovery Time |
| :--- | :---: | :--- | :---: |
| **Accidental Product Deletion** | Medium | Restore database from latest timestamped snapshot in `backups/`. | < 2 minutes |
| **Faulty Frontend Deployment** | Medium | Click "Rollback" in Firebase Hosting Release History. | < 30 seconds |
| **Server Crash / Process Exit** | High | Restart process with `node server.js` (or use PM2 auto-restart). | < 10 seconds |
| **Compromised Credentials** | Critical | Rotate secret keys in `.env`, revoke old API tokens, and restart server. | < 5 minutes |
