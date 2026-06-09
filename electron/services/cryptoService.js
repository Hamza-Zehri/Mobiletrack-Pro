'use strict';
const crypto = require('crypto');

const SECRET   = 'MobileTrackPro_FieldEnc_HamzaAsad_2026';
const PREFIX_R = 'ENC:R:';
const PREFIX_D = 'ENC:D:';

class CryptoService {
  constructor() {
    this.key    = crypto.scryptSync(SECRET, 'field_salt_mtp', 32);
    this.detKey = crypto.scryptSync(SECRET, 'det_salt_mtp', 32);
  }

  isEncrypted(value) {
    return typeof value === 'string' && (value.startsWith(PREFIX_R) || value.startsWith(PREFIX_D));
  }

  /** Random-IV encryption for display fields (name, address, cnic, notes). */
  encrypt(value) {
    if (value == null || value === '') return value;
    const text = String(value);
    if (this.isEncrypted(text)) return text;
    return PREFIX_R + this._seal(text, this.key, crypto.randomBytes(12));
  }

  /** Deterministic encryption for lookup fields (mobile, imei). */
  encryptDeterministic(value) {
    if (value == null || value === '') return value;
    const text = String(value);
    if (this.isEncrypted(text)) return text;
    const iv = crypto.createHmac('sha256', this.detKey).update(text.toLowerCase().trim()).digest().subarray(0, 12);
    return PREFIX_D + this._seal(text, this.detKey, iv);
  }

  decrypt(value) {
    if (value == null || value === '') return value;
    const text = String(value);
    if (text.startsWith(PREFIX_R)) return this._open(text.slice(PREFIX_R.length), this.key);
    if (text.startsWith(PREFIX_D)) return this._open(text.slice(PREFIX_D.length), this.detKey);
    return text;
  }

  _seal(text, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64url');
  }

  _open(payload, key) {
    try {
      const buf      = Buffer.from(payload, 'base64url');
      const iv       = buf.subarray(0, 12);
      const tag      = buf.subarray(12, 28);
      const data     = buf.subarray(28);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
      return payload;
    }
  }

  matchesSearch(value, query) {
    if (!query) return true;
    return this.decrypt(value).toLowerCase().includes(String(query).toLowerCase());
  }
}

module.exports = CryptoService;
