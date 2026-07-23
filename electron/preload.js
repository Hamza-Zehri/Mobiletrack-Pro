'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (ch, ...args) => ipcRenderer.invoke(ch, ...args);
const send   = (ch, ...args) => ipcRenderer.send(ch, ...args);

contextBridge.exposeInMainWorld('api', {
  // Window
  window: {
    minimize: () => send('window:minimize'),
    maximize: () => send('window:maximize'),
    close:    () => send('window:close'),
  },
  // App
  app: {
    paths: () => invoke('app:paths'),
  },
  // License
  license: {
    getStatus:    () => invoke('license:getStatus'),
    activate:     (key) => invoke('license:activate', key),
    startTrial:   () => invoke('license:startTrial'),
    getOwnerInfo: () => invoke('license:getOwnerInfo'),
    deactivate:   () => invoke('license:deactivate'),
    getPaths:     () => invoke('license:getPaths'),
  },
  // Setup
  setup: {
    isFirstRun: () => invoke('setup:isFirstRun'),
    complete:   (d) => invoke('setup:complete', d),
  },
  // Settings
  settings: {
    get:  ()  => invoke('settings:get'),
    save: (d) => invoke('settings:save', d),
  },
  // Auth
  auth: {
    login:          (u, p)    => invoke('auth:login', u, p),
    changePassword: (old, nw) => invoke('auth:changePassword', old, nw),
  },
  // Dashboard
  dashboard: {
    stats:    () => invoke('dashboard:stats'),
    charts:   () => invoke('dashboard:charts'),
    activity: () => invoke('dashboard:activity'),
  },
  // Phones
  phones: {
    getAll:    (f)       => invoke('phones:getAll', f),
    getById:   (id)      => invoke('phones:getById', id),
    add:       (d)       => invoke('phones:add', d),
    update:    (id, d)   => invoke('phones:update', id, d),
    delete:    (id)      => invoke('phones:delete', id),
    history:   (q)       => invoke('phones:history', q),
    checkImei: (im, ex)  => invoke('phones:checkImei', im, ex),
    getImages: (id)      => invoke('phones:getImages', id),
  },
  // Purchases
  purchases: {
    getAll:  (f) => invoke('purchases:getAll', f),
    getById: (id) => invoke('purchases:getById', id),
    add:     (d) => invoke('purchases:add', d),
    addBulk: (d) => invoke('purchases:addBulk', d),
  },
  // Customers
  customers: {
    getAll:  (q)     => invoke('customers:getAll', q),
    getById: (id)    => invoke('customers:getById', id),
    add:     (d)     => invoke('customers:add', d),
    update:  (id, d) => invoke('customers:update', id, d),
    delete:  (id)    => invoke('customers:delete', id),
    history: (id)    => invoke('customers:history', id),
  },
  // Sales
  sales: {
    getAll:     (f)  => invoke('sales:getAll', f),
    getById:    (id) => invoke('sales:getById', id),
    create:     (d)  => invoke('sales:create', d),
    update:     (id, d) => invoke('sales:update', id, d),
    returnSale: (saleId, d) => invoke('sales:return', saleId, d),
    getReturns: ()   => invoke('sales:getReturns'),
    invested:   ()   => invoke('sales:invested'),
  },
  // Invoice
  invoice: {
    generate: (id) => invoke('invoice:generate', id),
  },
  // WhatsApp
  whatsapp: {
    share: (path, phone, msg) => invoke('whatsapp:share', path, phone, msg),
  },
  // Reports
  reports: {
    sales:       (r) => invoke('reports:sales', r),
    profit:      (r) => invoke('reports:profit', r),
    purchase:    (r) => invoke('reports:purchase', r),
    inventory:   ()  => invoke('reports:inventory'),
    customer:    (id) => invoke('reports:customer', id),
    exportPdf:   (t, r) => invoke('reports:exportPdf', t, r),
    exportExcel: (t, r) => invoke('reports:exportExcel', t, r),
  },
  // Images
  images: {
    save: (b64, name) => invoke('images:save', b64, name),
    get:  (p)         => invoke('images:get', p),
  },
  // Logo
  logo: {
    save: (b64) => invoke('logo:save', b64),
    get:  ()    => invoke('logo:get'),
  },
  // Dialog
  dialog: {
    openFile: (opts) => invoke('dialog:openFile', opts),
    saveFile: (opts) => invoke('dialog:saveFile', opts),
  },
  shell: {
    openPath: (p) => invoke('shell:openPath', p),
  },
  files: {
    copy: (src, dest) => invoke('files:copy', src, dest),
  },
  // Backup
  backup: {
    create:  (dest) => invoke('backup:create', dest),
    restore: (src)  => invoke('backup:restore', src),
    list:    ()     => invoke('backup:list'),
    settings: {
      get:  ()  => invoke('backup:settings:get'),
      save: (s) => invoke('backup:settings:save', s),
    },
  },
});
