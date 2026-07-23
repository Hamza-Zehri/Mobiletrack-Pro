'use strict';
const Database = require('better-sqlite3');

class DB {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('cache_size = -16000');
    this.init();
  }

  init() {
    this.db.exec(`
      -- ── Settings ──────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT
      );

      -- ── Customers ─────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS customers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        mobile     TEXT,
        cnic       TEXT,
        address    TEXT,
        notes      TEXT,
        created_at TEXT    DEFAULT (datetime('now','localtime'))
      );

      -- ── Suppliers ─────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS suppliers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        mobile      TEXT,
        market_name TEXT,
        created_at  TEXT DEFAULT (datetime('now','localtime'))
      );

      -- ── Purchases (header) ────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS purchases (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        type          TEXT    NOT NULL CHECK(type IN ('customer','bulk')),
        supplier_id   INTEGER REFERENCES suppliers(id),
        customer_id   INTEGER REFERENCES customers(id),
        market_name   TEXT,
        purchase_date TEXT    NOT NULL,
        notes         TEXT,
        total_cost    REAL    DEFAULT 0,
        created_at    TEXT    DEFAULT (datetime('now','localtime'))
      );

      -- ── Phones ────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS phones (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        brand           TEXT    NOT NULL,
        model           TEXT    NOT NULL,
        color           TEXT,
        storage         TEXT,
        pta_status      TEXT    NOT NULL CHECK(pta_status IN ('pta','non_pta','jv','cpid','unlocked')),
        battery_health  TEXT,
        face_id         TEXT    DEFAULT 'N/A',
        true_tone       TEXT    DEFAULT 'N/A',
        sim_lock        TEXT    DEFAULT 'Unlocked',
        imei1           TEXT    UNIQUE NOT NULL,
        imei2           TEXT,
        box             INTEGER DEFAULT 0,
        charger         INTEGER DEFAULT 0,
        cable           INTEGER DEFAULT 0,
        earphones       INTEGER DEFAULT 0,
        cost_price      REAL    NOT NULL,
        sale_price      REAL,
        status          TEXT    NOT NULL DEFAULT 'available' CHECK(status IN ('available','sold','reserved')),
        purchase_id     INTEGER REFERENCES purchases(id),
        notes           TEXT,
        created_at      TEXT    DEFAULT (datetime('now','localtime'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_phones_imei1 ON phones(imei1);
      CREATE INDEX IF NOT EXISTS idx_phones_status     ON phones(status);
      CREATE INDEX IF NOT EXISTS idx_phones_pta_status ON phones(pta_status);
      CREATE INDEX IF NOT EXISTS idx_phones_model      ON phones(model);

      -- ── Phone Images ──────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS phone_images (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_id   INTEGER NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
        image_type TEXT    NOT NULL DEFAULT 'phone' CHECK(image_type IN ('phone','cnic')),
        path       TEXT    NOT NULL,
        created_at TEXT    DEFAULT (datetime('now','localtime'))
      );

      -- ── Sales ─────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS sales (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT    UNIQUE NOT NULL,
        phone_id       INTEGER NOT NULL REFERENCES phones(id),
        customer_id    INTEGER NOT NULL REFERENCES customers(id),
        sale_price     REAL    NOT NULL,
        discount       REAL    DEFAULT 0,
        final_amount   REAL    NOT NULL,
        cost_price     REAL    NOT NULL,
        profit         REAL    NOT NULL,
        invoice_path   TEXT,
        returned       INTEGER DEFAULT 0,
        sale_date      TEXT    DEFAULT (datetime('now','localtime')),
        notes          TEXT,
        created_at     TEXT    DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_sales_phone   ON sales(phone_id);
      CREATE INDEX IF NOT EXISTS idx_sales_date    ON sales(sale_date);

      -- ── Phone Returns ─────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS phone_returns (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id       INTEGER NOT NULL REFERENCES sales(id),
        phone_id      INTEGER NOT NULL REFERENCES phones(id),
        return_date   TEXT    DEFAULT (datetime('now','localtime')),
        reason        TEXT,
        refund_amount REAL    NOT NULL DEFAULT 0,
        notes         TEXT,
        created_at    TEXT    DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_returns_sale  ON phone_returns(sale_id);
      CREATE INDEX IF NOT EXISTS idx_returns_phone ON phone_returns(phone_id);

      -- ── Backup Settings ───────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS backup_settings (
        id             INTEGER PRIMARY KEY DEFAULT 1,
        enabled        INTEGER DEFAULT 1,
        frequency      TEXT    DEFAULT 'daily',
        time           TEXT    DEFAULT '06:00',
        backup_folder  TEXT,
        last_backup_at TEXT
      );

      INSERT OR IGNORE INTO backup_settings(id) VALUES(1);
    `);

    // ── Migrations for existing databases ──
    try { this.db.exec("ALTER TABLE sales ADD COLUMN returned INTEGER DEFAULT 0"); } catch {}
    try { this.db.exec("ALTER TABLE phone_images ADD COLUMN image_type TEXT NOT NULL DEFAULT 'phone'"); } catch {}
  }

  get raw() { return this.db; }

  prepare(sql)   { return this.db.prepare(sql); }
  exec(sql)      { return this.db.exec(sql); }
  transaction(fn){ return this.db.transaction(fn); }
  close()        { return this.db.close(); }
}

module.exports = DB;
