'use strict';
const bcrypt = require('bcryptjs');
const CryptoService = require('./cryptoService');

class DBService {
  constructor(db) {
    this.db = db;
    this.crypto = new CryptoService();
    this._migrateEncryptExisting();
  }

  // ─── Field encryption (store encrypted, return readable) ───────────────
  _encCustomer(data) {
    return {
      name:    this.crypto.encrypt(data.name),
      mobile:  data.mobile  ? this.crypto.encryptDeterministic(data.mobile)  : null,
      cnic:    data.cnic    ? this.crypto.encrypt(data.cnic)    : null,
      address: data.address ? this.crypto.encrypt(data.address) : null,
      notes:   data.notes   ? this.crypto.encrypt(data.notes)   : null,
    };
  }

  _encSupplier(data) {
    return {
      name:        this.crypto.encrypt(data.name),
      mobile:      data.mobile      ? this.crypto.encryptDeterministic(data.mobile)      : null,
      market_name: data.market_name ? this.crypto.encrypt(data.market_name) : null,
    };
  }

  _encPhone(data) {
    return {
      imei1: data.imei1 ? this.crypto.encryptDeterministic(data.imei1) : null,
      imei2: data.imei2 ? this.crypto.encryptDeterministic(data.imei2) : null,
      notes: data.notes ? this.crypto.encrypt(data.notes) : null,
    };
  }

  _decCustomer(row, fields = ['name', 'mobile', 'cnic', 'address', 'notes']) {
    if (!row) return row;
    const out = { ...row };
    for (const f of fields) {
      if (out[f] != null) out[f] = this.crypto.decrypt(out[f]);
    }
    return out;
  }

  _decryptRow(row) {
    if (!row) return row;
    let out = this._decCustomer(row);
    out = this._decCustomer(out, ['imei1', 'imei2']);
    if (out.notes != null) out.notes = this.crypto.decrypt(out.notes);
    if (out.customer != null) out.customer = this.crypto.decrypt(out.customer);
    if (out.customer_mobile != null) out.customer_mobile = this.crypto.decrypt(out.customer_mobile);
    if (out.customer_cnic != null) out.customer_cnic = this.crypto.decrypt(out.customer_cnic);
    if (out.customer_address != null) out.customer_address = this.crypto.decrypt(out.customer_address);
    if (out.sale_customer != null) out.sale_customer = this.crypto.decrypt(out.sale_customer);
    if (out.sale_customer_mobile != null) out.sale_customer_mobile = this.crypto.decrypt(out.sale_customer_mobile);
    if (out.purchase_source != null) out.purchase_source = this.crypto.decrypt(out.purchase_source);
    if (out.source != null) out.source = this.crypto.decrypt(out.source);
    if (out.source_name != null) out.source_name = this.crypto.decrypt(out.source_name);
    if (out.market_name != null) out.market_name = this.crypto.decrypt(out.market_name);
    if (out.sup_mobile != null) out.sup_mobile = this.crypto.decrypt(out.sup_mobile);
    return out;
  }

  _decryptRows(rows) {
    return (rows || []).map(r => this._decryptRow(r));
  }

  _migrateEncryptExisting() {
    if (this._settings('field_encryption_migrated')) return;
    const run = this.db.transaction(() => {
      for (const c of this.db.prepare('SELECT * FROM customers').all()) {
        const e = this._encCustomer(c);
        this.db.prepare('UPDATE customers SET name=?,mobile=?,cnic=?,address=?,notes=? WHERE id=?')
          .run(e.name, e.mobile, e.cnic, e.address, e.notes, c.id);
      }
      for (const s of this.db.prepare('SELECT * FROM suppliers').all()) {
        const e = this._encSupplier(s);
        this.db.prepare('UPDATE suppliers SET name=?,mobile=?,market_name=? WHERE id=?')
          .run(e.name, e.mobile, e.market_name, s.id);
      }
      for (const p of this.db.prepare('SELECT * FROM phones').all()) {
        const e = this._encPhone(p);
        this.db.prepare('UPDATE phones SET imei1=?,imei2=?,notes=? WHERE id=?')
          .run(e.imei1, e.imei2, e.notes, p.id);
      }
      for (const p of this.db.prepare('SELECT * FROM purchases').all()) {
        this.db.prepare('UPDATE purchases SET market_name=?,notes=? WHERE id=?').run(
          p.market_name ? this.crypto.encrypt(p.market_name) : null,
          p.notes ? this.crypto.encrypt(p.notes) : null,
          p.id
        );
      }
    });
    run();
    this._settings('field_encryption_migrated', true);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────
  _settings(key, val) {
    if (val === undefined) {
      const row = this.db.prepare('SELECT value FROM settings WHERE key=?').get(key);
      return row ? JSON.parse(row.value) : null;
    }
    this.db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)').run(key, JSON.stringify(val));
  }

  _nextInvoiceNumber() {
    const year = new Date().getFullYear();
    const row = this.db.prepare(`SELECT COUNT(*) as c FROM sales WHERE invoice_number LIKE 'INV-${year}-%'`).get();
    const num = String((row.c || 0) + 1).padStart(4, '0');
    return `INV-${year}-${num}`;
  }

  // ─── Setup / Auth ────────────────────────────────────────────────────────
  isFirstRun() {
    return !this._settings('setup_complete');
  }

  completeSetup(data) {
    const { shop, password } = data;
    const hash = bcrypt.hashSync(password, 10);
    this._settings('shop', shop);
    this._settings('auth', { username: 'admin', passwordHash: hash });
    this._settings('invoice_terms', shop.invoiceTerms || '');
    this._settings('whatsapp_template', `السلام علیکم\n\nآپ کا خریداری انوائس منسلک ہے۔\n\nشکریہ\n${shop.name}`);
    this._settings('setup_complete', true);
    return { ok: true };
  }

  login(username, password) {
    const auth = this._settings('auth');
    if (!auth) return { ok: false, error: 'Not set up' };
    if (auth.username !== username) return { ok: false, error: 'Invalid credentials' };
    if (!bcrypt.compareSync(password, auth.passwordHash)) return { ok: false, error: 'Invalid credentials' };
    return { ok: true };
  }

  changePassword(oldPass, newPass) {
    const auth = this._settings('auth');
    if (!bcrypt.compareSync(oldPass, auth.passwordHash)) return { ok: false, error: 'Current password is wrong' };
    auth.passwordHash = bcrypt.hashSync(newPass, 10);
    this._settings('auth', auth);
    return { ok: true };
  }

  getSettings() {
    return {
      shop:             this._settings('shop') || {},
      invoiceTerms:     this._settings('invoice_terms') || '',
      whatsappTemplate: this._settings('whatsapp_template') || '',
      invoiceFooter:    this._settings('invoice_footer') || 'Thank you for your purchase!',
    };
  }

  saveSettings(data) {
    Object.entries(data).forEach(([k, v]) => this._settings(k, v));
    return { ok: true };
  }

  getBackupSettings() {
    return this.db.prepare('SELECT * FROM backup_settings WHERE id=1').get();
  }

  saveBackupSettings(s) {
    this.db.prepare(`UPDATE backup_settings SET enabled=?,frequency=?,time=?,backup_folder=? WHERE id=1`)
      .run(s.enabled ? 1 : 0, s.frequency, s.time, s.backup_folder);
    return { ok: true };
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────
  getDashboardStats() {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const ms = monthStart.toISOString().slice(0,10);
    return {
      totalStock:      this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available'").get().c,
      totalStockValue: this.db.prepare("SELECT COALESCE(SUM(cost_price),0) v FROM phones WHERE status='available'").get().v,
      totalSold:       this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='sold'").get().c,
      monthlySales:    this.db.prepare("SELECT COALESCE(SUM(final_amount),0) v FROM sales WHERE DATE(sale_date)>=?").get(ms).v,
      monthlyProfit:   this.db.prepare("SELECT COALESCE(SUM(profit),0) v FROM sales WHERE DATE(sale_date)>=?").get(ms).v,
      totalCustomers:  this.db.prepare("SELECT COUNT(*) c FROM customers").get().c,
      byPta: {
        pta:     this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available' AND pta_status='pta'").get().c,
        non_pta: this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available' AND pta_status='non_pta'").get().c,
        jv:      this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available' AND pta_status='jv'").get().c,
        cpid:    this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available' AND pta_status='cpid'").get().c,
        android: this.db.prepare("SELECT COUNT(*) c FROM phones WHERE status='available' AND brand!='Apple'").get().c,
      }
    };
  }

  getChartData() {
    const rows = this.db.prepare(`
      SELECT strftime('%m',sale_date) mo, SUM(final_amount) sales, SUM(profit) profit
      FROM sales WHERE sale_date >= date('now','-6 months')
      GROUP BY mo ORDER BY mo
    `).all();
    return rows;
  }

  getRecentActivity() {
    const purchases = this._decryptRows(this.db.prepare(`
      SELECT p.id, p.created_at, ph.model, ph.brand, ph.cost_price,
             COALESCE(s.name, c.name) source, p.type
      FROM phones ph
      JOIN purchases p ON ph.purchase_id=p.id
      LEFT JOIN suppliers s ON p.supplier_id=s.id
      LEFT JOIN customers c ON p.customer_id=c.id
      ORDER BY p.created_at DESC LIMIT 5
    `).all());
    const sales = this._decryptRows(this.db.prepare(`
      SELECT s.id, s.invoice_number, s.sale_date, s.final_amount,
             ph.model, ph.brand, c.name customer
      FROM sales s JOIN phones ph ON s.phone_id=ph.id JOIN customers c ON s.customer_id=c.id
      ORDER BY s.created_at DESC LIMIT 5
    `).all());
    return { purchases, sales };
  }

  // ─── Phones ──────────────────────────────────────────────────────────────
  getPhones(filters = {}) {
    let sql = `SELECT ph.*, s.invoice_number, s.final_amount sale_amount,
               COALESCE(sup.name, c.name) source_name
               FROM phones ph
               LEFT JOIN purchases pur ON ph.purchase_id=pur.id
               LEFT JOIN suppliers sup ON pur.supplier_id=sup.id
               LEFT JOIN customers c   ON pur.customer_id=c.id
               LEFT JOIN sales s       ON ph.id=s.phone_id
               WHERE 1=1`;
    const params = [];
    if (filters.status && filters.status !== 'all') { sql += ' AND ph.status=?'; params.push(filters.status); }
    if (filters.pta_status) { sql += ' AND ph.pta_status=?'; params.push(filters.pta_status); }
    if (filters.brand)      { sql += ' AND ph.brand=?';       params.push(filters.brand); }
    sql += ' ORDER BY ph.created_at DESC';
    let rows = this._decryptRows(this.db.prepare(sql).all(...params));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r =>
        (r.imei1 || '').toLowerCase().includes(q) ||
        (r.imei2 || '').toLowerCase().includes(q) ||
        (r.model || '').toLowerCase().includes(q) ||
        (r.invoice_number || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }

  getPhoneById(id) {
    let phone = this.db.prepare(`
      SELECT ph.*, COALESCE(sup.name, c.name) source_name
      FROM phones ph
      LEFT JOIN purchases pur ON ph.purchase_id=pur.id
      LEFT JOIN suppliers sup ON pur.supplier_id=sup.id
      LEFT JOIN customers c   ON pur.customer_id=c.id
      WHERE ph.id=?
    `).get(id);
    if (phone) {
      phone = this._decryptRow(phone);
      phone.images = this.db.prepare('SELECT * FROM phone_images WHERE phone_id=?').all(id);
    }
    return phone;
  }

  checkImeiDuplicate(imei, excludeId = null) {
    const enc = this.crypto.encryptDeterministic(imei);
    let sql = 'SELECT id FROM phones WHERE imei1=? OR imei2=?';
    const params = [enc, enc];
    if (excludeId) { sql += ' AND id!=?'; params.push(excludeId); }
    return !!this.db.prepare(sql).get(...params);
  }

  addPhone(data) {
    const insert = this.db.transaction((d) => {
      const enc = this._encPhone(d);
      const r = this.db.prepare(`
        INSERT INTO phones(brand,model,color,storage,pta_status,battery_health,face_id,true_tone,
          sim_lock,imei1,imei2,box,charger,cable,earphones,cost_price,sale_price,purchase_id,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.brand, d.model, d.color, d.storage, d.pta_status,
        d.battery_health, d.face_id||'N/A', d.true_tone||'N/A', d.sim_lock||'Unlocked',
        enc.imei1, enc.imei2,
        d.box?1:0, d.charger?1:0, d.cable?1:0, d.earphones?1:0,
        d.cost_price, d.sale_price||null, d.purchase_id||null, enc.notes
      );
      if (d.images && d.images.length) {
        const imgStmt = this.db.prepare('INSERT INTO phone_images(phone_id,path) VALUES(?,?)');
        d.images.forEach(p => imgStmt.run(r.lastInsertRowid, p));
      }
      return r.lastInsertRowid;
    });
    return { ok: true, id: insert(data) };
  }

  updatePhone(id, data) {
    const enc = this._encPhone(data);
    this.db.prepare(`
      UPDATE phones SET brand=?,model=?,color=?,storage=?,pta_status=?,battery_health=?,
        face_id=?,true_tone=?,sim_lock=?,imei2=?,box=?,charger=?,cable=?,earphones=?,
        cost_price=?,sale_price=?,notes=? WHERE id=?
    `).run(
      data.brand, data.model, data.color, data.storage, data.pta_status,
      data.battery_health, data.face_id, data.true_tone, data.sim_lock, enc.imei2,
      data.box?1:0, data.charger?1:0, data.cable?1:0, data.earphones?1:0,
      data.cost_price, data.sale_price, enc.notes, id
    );
    return { ok: true };
  }

  deletePhone(id) {
    this.db.prepare('DELETE FROM phones WHERE id=?').run(id);
    return { ok: true };
  }

  getPhoneHistory(query) {
    let phones = this._decryptRows(this.db.prepare(`
      SELECT ph.*,
        COALESCE(sup.name, pc.name) purchase_source,
        pur.purchase_date, pur.type purchase_type,
        s.invoice_number, s.sale_date, s.final_amount, s.profit,
        sc.name sale_customer, sc.mobile sale_customer_mobile
      FROM phones ph
      LEFT JOIN purchases pur ON ph.purchase_id=pur.id
      LEFT JOIN suppliers sup ON pur.supplier_id=sup.id
      LEFT JOIN customers pc  ON pur.customer_id=pc.id
      LEFT JOIN sales s       ON ph.id=s.phone_id
      LEFT JOIN customers sc  ON s.customer_id=sc.id
      ORDER BY ph.created_at DESC LIMIT 200
    `).all());
    if (!query) return phones.slice(0, 50);
    const q = query.toLowerCase();
    return phones.filter(r =>
      (r.imei1 || '').toLowerCase().includes(q) ||
      (r.imei2 || '').toLowerCase().includes(q) ||
      (r.model || '').toLowerCase().includes(q) ||
      (r.sale_customer || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }

  // ─── Purchases ───────────────────────────────────────────────────────────
  getPurchases(filters = {}) {
    let sql = `SELECT p.*, COALESCE(s.name,c.name) source_name,
               COUNT(ph.id) phone_count, SUM(ph.cost_price) total_cost
               FROM purchases p
               LEFT JOIN suppliers s ON p.supplier_id=s.id
               LEFT JOIN customers c ON p.customer_id=c.id
               LEFT JOIN phones ph   ON ph.purchase_id=p.id
               WHERE 1=1`;
    const params = [];
    if (filters.type)   { sql += ' AND p.type=?';          params.push(filters.type); }
    if (filters.from)   { sql += ' AND DATE(p.purchase_date)>=?'; params.push(filters.from); }
    if (filters.to)     { sql += ' AND DATE(p.purchase_date)<=?'; params.push(filters.to); }
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    return this._decryptRows(this.db.prepare(sql).all(...params));
  }

  getPurchaseById(id) {
    let purchase = this.db.prepare(`
      SELECT p.*, COALESCE(s.name,c.name) source_name, s.mobile sup_mobile
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id=s.id
      LEFT JOIN customers c ON p.customer_id=c.id
      WHERE p.id=?
    `).get(id);
    if (purchase) {
      purchase = this._decryptRow(purchase);
      purchase.phones = this._decryptRows(this.db.prepare('SELECT * FROM phones WHERE purchase_id=?').all(id));
    }
    return purchase;
  }

  addPurchase(data) {
    const run = this.db.transaction((d) => {
      let supplierId = null, customerId = null;
      if (d.type === 'bulk') {
        const sup = this._encSupplier({ name: d.supplier_name, mobile: d.supplier_mobile, market_name: d.market_name });
        const r = this.db.prepare('INSERT INTO suppliers(name,mobile,market_name) VALUES(?,?,?)').run(sup.name, sup.mobile, sup.market_name);
        supplierId = r.lastInsertRowid;
      } else if (d.type === 'customer') {
        customerId = this._upsertCustomer({ name: d.customer_name, mobile: d.customer_mobile, cnic: d.customer_cnic, address: d.customer_address });
      }
      const pr = this.db.prepare(`
        INSERT INTO purchases(type,supplier_id,customer_id,market_name,purchase_date,notes,total_cost)
        VALUES(?,?,?,?,?,?,?)
      `).run(
        d.type, supplierId, customerId,
        d.market_name ? this.crypto.encrypt(d.market_name) : null,
        d.purchase_date,
        d.notes ? this.crypto.encrypt(d.notes) : null,
        d.cost_price||0
      );
      const pid = pr.lastInsertRowid;
      const phone = { ...d.phone, purchase_id: pid };
      return this.addPhone(phone);
    });
    return run(data);
  }

  addBulkPurchase(data) {
    const run = this.db.transaction((d) => {
      const sup = this._encSupplier({ name: d.supplier_name, mobile: d.supplier_mobile, market_name: d.market_name });
      const sr = this.db.prepare('INSERT INTO suppliers(name,mobile,market_name) VALUES(?,?,?)').run(sup.name, sup.mobile, sup.market_name);
      const sid = sr.lastInsertRowid;
      const totalCost = (d.phones || []).reduce((sum, p) => sum + (parseFloat(p.cost_price)||0), 0);
      const pr = this.db.prepare(`
        INSERT INTO purchases(type,supplier_id,market_name,purchase_date,notes,total_cost)
        VALUES('bulk',?,?,?,?,?)
      `).run(
        sid,
        d.market_name ? this.crypto.encrypt(d.market_name) : null,
        d.purchase_date,
        d.notes ? this.crypto.encrypt(d.notes) : null,
        totalCost
      );
      const pid = pr.lastInsertRowid;
      const ids = [];
      for (const phone of (d.phones || [])) {
        const res = this.addPhone({ ...phone, purchase_id: pid });
        ids.push(res.id);
      }
      return { ok: true, purchase_id: pid, phone_ids: ids };
    });
    return run(data);
  }

  _upsertCustomer(c) {
    if (!c.name) return null;
    const enc = this._encCustomer(c);
    let row = enc.mobile ? this.db.prepare('SELECT id FROM customers WHERE mobile=?').get(enc.mobile) : null;
    if (row) return row.id;
    const r = this.db.prepare('INSERT INTO customers(name,mobile,cnic,address) VALUES(?,?,?,?)').run(enc.name, enc.mobile, enc.cnic, enc.address);
    return r.lastInsertRowid;
  }

  // ─── Customers ───────────────────────────────────────────────────────────
  getCustomers(query = '') {
    let rows = this._decryptRows(this.db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM sales s JOIN phones ph ON s.phone_id=ph.id WHERE s.customer_id=c.id) sold_to,
        (SELECT COUNT(*) FROM purchases pur WHERE pur.customer_id=c.id) bought_from
      FROM customers c
      ORDER BY c.created_at DESC
    `).all());
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.mobile || '').toLowerCase().includes(q) ||
      (r.cnic || '').toLowerCase().includes(q)
    );
  }

  getCustomerById(id) {
    return this._decryptCustomer(this.db.prepare('SELECT * FROM customers WHERE id=?').get(id));
  }

  addCustomer(data) {
    const enc = this._encCustomer(data);
    const r = this.db.prepare('INSERT INTO customers(name,mobile,cnic,address,notes) VALUES(?,?,?,?,?)').run(enc.name, enc.mobile, enc.cnic, enc.address, enc.notes);
    return { ok: true, id: r.lastInsertRowid };
  }

  updateCustomer(id, data) {
    const enc = this._encCustomer(data);
    this.db.prepare('UPDATE customers SET name=?,mobile=?,cnic=?,address=?,notes=? WHERE id=?').run(enc.name, enc.mobile, enc.cnic, enc.address, enc.notes, id);
    return { ok: true };
  }

  deleteCustomer(id) {
    this.db.prepare('DELETE FROM customers WHERE id=?').run(id);
    return { ok: true };
  }

  getCustomerHistory(id) {
    const sales = this._decryptRows(this.db.prepare(`
      SELECT s.*, ph.model, ph.brand, ph.storage, ph.pta_status, ph.imei1
      FROM sales s JOIN phones ph ON s.phone_id=ph.id
      WHERE s.customer_id=? ORDER BY s.sale_date DESC
    `).all(id));
    const purchases = this._decryptRows(this.db.prepare(`
      SELECT ph.*, pur.purchase_date
      FROM phones ph JOIN purchases pur ON ph.purchase_id=pur.id
      WHERE pur.customer_id=? ORDER BY pur.purchase_date DESC
    `).all(id));
    return { sales, purchases };
  }

  // ─── Sales ───────────────────────────────────────────────────────────────
  getSales(filters = {}) {
    let sql = `SELECT s.*, ph.model, ph.brand, ph.storage, ph.pta_status, ph.imei1,
               c.name customer, c.mobile customer_mobile
               FROM sales s JOIN phones ph ON s.phone_id=ph.id JOIN customers c ON s.customer_id=c.id
               WHERE 1=1`;
    const params = [];
    if (filters.from) { sql += ' AND DATE(s.sale_date)>=?'; params.push(filters.from); }
    if (filters.to)   { sql += ' AND DATE(s.sale_date)<=?'; params.push(filters.to); }
    sql += ' ORDER BY s.created_at DESC';
    let rows = this._decryptRows(this.db.prepare(sql).all(...params));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r =>
        (r.invoice_number || '').toLowerCase().includes(q) ||
        (r.model || '').toLowerCase().includes(q) ||
        (r.customer || '').toLowerCase().includes(q) ||
        (r.imei1 || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }

  getSaleById(id) {
    return this._decryptRow(this.db.prepare(`
      SELECT s.*, ph.*, c.name customer, c.mobile customer_mobile, c.cnic customer_cnic, c.address customer_address
      FROM sales s JOIN phones ph ON s.phone_id=ph.id JOIN customers c ON s.customer_id=c.id
      WHERE s.id=?
    `).get(id));
  }

  createSale(data) {
    const run = this.db.transaction((d) => {
      let customerId = d.customer_id;
      if (!customerId) {
        customerId = this._upsertCustomer({ name: d.customer_name, mobile: d.customer_mobile, cnic: d.customer_cnic, address: d.customer_address });
      }
      const phone = this.db.prepare('SELECT * FROM phones WHERE id=?').get(d.phone_id);
      if (!phone) throw new Error('Phone not found');
      if (phone.status !== 'available') throw new Error('Phone already sold');
      const finalAmount = (d.sale_price||0) - (d.discount||0);
      const profit = finalAmount - phone.cost_price;
      const invoiceNo = this._nextInvoiceNumber();
      const r = this.db.prepare(`
        INSERT INTO sales(invoice_number,phone_id,customer_id,sale_price,discount,final_amount,cost_price,profit,notes)
        VALUES(?,?,?,?,?,?,?,?,?)
      `).run(invoiceNo, d.phone_id, customerId, d.sale_price, d.discount||0, finalAmount, phone.cost_price, profit, d.notes||null);
      this.db.prepare("UPDATE phones SET status='sold' WHERE id=?").run(d.phone_id);
      return { ok: true, id: r.lastInsertRowid, invoice_number: invoiceNo };
    });
    return run(data);
  }

  // ─── Reports ─────────────────────────────────────────────────────────────
  getSalesReport(range) {
    const { from, to } = range;
    return this._decryptRows(this.db.prepare(`
      SELECT s.*, ph.model, ph.brand, ph.storage, ph.pta_status, ph.imei1,
             c.name customer, c.mobile customer_mobile
      FROM sales s JOIN phones ph ON s.phone_id=ph.id JOIN customers c ON s.customer_id=c.id
      WHERE DATE(s.sale_date) BETWEEN ? AND ? ORDER BY s.sale_date DESC
    `).all(from, to));
  }

  getProfitReport(range) {
    const { from, to } = range;
    const rows = this.db.prepare(`
      SELECT DATE(sale_date) d, SUM(final_amount) revenue, SUM(profit) profit, COUNT(*) qty
      FROM sales WHERE DATE(sale_date) BETWEEN ? AND ?
      GROUP BY d ORDER BY d
    `).all(from, to);
    const totals = this.db.prepare(`
      SELECT SUM(final_amount) revenue, SUM(profit) profit, COUNT(*) qty
      FROM sales WHERE DATE(sale_date) BETWEEN ? AND ?
    `).get(from, to);
    return { rows, totals };
  }

  getPurchaseReport(range) {
    const { from, to } = range;
    return this._decryptRows(this.db.prepare(`
      SELECT p.*, COALESCE(s.name,c.name) source_name, COUNT(ph.id) phones, SUM(ph.cost_price) total
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id=s.id
      LEFT JOIN customers c ON p.customer_id=c.id
      LEFT JOIN phones ph ON ph.purchase_id=p.id
      WHERE DATE(p.purchase_date) BETWEEN ? AND ?
      GROUP BY p.id ORDER BY p.purchase_date DESC
    `).all(from, to));
  }

  getInventoryReport() {
    return this._decryptRows(this.db.prepare(`
      SELECT ph.*, COALESCE(sup.name,c.name) source
      FROM phones ph
      LEFT JOIN purchases pur ON ph.purchase_id=pur.id
      LEFT JOIN suppliers sup ON pur.supplier_id=sup.id
      LEFT JOIN customers c   ON pur.customer_id=c.id
      WHERE ph.status='available' ORDER BY ph.created_at DESC
    `).all());
  }

  getCustomerReport(id) {
    const customer = this.getCustomerById(id);
    const history  = this.getCustomerHistory(id);
    return { customer, ...history };
  }
}

module.exports = DBService;
