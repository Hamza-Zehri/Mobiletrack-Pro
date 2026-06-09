'use strict';
const path  = require('path');
const fs    = require('fs');
const { BrowserWindow } = require('electron');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const QRCode = require('qrcode');

class PdfService {
  constructor(dbService, logoPath, invoiceDir) {
    this.svc     = dbService;
    this.logoPath = logoPath;
    this.outDir  = invoiceDir;
  }

  async generate(saleId) {
    const sale = this.svc.getSaleById(saleId);
    if (!sale) throw new Error('Sale not found');
    const settings = this.svc.getSettings();
    const shop = settings.shop || {};

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ── Colors
    const purple = [108, 99, 255];
    const gray   = [100, 100, 100];
    const dark   = [30, 30, 30];
    const light  = [248, 247, 255];

    // ── Header bg
    doc.setFillColor(...purple);
    doc.rect(0, 0, W, 42, 'F');

    // ── Logo
    if (fs.existsSync(this.logoPath)) {
      try {
        const logoData = fs.readFileSync(this.logoPath).toString('base64');
        const ext = path.extname(this.logoPath).slice(1).toUpperCase() || 'PNG';
        doc.addImage(`data:image/${ext.toLowerCase()};base64,${logoData}`, ext, 10, 8, 26, 26);
      } catch(e) { /* skip */ }
    }

    // ── Shop name & info
    doc.setTextColor(255,255,255);
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.text(shop.name || 'Mobile Shop', 42, 18);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(shop.address || '', 42, 25);
    doc.text(`Tel: ${shop.mobile || ''} | WhatsApp: ${shop.whatsapp || ''}`, 42, 31);

    // ── Invoice number box
    doc.setFillColor(255,255,255);
    doc.roundedRect(W-62, 8, 54, 26, 3, 3, 'F');
    doc.setTextColor(...purple);
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('INVOICE', W-35, 16, {align:'center'});
    doc.setFontSize(14);
    doc.text(sale.invoice_number, W-35, 24, {align:'center'});
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
    doc.text(new Date(sale.sale_date).toLocaleDateString('en-PK'), W-35, 30, {align:'center'});

    // ── Customer + Device info boxes
    const boxY = 50;
    const boxH = 36;

    // Customer box
    doc.setFillColor(...light);
    doc.roundedRect(10, boxY, (W-26)/2, boxH, 2, 2, 'F');
    doc.setTextColor(...purple);
    doc.setFontSize(7); doc.setFont('helvetica','bold');
    doc.text('CUSTOMER DETAILS', 14, boxY+7);
    doc.setTextColor(...dark); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text(sale.customer || '', 14, boxY+15);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
    doc.text(sale.customer_mobile || '', 14, boxY+22);
    if (sale.customer_cnic) doc.text(`CNIC: ${sale.customer_cnic}`, 14, boxY+29);
    if (sale.customer_address) doc.text(sale.customer_address, 14, boxY+35);

    // Device box
    const dx = 16 + (W-26)/2;
    doc.setFillColor(...light);
    doc.roundedRect(dx, boxY, (W-26)/2, boxH, 2, 2, 'F');
    doc.setTextColor(...purple);
    doc.setFontSize(7); doc.setFont('helvetica','bold');
    doc.text('DEVICE DETAILS', dx+4, boxY+7);
    doc.setTextColor(...dark); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text(`${sale.brand} ${sale.model}`, dx+4, boxY+15);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
    doc.text(`${sale.storage || ''} · ${sale.color || ''} · ${this._ptaLabel(sale.pta_status)}`, dx+4, boxY+22);
    doc.text(`Battery: ${sale.battery_health || 'N/A'}`, dx+4, boxY+29);
    doc.text(`Face ID: ${sale.face_id || 'N/A'}`, dx+4, boxY+35);

    // ── IMEI Table
    doc.autoTable({
      startY: boxY + boxH + 6,
      head: [['Field', 'Detail']],
      body: [
        ['IMEI 1', sale.imei1 || ''],
        ['IMEI 2', sale.imei2 || 'N/A'],
        ['PTA Status', this._ptaLabel(sale.pta_status)],
        ['True Tone', sale.true_tone || 'N/A'],
        ['SIM Lock', sale.sim_lock || 'N/A'],
      ],
      ...this._tableOpts({ headFill: purple, bodySize: 9, headSize: 9 }),
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 10, right: 10 },
      theme: 'grid',
    });

    // ── Financial Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Description', 'Amount (PKR)']],
      body: [
        ['Sale Price', this._money(sale.sale_price)],
        ['Discount',   sale.discount > 0 ? `-${this._money(sale.discount)}` : this._money(0)],
        ['TOTAL AMOUNT', this._money(sale.final_amount)],
      ],
      ...this._tableOpts({ headFill: purple, bodySize: 9, headSize: 9 }),
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 10, right: 10 },
      theme: 'grid',
      willDrawCell: (data) => {
        if (data.row.index === 2 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = light;
          data.cell.styles.textColor = purple;
          data.cell.styles.fontSize  = 11;
        }
      }
    });

    // ── Warranty / Terms  (compact, height-capped)
    const terms = this.svc.getSettings().invoiceTerms;
    let termsBottomY = doc.lastAutoTable.finalY;
    if (terms) {
      const tY      = doc.lastAutoTable.finalY + 4;
      const boxW    = W - 20;
      // Reserve 48 mm at bottom for: signatures (14) + QR (22) + footer (14) + gaps
      const maxBoxH = H - tY - 48;
      const termsImg = await this._renderRtlTextImage(terms, boxW - 20);
      const tBoxH   = Math.min(termsImg.heightMm + 8, maxBoxH);  // capped
      const imgH    = Math.min(termsImg.heightMm, tBoxH - 8);    // clip image if needed
      doc.setFillColor(...light);
      doc.setDrawColor(...purple);
      doc.roundedRect(10, tY, boxW, tBoxH, 1.5, 1.5, 'FD');
      doc.setTextColor(...purple);
      doc.setFontSize(6); doc.setFont('helvetica', 'bold');
      doc.text('WARRANTY / TERMS', 13, tY + 4.5);
      doc.addImage(
        `data:image/png;base64,${termsImg.data}`,
        'PNG',
        13, tY + 6,
        boxW - 20, imgH
      );
      termsBottomY = tY + tBoxH;
    }

    // ── Signature lines
    const sigY = termsBottomY + 9;
    doc.setDrawColor(180, 180, 180);
    doc.line(14, sigY, 80, sigY);
    doc.line(W - 80, sigY, W - 14, sigY);
    doc.setTextColor(...gray); doc.setFontSize(7);
    doc.text('Customer Signature', 47,    sigY + 4, { align: 'center' });
    doc.text('Shop Signature',     W - 47, sigY + 4, { align: 'center' });

    // ── QR Code  (centred between signatures and footer)
    const footerH   = 14;
    const footerY   = H - footerH;
    const qrBlockY  = sigY + 9;                           // just below signature labels
    const availH    = footerY - 3 - qrBlockY;
    const qrSize    = Math.min(20, availH);               // fill available space, max 20 mm
    const qrX       = (W - qrSize) / 2;

    try {
      const qrData   = JSON.stringify({ inv: sale.invoice_number, imei: sale.imei1, date: sale.sale_date });
      const qrBase64 = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });
      // white bg tile (1 mm bleed)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...purple);
      doc.roundedRect(qrX - 1, qrBlockY - 1, qrSize + 2, qrSize + 2, 1, 1, 'FD');
      doc.addImage(qrBase64, 'PNG', qrX, qrBlockY, qrSize, qrSize);
      doc.setFontSize(6); doc.setTextColor(...gray);
      doc.text('Scan for verification', W / 2, qrBlockY + qrSize + 3.5, { align: 'center' });
    } catch(e) { /* skip */ }

    // ── Footer bar  (purple strip pinned to page bottom)
    doc.setFillColor(...purple);
    doc.rect(0, footerY, W, footerH, 'F');
    const footer = settings.invoiceFooter || 'Thank you for your purchase!';
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(footer, W / 2, footerY + footerH / 2 + 1, { align: 'center' });

    // ── Save
    const outPath = path.join(this.outDir, `${sale.invoice_number}.pdf`);
    const buffer  = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(outPath, buffer);

    // Update sale with path
    this.svc.db.prepare('UPDATE sales SET invoice_path=? WHERE id=?').run(outPath, saleId);

    return { ok: true, path: outPath, invoice_number: sale.invoice_number };
  }

  async generateReport(type, range) {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const purple = [108, 99, 255];
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...purple);
    doc.rect(0,0,W,20,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(`${type.toUpperCase()} REPORT  ·  ${range.from} to ${range.to}`, W/2, 13, {align:'center'});

    let data = [];
    let head = [];
    if (type === 'sales') {
      const rows = this.svc.getSalesReport(range);
      head = [['Invoice', 'Date', 'Customer', 'Model', 'Storage', 'Sale Price', 'Discount', 'Amount', 'Profit']];
      data = rows.map(r => [r.invoice_number, r.sale_date?.slice(0,10), r.customer, `${r.brand} ${r.model}`, r.storage, this._money(r.sale_price), this._money(r.discount), this._money(r.final_amount), this._money(r.profit)]);
    } else if (type === 'inventory') {
      const rows = this.svc.getInventoryReport();
      head = [['Model', 'Storage', 'Color', 'PTA', 'IMEI', 'Battery', 'Cost Price', 'Expected Price', 'Source']];
      data = rows.map(r => [`${r.brand} ${r.model}`, r.storage, r.color, this._ptaLabel(r.pta_status), r.imei1, r.battery_health, this._money(r.cost_price), this._money(r.sale_price), r.source]);
    } else if (type === 'profit') {
      const rep = this.svc.getProfitReport(range);
      head = [['Date', 'Revenue', 'Profit', 'Qty']];
      data = rep.rows.map(r => [r.d, this._money(r.revenue), this._money(r.profit), String(r.qty)]);
    } else if (type === 'purchase') {
      const rows = this.svc.getPurchaseReport(range);
      head = [['Date', 'Source', 'Market', 'Type', 'Phones', 'Total Cost']];
      data = rows.map(r => [
        r.purchase_date?.slice(0, 10),
        r.source_name || '',
        r.market_name || '',
        r.type === 'bulk' ? 'Bulk' : 'Customer',
        String(r.phones || 0),
        this._money(r.total),
      ]);
    }

    doc.autoTable({
      startY: 26, head, body: data,
      ...this._tableOpts({ headFill: purple, bodySize: 7, headSize: 8 }),
      alternateRowStyles: { fillColor: [248, 248, 255] },
      margin: { left: 10, right: 10 },
    });

    const outPath = path.join(this.outDir, `report_${type}_${Date.now()}.pdf`);
    fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
    return { ok: true, path: outPath };
  }

  _ptaLabel(s) {
    return { pta:'PTA Approved', non_pta:'Non PTA', jv:'JV', cpid:'CPID', unlocked:'Factory Unlocked' }[s] || s || '';
  }

  _money(v) {
    const n = Math.round(Number(v || 0));
    const formatted = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${n < 0 ? '-' : ''}PKR ${formatted}`;
  }

  _pdfSafe(text) {
    return String(text == null ? '' : text).replace(/[^\x20-\x7E]/g, '');
  }

  _tableOpts({ headFill, bodySize, headSize }) {
    return {
      headStyles: { fillColor: headFill, fontSize: headSize, font: 'helvetica' },
      bodyStyles: { fontSize: bodySize, font: 'helvetica' },
      didParseCell: (data) => {
        if (data.cell.raw == null) return;
        const safe = this._pdfSafe(data.cell.raw);
        data.cell.text = safe ? [safe] : [''];
      },
    };
  }

  _escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  async _renderRtlTextImage(text, maxWidthMm) {
    const maxWidthPx = Math.round(maxWidthMm * 3.78);
    const win = new BrowserWindow({
      show: false,
      width: maxWidthPx + 24,
      height: 400,
      webPreferences: { offscreen: true, contextIsolation: true },
    });

    try {
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
<style>
  html, body { margin:0; padding:0; background:#f8f7ff; }
  #wrap {
    width:${maxWidthPx}px;
    padding:1px 3px;
    font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
    font-size:11px;
    line-height:1.6;
    color:#646464;
    direction:rtl;
    text-align:right;
    word-break:break-word;
    white-space:pre-wrap;
  }
</style></head>
<body><div id="wrap">${this._escapeHtml(text)}</div></body></html>`;

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      await win.webContents.executeJavaScript('document.fonts.ready');
      const heightPx = await win.webContents.executeJavaScript(
        `Math.ceil(document.getElementById('wrap').getBoundingClientRect().height) + 6`
      );
      win.setContentSize(maxWidthPx + 24, Math.min(heightPx + 12, 800));
      await new Promise(r => setTimeout(r, 400)); // extra wait for Nastaleeq font load

      const image = await win.webContents.capturePage();
      const size = image.getSize();
      return {
        data: image.toPNG().toString('base64'),
        widthMm: maxWidthMm,
        heightMm: size.height / 3.78,
      };
    } finally {
      win.destroy();
    }
  }
}

module.exports = PdfService;