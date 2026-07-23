'use strict';

const fs   = require('fs');
const path = require('path');

const LICENSE_FILE    = 'license.dat';
const TRIAL_FILE      = 'install_date.dat';
const LICENSE_KEY     = 'MTP-2026-PROD-HAMZA-AUTH';
const TRIAL_DAYS      = 7;

class LicenseService {
  constructor(appDataPath, appVersion) {
    this.appVersion  = appVersion || '1.0.0';
    this.dataDir     = path.join(appDataPath, 'MobileShopSystem');
    this.licensePath = path.join(this.dataDir, LICENSE_FILE);
    this.trialPath   = path.join(this.dataDir, TRIAL_FILE);
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
  }

  _readFile(p) {
    try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null; } catch { return null; }
  }

  _writeFile(p, content) {
    fs.writeFileSync(p, content, 'utf8');
  }

  getStatus() {
    const deviceId = require('os').hostname();

    const licenseKey = this._readFile(this.licensePath);
    if (licenseKey && licenseKey === LICENSE_KEY) {
      return {
        status: 'active', activated: true, deviceMismatch: false,
        deviceId, licenseKey: this._maskKey(licenseKey), licenseKeyFull: licenseKey,
      };
    }

    const trialStart = this._readFile(this.trialPath);
    if (trialStart) {
      const elapsed = Math.floor((Date.now() - new Date(trialStart).getTime()) / (1000 * 60 * 60 * 24));
      if (elapsed < TRIAL_DAYS) {
        return {
          status: 'trial_active', activated: true, deviceMismatch: false,
          deviceId, trial: { onTrial: true, daysLeft: TRIAL_DAYS - elapsed, expired: false, trialStartDate: trialStart },
        };
      }
      return {
        status: 'trial_expired', activated: false, deviceMismatch: false,
        deviceId, message: 'Your 7-day trial has expired. Please enter a license key.',
        trial: { onTrial: false, daysLeft: 0, expired: true, trialStartDate: trialStart },
      };
    }

    return { status: 'not_activated', activated: false, deviceMismatch: false, deviceId };
  }

  isActivated() {
    const s = this.getStatus();
    return s.status === 'active' || s.status === 'trial_active';
  }

  activate(key) {
    const normalized = String(key || '').trim().toUpperCase();
    if (normalized !== LICENSE_KEY) {
      return { ok: false, error: 'Invalid license key. Please check and try again.' };
    }
    this._writeFile(this.licensePath, normalized);
    return { ok: true, licenseKey: this._maskKey(normalized), activatedAt: new Date().toISOString() };
  }

  startTrial() {
    const existing = this._readFile(this.trialPath);
    if (existing) {
      const elapsed = Math.floor((Date.now() - new Date(existing).getTime()) / (1000 * 60 * 60 * 24));
      if (elapsed < TRIAL_DAYS) return { ok: true, message: 'Trial already active.' };
    }
    this._writeFile(this.trialPath, new Date().toISOString());
    return { ok: true };
  }

  deactivate() {
    try {
      if (fs.existsSync(this.licensePath)) fs.unlinkSync(this.licensePath);
      if (fs.existsSync(this.trialPath)) fs.unlinkSync(this.trialPath);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  }

  getOwnerInfo() {
    const status = this.getStatus();
    const licenseKey = this._readFile(this.licensePath);
    return {
      ...status,
      licenseKey: licenseKey || null,
      deviceId: require('os').hostname(),
      activationFile: this.licensePath,
      activationDir: this.dataDir,
    };
  }

  getPaths() {
    return { activationDir: this.dataDir, activationFile: this.licensePath };
  }

  _maskKey(key) {
    if (!key || key.length < 8) return '****-****-****';
    return key.slice(0, 8) + '-****-****';
  }
}

module.exports = LicenseService;
