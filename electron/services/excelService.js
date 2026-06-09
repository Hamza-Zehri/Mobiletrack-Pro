'use strict';
const XLSX = require('xlsx');
const path = require('path');
const os   = require('os');

class ExcelService {
  constructor(dbService) { this.svc = dbService; }

  async export(type, range) {
    let rows = [], sheetName = type;

    if (type === 'sales') {
      const data = this.svc.getSalesReport(range);
      sheetName = 'Sales Report';
      rows = data.map(r => ({
        'Invoice No':   r.invoice_number,
        'Date':         r.sale_date?.slice(0,10),
        'Customer':     r.customer,
        'Mobile':       r.customer_mobile,
        'Brand':        r.brand,
        'Model':        r.model,
        'Storage':      r.storage,
        'IMEI':         r.imei1,
        'Sale Price':   r.sale_price,
        'Discount':     r.discount,
        'Final Amount': r.final_amount,
        'Cost Price':   r.cost_price,
        'Profit':       r.profit,
      }));
    } else if (type === 'inventory') {
      const data = this.svc.getInventoryReport();
      sheetName = 'Inventory';
      rows = data.map(r => ({
        'Brand':          r.brand,
        'Model':          r.model,
        'Storage':        r.storage,
        'Color':          r.color,
        'PTA Status':     r.pta_status,
        'IMEI 1':         r.imei1,
        'IMEI 2':         r.imei2,
        'Battery Health': r.battery_health,
        'Face ID':        r.face_id,
        'Box':            r.box ? 'Yes' : 'No',
        'Charger':        r.charger ? 'Yes' : 'No',
        'Cost Price':     r.cost_price,
        'Sale Price':     r.sale_price,
        'Source':         r.source,
        'Added On':       r.created_at?.slice(0,10),
      }));
    } else if (type === 'profit') {
      const data = this.svc.getProfitReport(range);
      sheetName = 'Profit Report';
      rows = data.rows.map(r => ({
        'Date':    r.d,
        'Revenue': r.revenue,
        'Profit':  r.profit,
        'Qty':     r.qty,
      }));
    } else if (type === 'purchase') {
      const data = this.svc.getPurchaseReport(range);
      sheetName = 'Purchase Report';
      rows = data.map(r => ({
        'Date':        r.purchase_date,
        'Type':        r.type,
        'Source':      r.source_name,
        'Market':      r.market_name,
        'Phones':      r.phones,
        'Total Cost':  r.total,
      }));
    } else if (type === 'customers') {
      const data = this.svc.getCustomers('');
      sheetName = 'Customers';
      rows = data.map(r => ({
        'Name':         r.name,
        'Mobile':       r.mobile,
        'CNIC':         r.cnic,
        'Address':      r.address,
        'Sold To':      r.sold_to,
        'Bought From':  r.bought_from,
        'Joined':       r.created_at?.slice(0,10),
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const cols = rows.length > 0 ? Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key]||'').length)) + 2
    })) : [];
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const outPath = path.join(os.tmpdir(), `mobiletrack_${type}_${Date.now()}.xlsx`);
    XLSX.writeFile(wb, outPath);
    return { ok: true, path: outPath };
  }
}

module.exports = ExcelService;
