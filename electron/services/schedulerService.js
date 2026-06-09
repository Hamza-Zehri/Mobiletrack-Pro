'use strict';
const cron = require('node-cron');

class SchedulerService {
  constructor(backupService) {
    this.bk   = backupService;
    this._job = null;
  }

  start() { this._schedule(); }

  restart(settings) {
    if (this._job) { this._job.stop(); this._job = null; }
    this._schedule(settings);
  }

  _schedule(settings) {
    const cfg = settings || this.bk.db.prepare('SELECT * FROM backup_settings WHERE id=1').get();
    if (!cfg || !cfg.enabled) return;

    const [hh, mm] = (cfg.time || '06:00').split(':').map(Number);
    let expression = `${mm} ${hh} * * *`; // daily

    if (cfg.frequency === 'every6h') expression = `${mm} */6 * * *`;
    if (cfg.frequency === 'weekly')  expression = `${mm} ${hh} * * 0`;

    try {
      this._job = cron.schedule(expression, async () => {
        try {
          await this.bk.create(null);
          console.log('[Scheduler] Auto-backup completed');
        } catch(e) {
          console.error('[Scheduler] Auto-backup failed:', e.message);
        }
      });
      console.log(`[Scheduler] Auto-backup scheduled: ${expression}`);
    } catch(e) {
      console.error('[Scheduler] Invalid cron expression:', e.message);
    }
  }

  stop() { if (this._job) { this._job.stop(); this._job = null; } }
}

module.exports = SchedulerService;
