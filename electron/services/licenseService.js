'use strict';

const crypto = require('crypto');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const { execSync } = require('child_process');

const ACTIVATION_DIR_NAME = 'MobileShopSystem';
const ACTIVATION_FILE     = 'activation.dat';
const ACTIVATION_BACKUP   = 'activation.bak';
const STORAGE_SALT        = 'mtp_activation_storage_v1';
const LICENSE_HMAC_SECRET = 'MobileTrackPro_License_HamzaAsad_2026';
const FILE_MAGIC          = 'MTPACT1';
const TRIAL_DAYS          = 7;

/** @typedef {'not_activated'|'active'|'trial_active'|'trial_expired'|'device_mismatch'|'corrupt'} LicenseStatus */

class LicenseService {
  /**
   * @param {string} appDataPath - Roaming AppData root (app.getPath('appData'))
   * @param {string} appVersion
   */
  constructor(appDataPath, appVersion) {
    this.appVersion    = appVersion || '1.0.0';
    this.activationDir = path.join(appDataPath, ACTIVATION_DIR_NAME);
    this.activationPath = path.join(this.activationDir, ACTIVATION_FILE);
    this.backupPath    = path.join(this.activationDir, ACTIVATION_BACKUP);
    this._deviceId     = null;
    this._storageKey   = crypto.scryptSync(LICENSE_HMAC_SECRET, STORAGE_SALT, 32);
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.activationDir)) {
      fs.mkdirSync(this.activationDir, { recursive: true });
    }
  }

  /** Stable device fingerprint bound to this machine. */
  getDeviceId() {
    if (this._deviceId) return this._deviceId;

    const parts = [
      os.platform(),
      os.arch(),
      os.hostname(),
      this._getWindowsMachineGuid(),
      this._getPrimaryMac(),
      String(os.cpus()?.[0]?.model || ''),
    ].filter(Boolean);

    this._deviceId = crypto
      .createHash('sha256')
      .update(parts.join('|'))
      .digest('hex')
      .toUpperCase();

    return this._deviceId;
  }

  _getWindowsMachineGuid() {
    if (process.platform !== 'win32') return '';
    try {
      const out = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
        { encoding: 'utf8', windowsHide: true, timeout: 5000 }
      );
      const match = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
      return match ? match[1].trim() : '';
    } catch {
      return '';
    }
  }

  _getPrimaryMac() {
    const ifaces = os.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] || []) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          macs.push(iface.mac);
        }
      }
    }
    // Sort MACs so device ID is stable regardless of interface enumeration order
    return macs.sort().join(',');
  }

  /** Normalize user input: MTP-XXXX-XXXX-XXXX-XXXX */
  static normalizeKey(key) {
    return String(key || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  /** Format raw 20-char body as dashed key. */
  static formatKey(raw) {
    const body = LicenseService.normalizeKey(raw);
    if (body.length !== 23 || !body.startsWith('MTP')) return raw;
    const seg = body.slice(3);
    return `MTP-${seg.slice(0, 4)}-${seg.slice(4, 8)}-${seg.slice(8, 12)}-${seg.slice(12, 16)}-${seg.slice(16, 20)}`;
  }

  /**
   * Validate license key checksum (offline).
   * Key body: MTP + 16 data chars + 4 checksum chars (20 after MTP prefix).
   */
  validateLicenseKey(key) {
    const normalized = LicenseService.normalizeKey(key);
    if (normalized.length !== 23 || !normalized.startsWith('MTP')) {
      return { valid: false, error: 'Invalid license key format. Expected MTP-XXXX-XXXX-XXXX-XXXX.' };
    }

    const data     = normalized.slice(3, 19);
    const checksum = normalized.slice(19, 23);
    const expected = this._keyChecksum(data);

    if (checksum !== expected) {
      return { valid: false, error: 'Invalid license key. Please check and try again.' };
    }

    return { valid: true, formatted: LicenseService.formatKey(normalized) };
  }

  _keyChecksum(data) {
    return crypto
      .createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(data)
      .digest('hex')
      .slice(0, 4)
      .toUpperCase();
  }

  /** Generate a new valid license key (vendor tool). */
  static generateKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let data = '';
    for (let i = 0; i < 16; i++) {
      data += chars[crypto.randomInt(chars.length)];
    }
    const checksum = crypto
      .createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(data)
      .digest('hex')
      .slice(0, 4)
      .toUpperCase();
    return LicenseService.formatKey('MTP' + data + checksum);
  }

  _encryptPayload(obj) {
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this._storageKey, iv);
    const json   = JSON.stringify(obj);
    const enc    = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    const payload = Buffer.concat([iv, tag, enc]);
    return FILE_MAGIC + payload.toString('base64url');
  }

  _decryptPayload(raw) {
    if (!raw || !raw.startsWith(FILE_MAGIC)) return null;
    try {
      const buf      = Buffer.from(raw.slice(FILE_MAGIC.length), 'base64url');
      const iv       = buf.subarray(0, 12);
      const tag      = buf.subarray(12, 28);
      const data     = buf.subarray(28);
      const decipher = crypto.createDecipheriv('aes-256-gcm', this._storageKey, iv);
      decipher.setAuthTag(tag);
      const json = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  _readActivation() {
    return this._readActivationFile(this.activationPath)
        || this._readActivationFile(this.backupPath)
        || null;
  }

  _readActivationFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return this._decryptPayload(raw.trim());
    } catch {
      return null;
    }
  }

  _writeActivation(data) {
    this._ensureDir();
    const encrypted = this._encryptPayload(data);
    const tmp = this.activationPath + '.tmp';
    fs.writeFileSync(tmp, encrypted, 'utf8');
    fs.renameSync(tmp, this.activationPath);
    // Write backup copy
    try {
      fs.writeFileSync(this.backupPath, encrypted, 'utf8');
    } catch { /* backup is best-effort */ }
  }

  /** Start the 7-day trial explicitly (user chose "Start Trial" on Welcome page). */
  startTrial() {
    const existing = this._readActivation();
    if (existing?.licenseKey) {
      return { ok: false, error: 'This device already has a license key activated.' };
    }
    if (existing?.trialStartDate) {
      const trial = this._computeTrial(existing);
      if (!trial.expired) {
        return { ok: true, message: 'Trial already active.' };
      }
    }

    const record = {
      v: 1,
      trialStartDate: new Date().toISOString(),
    };
    this._writeActivation(record);
    return { ok: true };
  }

  /** Compute trial info from a record without writing anything. */
  _computeTrial(record) {
    if (!record?.trialStartDate) return { onTrial: false, daysLeft: 0, expired: true, trialStartDate: null };
    const start    = new Date(record.trialStartDate);
    const now      = new Date();
    const elapsed  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
    return { onTrial: true, daysLeft, expired: daysLeft <= 0, trialStartDate: record.trialStartDate };
  }

  /** Get trial info from stored record. */
  getTrialInfo() {
    const record = this._readActivation();
    if (!record) return { onTrial: false, daysLeft: 0, expired: true, trialStartDate: null };
    if (record.licenseKey) return { onTrial: false, daysLeft: 0, expired: false, trialStartDate: null };
    return this._computeTrial(record);
  }

  /**
   * @returns {{ status: LicenseStatus, activated: boolean, deviceMismatch: boolean, message?: string, deviceId: string, licenseKey?: string, activatedAt?: string, appVersion?: string, trial?: object }}
   */
  getStatus() {
    const deviceId = this.getDeviceId();
    const record   = this._readActivation();

    // No activation file at all — fresh install, show Welcome page
    if (!record) {
      return {
        status: 'not_activated',
        activated: false,
        deviceMismatch: false,
        deviceId,
        activationPath: this.activationPath,
      };
    }

    // Has a valid license key — check device binding
    if (record.licenseKey) {
      if (!record.deviceId) {
        return {
          status: 'corrupt',
          activated: false,
          deviceMismatch: false,
          message: 'Activation data is invalid. Please activate again.',
          deviceId,
        };
      }

      const keyCheck = this.validateLicenseKey(record.licenseKey);
      if (!keyCheck.valid) {
        return {
          status: 'corrupt',
          activated: false,
          deviceMismatch: false,
          message: 'Stored license key is invalid. Please activate again.',
          deviceId,
        };
      }

      if (record.deviceId !== deviceId) {
        return {
          status: 'device_mismatch',
          activated: false,
          deviceMismatch: true,
          message: 'This license is registered to another device. Copied activation files cannot be used on a different computer. Please contact Engr. Hamza Asad for a new license.',
          deviceId,
          licenseKey: this._maskKey(record.licenseKey),
          activatedAt: record.activatedAt,
        };
      }

      return {
        status: 'active',
        activated: true,
        deviceMismatch: false,
        deviceId,
        licenseKey: this._maskKey(record.licenseKey),
        licenseKeyFull: record.licenseKey,
        activatedAt: record.activatedAt,
        appVersion: record.appVersion,
        activationPath: this.activationPath,
      };
    }

    // No license key — trial mode
    const trial = this._computeTrial(record);
    if (trial.expired) {
      return {
        status: 'trial_expired',
        activated: false,
        deviceMismatch: false,
        message: 'Your 7-day trial has expired. Please enter a license key to continue.',
        deviceId,
        trial,
        activationPath: this.activationPath,
      };
    }

    return {
      status: 'trial_active',
      activated: true,
      deviceMismatch: false,
      deviceId,
      trial,
      activationPath: this.activationPath,
    };
  }

  isActivated() {
    const s = this.getStatus();
    return s.status === 'active' || s.status === 'trial_active';
  }

  _maskKey(key) {
    const formatted = LicenseService.formatKey(key);
    const parts = formatted.split('-');
    if (parts.length < 5) return 'MTP-****-****-****-****';
    return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
  }

  /**
   * Activate with license key; binds to current device.
   * Clears trial data — activation is now permanent.
   */
  activate(licenseKey) {
    const validation = this.validateLicenseKey(licenseKey);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }

    const deviceId = this.getDeviceId();
    const record = {
      v: 1,
      licenseKey: validation.formatted,
      deviceId,
      activatedAt: new Date().toISOString(),
      appVersion: this.appVersion,
    };

    try {
      this._writeActivation(record);
      return {
        ok: true,
        deviceId,
        licenseKey: validation.formatted,
        activatedAt: record.activatedAt,
      };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to save activation data.' };
    }
  }

  /** Owner diagnostics — full license details. */
  getOwnerInfo() {
    const status = this.getStatus();
    const record = this._readActivation();
    const trial  = this._computeTrial(record);
    return {
      ...status,
      licenseKey: record?.licenseKey || null,
      licenseKeyMasked: status.licenseKey || null,
      deviceId: this.getDeviceId(),
      activationFile: this.activationPath,
      activationDir: this.activationDir,
      trial,
    };
  }

  /** Remove activation (owner recovery). */
  deactivate() {
    try {
      if (fs.existsSync(this.activationPath)) {
        fs.unlinkSync(this.activationPath);
      }
      if (fs.existsSync(this.backupPath)) {
        fs.unlinkSync(this.backupPath);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  getPaths() {
    return {
      activationDir: this.activationDir,
      activationFile: this.activationPath,
    };
  }
}

module.exports = LicenseService;
