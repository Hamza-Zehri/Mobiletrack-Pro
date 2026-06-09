'use strict';
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const crypto   = require('crypto');

const SECRET = 'MobileTrackPro_EncKey_HamzaAsad_2026';
const IV_LEN = 16;

class BackupService {
  constructor(db, userDataPath, backupDir) {
    this.db          = db;
    this.userData    = userDataPath;
    this.backupDir   = backupDir;
  }

  // ── Create encrypted backup ──────────────────────────────────────────────
  async create(destPath) {
    if (!destPath) {
      const ts = new Date().toISOString().slice(0,16).replace(/[T:]/g,'-');
      destPath = path.join(this.backupDir, `backup_${ts}.shopbackup`);
    }

    const tmpZip = destPath + '.tmp.zip';

    await new Promise((resolve, reject) => {
      const output  = fs.createWriteStream(tmpZip);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      // Database file
      const dbPath = path.join(this.userData, 'mobiletrack.db');
      if (fs.existsSync(dbPath))   archive.file(dbPath, { name: 'mobiletrack.db' });

      // Logo
      const logoPath = path.join(this.userData, 'logo.png');
      if (fs.existsSync(logoPath)) archive.file(logoPath, { name: 'logo.png' });

      // Images folder
      const imgDir = path.join(this.userData, 'images');
      if (fs.existsSync(imgDir))   archive.directory(imgDir, 'images');

      // Invoices folder
      const invDir = path.join(this.userData, 'invoices');
      if (fs.existsSync(invDir))   archive.directory(invDir, 'invoices');

      // Manifest
      const manifest = { version: '1.0', createdAt: new Date().toISOString(), app: 'MobileTrackPro' };
      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

      archive.finalize();
    });

    // Encrypt the zip
    this._encrypt(tmpZip, destPath);
    fs.unlinkSync(tmpZip);

    // Update last_backup_at
    this.db.prepare("UPDATE backup_settings SET last_backup_at=datetime('now','localtime') WHERE id=1").run();

    const stat = fs.statSync(destPath);
    return { ok: true, path: destPath, size: stat.size, filename: path.basename(destPath) };
  }

  // ── Restore from encrypted backup ────────────────────────────────────────
  async restore(srcPath) {
    if (!fs.existsSync(srcPath)) throw new Error('Backup file not found');

    const tmpZip    = srcPath + '.restore.zip';
    const tmpExtDir = srcPath + '.restore_dir';

    try {
      this._decrypt(srcPath, tmpZip);

      if (!fs.existsSync(tmpExtDir)) fs.mkdirSync(tmpExtDir, { recursive: true });

      await new Promise((resolve, reject) => {
        fs.createReadStream(tmpZip)
          .pipe(unzipper.Extract({ path: tmpExtDir }))
          .on('close', resolve)
          .on('error', reject);
      });

      // Validate manifest
      const manifestPath = path.join(tmpExtDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) throw new Error('Invalid backup file: missing manifest');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.app !== 'MobileTrackPro') throw new Error('Invalid backup: wrong app');

      // Close DB before replacing
      this.db.close();

      // Restore database
      const dbSrc  = path.join(tmpExtDir, 'mobiletrack.db');
      const dbDest = path.join(this.userData, 'mobiletrack.db');
      if (fs.existsSync(dbSrc)) fs.copyFileSync(dbSrc, dbDest);

      // Restore logo
      const logoSrc  = path.join(tmpExtDir, 'logo.png');
      const logoDest = path.join(this.userData, 'logo.png');
      if (fs.existsSync(logoSrc)) fs.copyFileSync(logoSrc, logoDest);

      // Restore images
      const imgSrc  = path.join(tmpExtDir, 'images');
      const imgDest = path.join(this.userData, 'images');
      if (fs.existsSync(imgSrc)) this._copyDir(imgSrc, imgDest);

      // Restore invoices
      const invSrc  = path.join(tmpExtDir, 'invoices');
      const invDest = path.join(this.userData, 'invoices');
      if (fs.existsSync(invSrc)) this._copyDir(invSrc, invDest);

      return { ok: true, message: 'Restore successful. Please restart the application.' };
    } finally {
      if (fs.existsSync(tmpZip))    fs.unlinkSync(tmpZip);
      if (fs.existsSync(tmpExtDir)) fs.rmSync(tmpExtDir, { recursive: true, force: true });
    }
  }

  // ── List backup files ─────────────────────────────────────────────────────
  list() {
    if (!fs.existsSync(this.backupDir)) return [];
    return fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.shopbackup'))
      .map(f => {
        const full = path.join(this.backupDir, f);
        const stat = fs.statSync(full);
        return { filename: f, path: full, size: stat.size, mtime: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  }

  // ── Encrypt / Decrypt helpers ─────────────────────────────────────────────
  _encrypt(src, dest) {
    const key = crypto.scryptSync(SECRET, 'salt_mtp', 32);
    const iv  = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const input   = fs.readFileSync(src);
    const enc     = Buffer.concat([iv, cipher.update(input), cipher.final()]);
    fs.writeFileSync(dest, enc);
  }

  _decrypt(src, dest) {
    const key  = crypto.scryptSync(SECRET, 'salt_mtp', 32);
    const data = fs.readFileSync(src);
    const iv   = data.slice(0, IV_LEN);
    const enc  = data.slice(IV_LEN);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    fs.writeFileSync(dest, dec);
  }

  _copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      const s = path.join(src, file);
      const d = path.join(dest, file);
      if (fs.statSync(s).isDirectory()) this._copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }
}

module.exports = BackupService;
