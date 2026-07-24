# MobileTrack Pro
### Mobile Shop Inventory & Sales Management System
**Version 1.0 · Developed by Engr. Hamza Asad**

---

## Overview

MobileTrack Pro is a complete offline-first desktop application for used mobile phone shops. Built with Electron, React, TypeScript, and SQLite — it runs fully offline and works on Windows.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Desktop      | Electron 29                         |
| Frontend     | React 18 + TypeScript               |
| Database     | SQLite via better-sqlite3           |
| PDF          | jsPDF + jsPDF-AutoTable + printToPDF |
| Excel        | SheetJS (xlsx)                      |
| Charts       | Recharts                            |
| Backup       | archiver + unzipper + AES-256-CBC   |
| Scheduler    | node-cron                           |
| QR Codes     | qrcode                              |

---

## Project Structure

```
mobiletrack-pro/
├── electron/
│   ├── main.js                 # Electron main process + IPC handlers
│   ├── preload.js              # Secure context bridge (window.api)
│   ├── database.js             # SQLite DB init + schema + migrations
│   ├── tools/
│   │   └── generateLicenseKey.js  # Vendor tool — generate license keys
│   └── services/
│       ├── dbService.js        # All CRUD operations
│       ├── pdfService.js       # Invoice + Report PDF generation
│       ├── excelService.js     # Excel export
│       ├── backupService.js    # Encrypted backup/restore
│       ├── schedulerService.js # Auto-backup cron scheduler
│       ├── licenseService.js   # License validation, trial, activation
│       └── cryptoService.js    # Field-level encryption
│
├── src/
│   ├── App.tsx                 # Router + auth/license guard
│   ├── context/AppContext.tsx  # Global state (auth, settings, theme, license)
│   ├── types/index.ts          # All TypeScript types + window.api typing
│   ├── utils/index.ts          # Helpers (money, formatDate, etc.)
│   ├── styles/global.css       # Design system (dark/light CSS vars)
│   │
│   ├── components/
│   │   ├── layout/Layout.tsx   # Sidebar + Topbar + Start/End Day + Window controls
│   │   └── ui/
│   │       ├── Toast.tsx       # Toast, Modal, Badge, Confirm, Spinner
│   │       └── SupportContact.tsx  # Developer contact component
│   │
│   └── pages/
│       ├── Welcome.tsx         # First launch: Enter key or Start trial
│       ├── Activation.tsx      # License key entry (expired trial)
│       ├── DeviceMismatch.tsx  # Device mismatch + re-activation
│       ├── SetupWizard.tsx     # First-run 4-step setup
│       ├── Login.tsx           # Authentication
│       ├── Dashboard.tsx       # Stats + Charts + Activity feed
│       ├── Inventory.tsx       # Phone list with filters
│       ├── AddPhone.tsx        # Add/Edit phone form + CNIC upload
│       ├── Purchase.tsx        # Purchase history + type selection
│       ├── BulkPurchase.tsx    # Spreadsheet-style bulk entry
│       ├── Sales.tsx           # New sale + history + edit/return
│       ├── InvoicePage.tsx     # PDF invoice preview + share
│       ├── Customers.tsx       # Customer management
│       ├── CustomerDetail.tsx  # Profile + transaction timeline
│       ├── PhoneHistory.tsx    # Lifetime IMEI history search
│       ├── CashRegister.tsx    # Start Day / End Day + session history
│       ├── RegisterDetail.tsx  # Day report with Print + Save PDF
│       ├── Reports.tsx         # Reports with PDF/Excel export
│       ├── Backup.tsx          # Backup & restore
│       ├── Settings.tsx        # Shop/Invoice/WhatsApp/Security
│       └── About.tsx           # About + License Status card
│
├── public/index.html
├── package.json
├── tsconfig.json
└── .env
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Windows 10/11 (for production build)

### 1. Install Dependencies
```bash
cd mobiletrack-pro
npm install
```

> **Note:** `better-sqlite3` requires native compilation. On Windows, install Visual Studio Build Tools:
> ```
> npm install --global windows-build-tools
> ```
> Or install "Desktop development with C++" from Visual Studio Installer.

### 2. Development Mode
```bash
npm run dev
```
This starts React on port 3000 and launches Electron pointing to it.

### 3. Production Build (Windows)
```bash
npm run build
```
This will:
1. Build React app into `build/`
2. Package everything with electron-builder
3. Output an NSIS installer to `dist/`

---

## Licensing & Trial System

### Flow
1. **First Launch** — Welcome page appears with two options:
   - **"I have a license key"** → Enter activation key → permanently activated
   - **"Start 7-day trial"** → Full access for 7 days, no restrictions
2. **During Trial** — App works normally, license status shown in About page
3. **After Trial Expires** — Stuck on Activation page, must enter valid key

### Key Features
- Simple plain-text license key comparison (`MTP-XXXX-XXXX-XXXX-XXXX`)
- No device binding — works on any machine with the same key
- Trial start date stored in `%APPDATA%/MobileShopSystem/install_date.dat`
- License status visible in **About** page with key and activation date

### Generating License Keys (Vendor Tool)
```bash
node electron/tools/generateLicenseKey.js        # Generate 1 key
node electron/tools/generateLicenseKey.js 5      # Generate 5 keys
```

Key format: `MTP-XXXX-XXXX-XXXX-XXXX` (20 chars + MTP prefix)

### Configuration
- `TRIAL_DAYS = 7` in `electron/services/licenseService.js` — change to adjust trial length
- Activation data stored at: `%APPDATA%\MobileShopSystem\`

---

## First Run

1. Launch the app
2. **Welcome page** appears:
   - Choose **"I have a license key"** to activate permanently
   - Or **"Start 7-day free trial"** to try the software
3. **Setup Wizard** appears (after activation/trial):
   - Step 1: Enter shop info + set password
   - Step 2: Upload logo (optional)
   - Step 3: Set Urdu warranty terms
   - Step 4: Launch
4. Login with `admin` + your chosen password

---

## Key Features

### Inventory
- Add phones with full specs (brand, model, IMEI, PTA status, battery, accessories)
- IMEI duplicate detection
- Multi-image upload per phone (phone photos + seller CNIC)
- Filter by PTA/JV/CPID/Non-PTA/Android/Available/Sold

### Purchase
- **Customer trade-in:** Single phone from customer with their details
- **Bulk purchase:** Spreadsheet-style entry for 50+ phones from market

### Sales
- Real-time phone search (by model/IMEI)
- Auto profit calculation
- One-click: complete sale + generate PDF invoice
- **Edit sales** — modify price/discount after sale
- **Return phones** — mark sale as returned, phone goes back to available stock

### Invoices (PDF)
- Branded with shop logo and colors
- Full device details + IMEI
- Urdu warranty terms
- QR code for verification
- Signature fields
- WhatsApp sharing (opens wa.me link + PDF)

### Cash Register (Start Day / End Day)
- **Topbar shortcut** — Start Day / End Day button always visible in the topbar
- **Start Day** — click to begin tracking all sales for the day
- **End Day** — click to close the day and view the full report
- **Day Report** — shows all sales, returns, totals, and profit
- **Print** — opens system print dialog (includes Save as PDF option)
- **Save PDF** — saves the day report as a PDF file to the invoices folder
- **Sidebar indicator** — green dot shows when a day is active
- **Session history** — browse all past days with their reports

### Reports
- Sales, Profit, Purchase, Inventory reports
- Date range filters (daily/weekly/monthly/yearly)
- Export to PDF or Excel

### Phone Returns
- Return any sold phone with reason and refund amount
- Phone status reverts to available
- Returns excluded from all sales reports and profit calculations

### Customer Management
- Full customer profiles with CNIC and address
- Transaction history (sales + purchases)
- Safe delete — prevents deletion if transactions exist

### Backup
- Encrypted `.shopbackup` files (AES-256-CBC)
- Includes: database, images, invoices, logo, settings
- Auto-backup scheduler (daily/every6h/weekly)
- One-click restore

### Responsive Design
- All auth screens (Welcome, Activation, DeviceMismatch) are fully responsive
- Adapts to mobile, tablet, and desktop screen sizes

---

## Database Schema

| Table             | Purpose                                |
|-------------------|----------------------------------------|
| `settings`        | Key-value store for all config         |
| `customers`       | Customer profiles                      |
| `suppliers`       | Wholesale suppliers                    |
| `purchases`       | Purchase header records                |
| `phones`          | Inventory (available + sold)           |
| `phone_images`    | Phone photos + seller CNIC images      |
| `sales`           | Sale records with invoice links        |
| `phone_returns`   | Phone return records                   |
| `cash_register`   | Daily session tracking (Start/End Day) |
| `register_sales`  | Links sales to register sessions       |
| `backup_settings` | Auto-backup configuration              |

---

## Security

- Passwords hashed with bcrypt (10 rounds)
- Backup files encrypted with AES-256-CBC
- Field-level encryption for customer/supplier names, IMEIs
- SQLite WAL mode for data integrity
- Electron `contextIsolation: true` + `nodeIntegration: false`
- All IPC via secure preload context bridge

---

## WhatsApp Integration

After generating an invoice:
1. Click **Share on WhatsApp**
2. App opens `https://wa.me/{phone}?text={message}` in browser
3. PDF file is opened so you can attach it manually in WhatsApp Web

> Direct file attachment via wa.me is not supported by WhatsApp API. The PDF opens separately for manual attachment.

---

## Customization

All Urdu terms, shop details, invoice footer, and WhatsApp messages are editable from **Settings** at any time.

---

## License

© 2026 Engr. Hamza Asad · All Rights Reserved
