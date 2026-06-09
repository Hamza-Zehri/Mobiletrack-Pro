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
| PDF          | jsPDF + jsPDF-AutoTable             |
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
│   ├── database.js             # SQLite DB init + schema
│   └── services/
│       ├── dbService.js        # All CRUD operations
│       ├── pdfService.js       # Invoice + Report PDF generation
│       ├── excelService.js     # Excel export
│       ├── backupService.js    # Encrypted backup/restore
│       └── schedulerService.js # Auto-backup cron scheduler
│
├── src/
│   ├── App.tsx                 # Router + auth guard
│   ├── context/AppContext.tsx  # Global state (auth, settings, theme)
│   ├── types/index.ts          # All TypeScript types + window.api typing
│   ├── utils/index.ts          # Helpers (money, formatDate, etc.)
│   ├── styles/global.css       # Design system (dark/light CSS vars)
│   │
│   ├── components/
│   │   ├── layout/Layout.tsx   # Sidebar + Topbar + Window controls
│   │   └── ui/Toast.tsx        # Toast, Modal, Badge, Confirm, Spinner
│   │
│   └── pages/
│       ├── SetupWizard.tsx     # First-run 4-step setup
│       ├── Login.tsx           # Authentication
│       ├── Dashboard.tsx       # Stats + Charts + Activity feed
│       ├── Inventory.tsx       # Phone list with filters
│       ├── AddPhone.tsx        # Add/Edit phone form
│       ├── Purchase.tsx        # Purchase history + type selection
│       ├── BulkPurchase.tsx    # Spreadsheet-style bulk entry
│       ├── Sales.tsx           # New sale + history
│       ├── InvoicePage.tsx     # PDF invoice preview + share
│       ├── Customers.tsx       # Customer management
│       ├── CustomerDetail.tsx  # Profile + transaction timeline
│       ├── PhoneHistory.tsx    # Lifetime IMEI history search
│       ├── Reports.tsx         # Reports with PDF/Excel export
│       ├── Backup.tsx          # Backup & restore
│       ├── Settings.tsx        # Shop/Invoice/WhatsApp/Security
│       └── About.tsx           # About page
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

## First Run

1. Launch the app
2. **Setup Wizard** appears:
   - Step 1: Enter shop info + set password
   - Step 2: Upload logo (optional)
   - Step 3: Set Urdu warranty terms
   - Step 4: Launch
3. Login with `admin` + your chosen password

---

## Key Features

### Inventory
- Add phones with full specs (brand, model, IMEI, PTA status, battery, accessories)
- IMEI duplicate detection
- Multi-image upload per phone
- Filter by PTA/JV/CPID/Non-PTA/Android/Available/Sold

### Purchase
- **Customer trade-in:** Single phone from customer with their details
- **Bulk purchase:** Spreadsheet-style entry for 50+ phones from market

### Sales
- Real-time phone search (by model/IMEI)
- Auto profit calculation
- One-click: complete sale + generate PDF invoice

### Invoices (PDF)
- Branded with shop logo and colors
- Full device details + IMEI
- Urdu warranty terms
- QR code for verification
- Signature fields
- WhatsApp sharing (opens wa.me link + PDF)

### Reports
- Sales, Profit, Purchase, Inventory reports
- Date range filters (daily/weekly/monthly/yearly)
- Export to PDF or Excel

### Backup
- Encrypted `.shopbackup` files (AES-256-CBC)
- Includes: database, images, invoices, logo, settings
- Auto-backup scheduler (daily/every6h/weekly)
- One-click restore

---

## Database Schema

| Table           | Purpose                          |
|-----------------|----------------------------------|
| `settings`      | Key-value store for all config   |
| `customers`     | Customer profiles                |
| `suppliers`     | Wholesale suppliers              |
| `purchases`     | Purchase header records          |
| `phones`        | Inventory (available + sold)     |
| `phone_images`  | Image paths per phone            |
| `sales`         | Sale records with invoice links  |
| `backup_settings` | Auto-backup configuration      |

---

## Security

- Passwords hashed with bcrypt (10 rounds)
- Backup files encrypted with AES-256-CBC
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
