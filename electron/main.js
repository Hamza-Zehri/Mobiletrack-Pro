'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let db;
let dbService;
let backupService;
let schedulerService;
let licenseService;

// ─── Single instance lock ────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Resolve paths (dev + packaged) ─────────────────────────────────────────
function resolvePath(...segments) {
  return path.join(__dirname, ...segments);
}

// ─── App Paths ───────────────────────────────────────────────────────────────
const USER_DATA  = app.getPath('userData');
const APP_DATA   = app.getPath('appData');
const DB_PATH    = path.join(USER_DATA, 'mobiletrack.db');
const IMG_DIR    = path.join(USER_DATA, 'images');
const INV_DIR    = path.join(USER_DATA, 'invoices');
const LOGO_PATH  = path.join(USER_DATA, 'logo.png');
const BACKUP_DIR = path.join(USER_DATA, 'backups');

[IMG_DIR, INV_DIR, BACKUP_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ─── License gate for business IPC ───────────────────────────────────────────
const LICENSE_EXEMPT = new Set([
  'window:minimize', 'window:maximize', 'window:close',
  'app:paths',
  'license:getStatus', 'license:getDeviceId', 'license:activate',
  'license:getOwnerInfo', 'license:deactivate', 'license:getPaths',
]);

function requireLicense(channel) {
  if (LICENSE_EXEMPT.has(channel)) return true;
  return licenseService?.isActivated();
}

// ─── Window ──────────────────────────────────────────────────────────────────
function createWindow() {
  const preloadPath = resolvePath('preload.js');

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 700,
    frame: false, titleBarStyle: 'hidden',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#0f1117',
    icon: resolvePath('../assets/icon.png'),
  });

  mainWindow.once('ready-to-show', () => { mainWindow.show(); });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(resolvePath('../build/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App Ready ───────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.hamzaasad.mobiletrackpro');
  }

  const pkg = require('../package.json');
  const LicenseService = require('./services/licenseService');
  licenseService = new LicenseService(APP_DATA, pkg.version);

  const Database  = require('./database');
  const DBService = require('./services/dbService');
  const BackupSvc = require('./services/backupService');
  const SchedSvc  = require('./services/schedulerService');

  db               = new Database(DB_PATH);
  dbService        = new DBService(db);
  backupService    = new BackupSvc(db, USER_DATA, BACKUP_DIR);
  schedulerService = new SchedSvc(backupService);

  registerIpcHandlers(dbService, backupService);
  schedulerService.start();
  createWindow();

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── IPC Handlers ────────────────────────────────────────────────────────────
function registerIpcHandlers(svc, bk) {

  const guarded = (channel, handler) => {
    ipcMain.handle(channel, async (event, ...args) => {
      if (!requireLicense(channel)) {
        return { ok: false, error: 'Software is not activated.', code: 'LICENSE_REQUIRED' };
      }
      return handler(event, ...args);
    });
  };

  // Window controls (always allowed)
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
  ipcMain.on('window:close',    () => mainWindow?.close());

  // App paths
  ipcMain.handle('app:paths', () => ({
    userData: USER_DATA,
    appData: APP_DATA,
    images: IMG_DIR,
    invoices: INV_DIR,
    logo: LOGO_PATH,
    backups: BACKUP_DIR,
    ...licenseService.getPaths(),
  }));

  // ── License (always allowed) ──
  ipcMain.handle('license:getStatus',    () => licenseService.getStatus());
  ipcMain.handle('license:activate',     (_, key) => licenseService.activate(key));
  ipcMain.handle('license:startTrial',   () => licenseService.startTrial());
  ipcMain.handle('license:getOwnerInfo', () => licenseService.getOwnerInfo());
  ipcMain.handle('license:deactivate',   () => licenseService.deactivate());
  ipcMain.handle('license:getPaths',     () => licenseService.getPaths());

  // ── Setup / Settings ──
  guarded('setup:isFirstRun', () => svc.isFirstRun());
  guarded('setup:complete',   (_, data) => svc.completeSetup(data));
  guarded('settings:get',     () => svc.getSettings());
  guarded('settings:save',    (_, data) => svc.saveSettings(data));

  // ── Auth ──
  guarded('auth:login',          (_, u, p) => svc.login(u, p));
  guarded('auth:changePassword', (_, old, nw) => svc.changePassword(old, nw));

  // ── Dashboard ──
  guarded('dashboard:stats',     () => svc.getDashboardStats());
  guarded('dashboard:charts',    () => svc.getChartData());
  guarded('dashboard:activity',  () => svc.getRecentActivity());

  // ── Inventory / Phones ──
  guarded('phones:getAll',    (_, filters) => svc.getPhones(filters));
  guarded('phones:getById',   (_, id) => svc.getPhoneById(id));
  guarded('phones:add',       (_, data) => svc.addPhone(data));
  guarded('phones:update',    (_, id, data) => svc.updatePhone(id, data));
  guarded('phones:delete',    (_, id) => svc.deletePhone(id));
  guarded('phones:history',   (_, q) => svc.getPhoneHistory(q));
  guarded('phones:checkImei', (_, imei, excludeId) => svc.checkImeiDuplicate(imei, excludeId));
  guarded('phones:getImages', (_, id) => svc.getPhoneImages(id));

  // ── Purchases ──
  guarded('purchases:getAll',  (_, filters) => svc.getPurchases(filters));
  guarded('purchases:getById', (_, id) => svc.getPurchaseById(id));
  guarded('purchases:add',     (_, data) => svc.addPurchase(data));
  guarded('purchases:addBulk', (_, data) => svc.addBulkPurchase(data));

  // ── Customers ──
  guarded('customers:getAll',    (_, q) => svc.getCustomers(q));
  guarded('customers:getById',   (_, id) => svc.getCustomerById(id));
  guarded('customers:add',       (_, data) => svc.addCustomer(data));
  guarded('customers:update',    (_, id, data) => svc.updateCustomer(id, data));
  guarded('customers:delete',    (_, id) => svc.deleteCustomer(id));
  guarded('customers:history',   (_, id) => svc.getCustomerHistory(id));

  // ── Sales ──
  guarded('sales:getAll',    (_, filters) => svc.getSales(filters));
  guarded('sales:getById',   (_, id) => svc.getSaleById(id));
  guarded('sales:create',    (_, data) => svc.createSale(data));
  guarded('sales:update',    (_, id, data) => svc.updateSale(id, data));
  guarded('sales:return',    (_, saleId, data) => svc.returnPhone(saleId, data));
  guarded('sales:getReturns', () => svc.getReturns());
  guarded('sales:invested',  () => svc.getInventoryInvested());

  // ── Cash Register ──
  guarded('register:open',      (_, data) => svc.openRegister(data));
  guarded('register:close',     (_, id, data) => svc.closeRegister(id, data));
  guarded('register:getCurrent',() => svc.getCurrentSession());
  guarded('register:getAll',    (_, f) => svc.getSessions(f));
  guarded('register:getById',   (_, id) => svc.getSessionById(id));
  guarded('register:getSales',  (_, id) => svc.getSessionSales(id));
  guarded('register:summary',   (_, id) => svc.getRegisterSummary(id));

  // ── Register PDF Export ──
  guarded('register:exportPdf', async (_, html, filename) => {
    const pdfWin = new BrowserWindow({
      show: false, width: 800, height: 1100,
      webPreferences: { offscreen: true },
    });
    await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const data = await pdfWin.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: 10, bottom: 10, left: 10, right: 10 } });
    pdfWin.close();
    const dest = path.join(INV_DIR, filename || `day-report-${Date.now()}.pdf`);
    fs.writeFileSync(dest, data);
    return { ok: true, path: dest };
  });

  // ── Invoice / PDF ──
  guarded('invoice:generate', async (_, saleId) => {
    const PdfService = require('./services/pdfService');
    const ps = new PdfService(svc, LOGO_PATH, INV_DIR);
    return ps.generate(saleId);
  });

  // ── WhatsApp ──
  guarded('whatsapp:share', (_, invoicePath, phone, msg) => {
    const encoded = encodeURIComponent(msg);
    shell.openExternal(`https://wa.me/${phone}?text=${encoded}`);
    shell.openPath(invoicePath);
    return { ok: true };
  });

  // ── Reports ──
  guarded('reports:sales',    (_, range) => svc.getSalesReport(range));
  guarded('reports:profit',   (_, range) => svc.getProfitReport(range));
  guarded('reports:purchase', (_, range) => svc.getPurchaseReport(range));
  guarded('reports:inventory',() => svc.getInventoryReport());
  guarded('reports:customer', (_, id) => svc.getCustomerReport(id));
  guarded('reports:exportPdf', async (_, type, range) => {
    const PdfService = require('./services/pdfService');
    const ps = new PdfService(svc, LOGO_PATH, INV_DIR);
    return ps.generateReport(type, range);
  });
  guarded('reports:exportExcel', async (_, type, range) => {
    const ExcelService = require('./services/excelService');
    const es = new ExcelService(svc);
    return es.export(type, range);
  });

  // ── Images ──
  guarded('images:save', async (_, b64, name) => {
    const buf = Buffer.from(b64, 'base64');
    const dest = path.join(IMG_DIR, name);
    fs.writeFileSync(dest, buf);
    return dest;
  });
  guarded('images:get', (_, p) => {
    if (!p || !fs.existsSync(p)) return null;
    return fs.readFileSync(p).toString('base64');
  });
  guarded('logo:save', async (_, b64) => {
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(LOGO_PATH, buf);
    return LOGO_PATH;
  });
  guarded('logo:get', () => {
    if (!fs.existsSync(LOGO_PATH)) return null;
    return fs.readFileSync(LOGO_PATH).toString('base64');
  });

  // ── File dialogs ──
  guarded('dialog:openFile', async (_, opts) => {
    const res = await dialog.showOpenDialog(mainWindow, opts);
    return res.canceled ? null : res.filePaths[0];
  });
  guarded('dialog:saveFile', async (_, opts) => {
    const res = await dialog.showSaveDialog(mainWindow, opts);
    return res.canceled ? null : res.filePath;
  });
  guarded('shell:openPath', (_, p) => shell.openPath(p));
  guarded('files:copy', (_, src, dest) => {
    if (!src || !dest) return { ok: false, error: 'Missing path' };
    if (!fs.existsSync(src)) return { ok: false, error: 'Source file not found' };
    fs.copyFileSync(src, dest);
    return { ok: true, path: dest };
  });

  // ── Backup ──
  guarded('backup:create',  async (_, dest) => bk.create(dest));
  guarded('backup:restore', async (_, src)  => bk.restore(src));
  guarded('backup:list',    () => bk.list());
  guarded('backup:settings:get',  () => svc.getBackupSettings());
  guarded('backup:settings:save', (_, s) => { svc.saveBackupSettings(s); schedulerService.restart(s); return { ok: true }; });
}
