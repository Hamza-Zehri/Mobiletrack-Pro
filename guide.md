# MobileTrack Pro — License & Installation Guide

This guide is for **you (the software owner)** and **your clients**. It explains when a license key is required, how you create keys, and how clients activate the software on their laptop.

---

## Quick Summary

| Who | What to do |
|-----|------------|
| **You (owner)** | Generate a license key on your development PC |
| **Client** | Install the `.exe`, enter the license key on first launch |
| **Rule** | **One license key = one laptop/computer** |

A license key is required **every time the software is installed on a new computer** that has never been activated before.

---

## When Is a License Key Required?

A license key is required in these situations:

1. **First install on a new laptop** — Client installs MobileTrack Pro for the first time.
2. **Reinstall on the same laptop** — Usually **not** required if activation file still exists (see below).
3. **Install on a different laptop** — **Always required.** Each computer needs its own key.
4. **Activation was removed** — If you (owner) removed activation from the hidden license page.

A license key is **NOT** required when:

- Client restarts the laptop or closes and reopens the app.
- You release a software update (same laptop, activation file remains).
- Client restores a shop backup (backup does not include the license file).

---

## Part 1 — For You (Software Owner): Create License Keys

You must run the key generator **on your development machine** (where the project source code is). **Never give the source code or generator to clients** — only give them the license key string.

### Prerequisites

- Node.js installed on your PC
- MobileTrack Pro project folder on your PC

### Step 1: Open terminal in the project folder

```powershell
cd "c:\Users\Engr. Hamza Asad\Downloads\mobiletrack-pro-source\mobiletrack-pro"
```

*(Use your actual project path.)*

### Step 2: Generate one license key

```powershell
npm run license:generate
```

**Example output:**

```
MobileTrack Pro — License Key Generator
──────────────────────────────────────────
MTP-CA63-W4BJ-DQ36-5LXB-4E83

Generated 1 key(s). Distribute one key per installation.
```

### Step 3: Generate multiple keys (optional)

If you are setting up several shops, generate multiple keys at once:

```powershell
node electron/tools/generateLicenseKey.js 5
```

This creates **5 unique keys**. Give **one key per client laptop**.

### Step 4: Save and send the key to the client

- Copy the full key, e.g. `MTP-CA63-W4BJ-DQ36-5LXB-4E83`
- Send it by WhatsApp, SMS, or email
- Keep a record (client name + key + date) in your own spreadsheet

**Key format:** `MTP-XXXX-XXXX-XXXX-XXXX` (5 groups)

> **Important:** Generate the key **before** or **when** the client is ready to install. You do not need the client’s Device ID to create a key.

---

## Part 2 — Build the Installer (.exe) for Clients

Clients install from the Windows installer, not from source code.

### Build the installer (on your PC)

```powershell
cd "c:\Users\Engr. Hamza Asad\Downloads\mobiletrack-pro-source\mobiletrack-pro"
npm run dist
```

When finished, the installer is here:

```
dist\MobileTrack Pro Setup 1.0.0.exe
```

Copy this file to a USB drive, Google Drive, or send it directly to the client.

---

## Part 3 — For Client: Install on Laptop

### What the client needs

1. Windows 10 or 11 (64-bit)
2. The installer: `MobileTrack Pro Setup 1.0.0.exe`
3. **One license key** from you (format `MTP-XXXX-XXXX-XXXX-XXXX`)

### Installation steps (client)

1. **Double-click** `MobileTrack Pro Setup 1.0.0.exe`
2. If Windows SmartScreen appears, click **More info** → **Run anyway** (if unsigned build)
3. Choose install location (default is fine) → **Install**
4. Finish setup → launch **MobileTrack Pro** from desktop or Start menu

### First launch — Activation screen

On first open, the client will **not** see the main shop dashboard. They will see:

**“Activate MobileTrack Pro”**

Steps for the client:

1. Enter the license key you provided (with or without dashes — both work)
2. Click **Activate Software**
3. If successful → Setup Wizard opens (shop name, password, etc.)
4. Complete setup → Login screen → enter password → **Dashboard**

```
Install .exe  →  Activation (license key)  →  Setup Wizard  →  Login  →  Dashboard
```

### Device ID (optional)

The activation screen shows a **Device ID**. The client does **not** need to send this to you for normal activation. It is only useful if:

- You need to verify which machine is activated
- Client reports “license not valid for this device”
- You are troubleshooting a support issue

Client can click **Copy** next to Device ID and send it to you on WhatsApp if needed.

---

## Part 4 — What Happens After Activation

### Where activation is stored

```
C:\Users\<ClientName>\AppData\Roaming\MobileShopSystem\activation.dat
```

- File is **encrypted** (not readable plain text)
- Tied to **that laptop’s hardware** (Device ID)
- **Survives** app restart and software updates
- **Does not move** with shop backup files

### Shop data (separate from license)

Database, invoices, images, backups:

```
C:\Users\<ClientName>\AppData\Roaming\MobileTrack Pro\
```

---

## Part 5 — Common Scenarios

### Same laptop — reinstall Windows or app

| Situation | Need new key? |
|-----------|----------------|
| Reinstall app, activation file still exists | Usually **No** |
| Reinstall Windows (fresh PC) | **Yes** — new activation |
| Deleted `MobileShopSystem` folder | **Yes** |

### New laptop for same shop

- **Yes — new license key required**
- Old laptop’s key cannot be copied to the new machine
- If client copies `activation.dat` to another PC, they will see:  
  **“License Not Valid for This Device”**

### Software update (you send new .exe)

1. Client installs new version over old one
2. Activation file remains → **no new key needed**
3. Client opens app → Login → continues as normal

### Backup restore

- Restoring shop backup restores inventory, sales, settings
- **License is not affected** — still activated

---

## Part 6 — Owner: View License Info on Client PC

When you visit a client’s shop and need to check activation (hidden page, not in menu):

**Option A:** Open **About** → click **Version 1.0.0** badge **5 times quickly**

**Option B:** Press **Ctrl + Shift + Alt + L**

You will see:

- Activation status
- Full license key (show/hide)
- Device ID
- Activation date
- Activation file path

You can also **Remove Activation** from this page if you need to re-license the machine.

---

## Part 7 — Troubleshooting

### “Invalid license key”

- Check key was typed correctly (all characters, no extra spaces)
- Confirm you sent the correct key for this client
- Generate a new key if the old one was mistyped or lost

### “License not valid for this device”

- Activation file was copied from another computer
- **Fix:** Generate a **new key** for this laptop and activate again
- Or remove old activation (owner page) and enter a new key

### Activation screen every time (not staying activated)

- Check folder exists: `%AppData%\Roaming\MobileShopSystem`
- Client may lack write permission — run app as normal user (not blocked folder)
- Antivirus may block `activation.dat` — add exception for MobileTrack Pro

### Client skipped activation somehow

- Main process blocks all shop features until licensed
- They must activate before using inventory, sales, etc.

---

## Part 8 — Workflow Checklist

### Your workflow (per new client)

- [ ] Generate 1 license key (`npm run license:generate`)
- [ ] Build installer if needed (`npm run dist`)
- [ ] Send client: installer + license key
- [ ] Client installs and activates
- [ ] Client completes Setup Wizard (shop name, password)
- [ ] Save client record: name, key used, date, Device ID (optional)

### Client workflow

- [ ] Install `MobileTrack Pro Setup 1.0.0.exe`
- [ ] Open app → enter license key → Activate
- [ ] Complete Setup Wizard
- [ ] Login and start using the shop system

---

## Important Rules

1. **One key per computer** — do not reuse the same key on multiple laptops.
2. **Keep keys private** — only share with the paying client.
3. **Do not share** the key generator or source code with clients.
4. **Keep your own log** of which key went to which shop.
5. License survives **updates and restarts** but not **hardware/OS change** without a new key.

---

## Commands Reference

| Task | Command |
|------|---------|
| Generate 1 key | `npm run license:generate` |
| Generate 5 keys | `node electron/tools/generateLicenseKey.js 5` |
| Build Windows installer | `npm run dist` |
| Run app in development | `npm run dev` |

---

## Support Contact

**Developer:** Engr. Hamza Asad  
**Software:** MobileTrack Pro v1.0.0

For license issues, clients should contact you with:

- Their shop name
- Screenshot of the error
- Device ID (from activation or error screen)
