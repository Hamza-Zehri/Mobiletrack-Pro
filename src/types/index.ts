// ─── Core Types ──────────────────────────────────────────────────────────────

export type PtaStatus = 'pta' | 'non_pta' | 'jv' | 'cpid' | 'unlocked';
export type PhoneStatus = 'available' | 'sold' | 'reserved';
export type PurchaseType = 'customer' | 'bulk';

export interface ShopSettings {
  name: string;
  ownerName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  invoiceTerms?: string;
}

export interface Settings {
  shop: ShopSettings;
  invoiceTerms: string;
  whatsappTemplate: string;
  invoiceFooter: string;
}

// ─── Phone ───────────────────────────────────────────────────────────────────
export interface Phone {
  id: number;
  brand: string;
  model: string;
  color: string;
  storage: string;
  pta_status: PtaStatus;
  battery_health: string;
  face_id: string;
  true_tone: string;
  sim_lock: string;
  imei1: string;
  imei2?: string;
  box: boolean;
  charger: boolean;
  cable: boolean;
  earphones: boolean;
  cost_price: number;
  sale_price?: number;
  status: PhoneStatus;
  purchase_id?: number;
  notes?: string;
  created_at: string;
  // joined
  source_name?: string;
  invoice_number?: string;
  sale_amount?: number;
  images?: PhoneImage[];
}

export interface PhoneImage {
  id: number;
  phone_id: number;
  path: string;
}

export interface PhoneFormData {
  brand: string;
  model: string;
  color: string;
  storage: string;
  pta_status: PtaStatus;
  battery_health: string;
  face_id: string;
  true_tone: string;
  sim_lock: string;
  imei1: string;
  imei2?: string;
  box: boolean;
  charger: boolean;
  cable: boolean;
  earphones: boolean;
  cost_price: number;
  sale_price?: number;
  notes?: string;
  images?: string[];
  // purchase source
  purchase_type?: PurchaseType;
  customer_name?: string;
  customer_mobile?: string;
  customer_cnic?: string;
  supplier_name?: string;
  supplier_mobile?: string;
  market_name?: string;
  purchase_date?: string;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  cnic?: string;
  address?: string;
  notes?: string;
  created_at: string;
  sold_to?: number;
  bought_from?: number;
}

// ─── Purchase ────────────────────────────────────────────────────────────────
export interface Purchase {
  id: number;
  type: PurchaseType;
  supplier_id?: number;
  customer_id?: number;
  market_name?: string;
  purchase_date: string;
  notes?: string;
  total_cost: number;
  created_at: string;
  source_name?: string;
  phone_count?: number;
  phones?: Phone[];
}

export interface BulkPhoneRow {
  model: string;
  brand: string;
  storage: string;
  color: string;
  pta_status: PtaStatus;
  imei1: string;
  imei2?: string;
  battery_health: string;
  cost_price: number;
  sale_price?: number;
  face_id?: string;
  true_tone?: string;
  box?: boolean;
  charger?: boolean;
}

export interface BulkPurchaseFormData {
  supplier_name: string;
  supplier_mobile: string;
  market_name: string;
  purchase_date: string;
  notes?: string;
  phones: BulkPhoneRow[];
}

// ─── Sale ────────────────────────────────────────────────────────────────────
export interface Sale {
  id: number;
  invoice_number: string;
  phone_id: number;
  customer_id: number;
  sale_price: number;
  discount: number;
  final_amount: number;
  cost_price: number;
  profit: number;
  invoice_path?: string;
  sale_date: string;
  notes?: string;
  // joined
  model?: string;
  brand?: string;
  storage?: string;
  pta_status?: PtaStatus;
  imei1?: string;
  color?: string;
  battery_health?: string;
  face_id?: string;
  true_tone?: string;
  sim_lock?: string;
  imei2?: string;
  customer?: string;
  customer_mobile?: string;
  customer_cnic?: string;
  customer_address?: string;
}

export interface SaleFormData {
  phone_id: number;
  customer_id?: number;
  customer_name: string;
  customer_mobile: string;
  customer_cnic?: string;
  customer_address?: string;
  sale_price: number;
  discount: number;
  notes?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalStock: number;
  totalStockValue: number;
  totalSold: number;
  monthlySales: number;
  monthlyProfit: number;
  totalCustomers: number;
  byPta: { pta: number; non_pta: number; jv: number; cpid: number; android: number };
}

export interface ChartRow {
  mo: string;
  sales: number;
  profit: number;
}

export interface RecentActivity {
  purchases: any[];
  sales: any[];
}

// ─── License ─────────────────────────────────────────────────────────────────
export type LicenseStatusType = 'not_activated' | 'active' | 'device_mismatch' | 'corrupt';

export interface LicenseStatus {
  status: LicenseStatusType;
  activated: boolean;
  deviceMismatch: boolean;
  message?: string;
  deviceId: string;
  licenseKey?: string;
  licenseKeyFull?: string;
  activatedAt?: string;
  appVersion?: string;
  activationPath?: string;
}

export interface LicenseOwnerInfo extends LicenseStatus {
  licenseKeyMasked?: string | null;
  activationFile?: string;
  activationDir?: string;
}

export interface LicenseActivateResult {
  ok: boolean;
  error?: string;
  deviceId?: string;
  licenseKey?: string;
  activatedAt?: string;
}

// ─── Backup ──────────────────────────────────────────────────────────────────
export interface BackupFile {
  filename: string;
  path: string;
  size: number;
  mtime: string;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'every6h' | 'weekly' | 'manual';
  time: string;
  backup_folder?: string;
  last_backup_at?: string;
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface PhoneFilters {
  status?: PhoneStatus | 'all';
  pta_status?: PtaStatus | '';
  brand?: string;
  search?: string;
}

export interface DateRange {
  from: string;
  to: string;
}

// ─── API Bridge ──────────────────────────────────────────────────────────────
declare global {
  interface Window {
    api: {
      window:     { minimize(): void; maximize(): void; close(): void };
      app:        { paths(): Promise<{ userData: string; appData?: string; images: string; invoices: string; logo: string; backups: string; activationDir?: string; activationFile?: string }> };
      license:    {
        getStatus(): Promise<LicenseStatus>;
        getDeviceId(): Promise<string>;
        activate(key: string): Promise<LicenseActivateResult>;
        getOwnerInfo(): Promise<LicenseOwnerInfo>;
        deactivate(): Promise<{ ok: boolean; error?: string }>;
        getPaths(): Promise<{ activationDir: string; activationFile: string }>;
      };
      setup:      { isFirstRun(): Promise<boolean>; complete(d: any): Promise<any> };
      settings:   { get(): Promise<Settings>; save(d: any): Promise<any> };
      auth:       { login(u: string, p: string): Promise<{ ok: boolean; error?: string }>; changePassword(o: string, n: string): Promise<any> };
      dashboard:  { stats(): Promise<DashboardStats>; charts(): Promise<ChartRow[]>; activity(): Promise<RecentActivity> };
      phones:     { getAll(f?: PhoneFilters): Promise<Phone[]>; getById(id: number): Promise<Phone>; add(d: any): Promise<any>; update(id: number, d: any): Promise<any>; delete(id: number): Promise<any>; history(q: string): Promise<Phone[]>; checkImei(im: string, ex?: number): Promise<boolean> };
      purchases:  { getAll(f?: any): Promise<Purchase[]>; getById(id: number): Promise<Purchase>; add(d: any): Promise<any>; addBulk(d: any): Promise<any> };
      customers:  { getAll(q?: string): Promise<Customer[]>; getById(id: number): Promise<Customer>; add(d: any): Promise<any>; update(id: number, d: any): Promise<any>; delete(id: number): Promise<any>; history(id: number): Promise<any> };
      sales:      { getAll(f?: any): Promise<Sale[]>; getById(id: number): Promise<Sale>; create(d: SaleFormData): Promise<any> };
      invoice:    { generate(id: number): Promise<{ ok: boolean; path: string; invoice_number: string }> };
      whatsapp:   { share(path: string, phone: string, msg: string): Promise<any> };
      reports:    { sales(r: DateRange): Promise<any>; profit(r: DateRange): Promise<any>; purchase(r: DateRange): Promise<any>; inventory(): Promise<any>; customer(id: number): Promise<any>; exportPdf(t: string, r: DateRange): Promise<any>; exportExcel(t: string, r: DateRange): Promise<any> };
      images:     { save(b64: string, name: string): Promise<string>; get(p: string): Promise<string | null> };
      logo:       { save(b64: string): Promise<string>; get(): Promise<string | null> };
      dialog:     { openFile(o: any): Promise<string | null>; saveFile(o: any): Promise<string | null> };
      shell:      { openPath(p: string): Promise<any> };
      files:      { copy(src: string, dest: string): Promise<{ ok: boolean; path?: string; error?: string }> };
      backup:     { create(dest?: string): Promise<any>; restore(src: string): Promise<any>; list(): Promise<BackupFile[]>; settings: { get(): Promise<BackupSettings>; save(s: any): Promise<any> } };
    };
  }
}
