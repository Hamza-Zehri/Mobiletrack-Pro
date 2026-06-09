#!/usr/bin/env node
'use strict';

/**
 * Vendor tool — generate valid MobileTrack Pro license keys.
 * Usage: node electron/tools/generateLicenseKey.js [count]
 */

const LicenseService = require('../services/licenseService');

const count = Math.max(1, parseInt(process.argv[2], 10) || 1);

console.log(`\nMobileTrack Pro — License Key Generator\n${'─'.repeat(42)}`);

for (let i = 0; i < count; i++) {
  const key = LicenseService.generateKey();
  console.log(key);
}

console.log(`\nGenerated ${count} key(s). Distribute one key per installation.\n`);
