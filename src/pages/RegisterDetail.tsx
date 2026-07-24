import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Spinner, EmptyState } from '../components/ui/Toast';
import { ArrowLeft, Printer, Download, ShoppingCart, RotateCcw, TrendingUp } from 'lucide-react';
import { CashSession, Sale } from '../types';

const money = (v: number) => `₨ ${(v || 0).toLocaleString()}`;

const RegisterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast, settings } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CashSession | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [sess, sessSales, sum] = await Promise.all([
          window.api.register.getById(Number(id)),
          window.api.register.getSales(Number(id)),
          window.api.register.summary(Number(id)),
        ]);
        setSession(sess);
        setSales(sessSales);
        setSummary(sum);
      } catch (e: any) {
        toast(e.message || 'Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Day Report - ${session?.session_date}</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1a1d2e; font-size: 13px; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        h2 { font-size: 16px; margin: 24px 0 10px; color: #4a5068; border-bottom: 2px solid #dde0ec; padding-bottom: 6px; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #dde0ec; padding-bottom: 16px; }
        .header .shop { font-size: 12px; color: #8b93ac; }
        .header .date { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat { background: #f3f4f8; border-radius: 8px; padding: 14px; text-align: center; }
        .stat .label { font-size: 10px; color: #8b93ac; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .stat .value { font-size: 20px; font-weight: 800; }
        .stat .value.green { color: #16a362; }
        .stat .value.red { color: #e03c3c; }
        .stat .value.blue { color: #2274cc; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f3f4f8; font-size: 10px; font-weight: 700; color: #8b93ac; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e8eaf0; font-size: 12px; }
        tr:last-child td { border-bottom: none; }
        .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #dde0ec; font-size: 11px; color: #8b93ac; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const handleSavePdf = async () => {
    const content = reportRef.current;
    if (!content) return;
    try {
      const html = `<!DOCTYPE html><html><head><title>Day Report</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1a1d2e; font-size: 13px; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          h2 { font-size: 16px; margin: 24px 0 10px; color: #4a5068; border-bottom: 2px solid #dde0ec; padding-bottom: 6px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #dde0ec; padding-bottom: 16px; }
          .header .shop { font-size: 12px; color: #8b93ac; }
          .header .date { font-size: 14px; font-weight: 700; margin-top: 4px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat { background: #f3f4f8; border-radius: 8px; padding: 14px; text-align: center; }
          .stat .label { font-size: 10px; color: #8b93ac; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
          .stat .value { font-size: 20px; font-weight: 800; }
          .stat .value.green { color: #16a362; }
          .stat .value.red { color: #e03c3c; }
          .stat .value.blue { color: #2274cc; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f3f4f8; font-size: 10px; font-weight: 700; color: #8b93ac; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #e8eaf0; font-size: 12px; }
          tr:last-child td { border-bottom: none; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #dde0ec; font-size: 11px; color: #8b93ac; }
        </style></head><body>${content.innerHTML}</body></html>`;
      const res = await window.api.register.exportPdf(html, `day-report-${session.session_date}.pdf`);
      if (res?.ok && res.path) {
        toast(`PDF saved: ${res.path}`, 'success');
      } else {
        toast('Failed to save PDF', 'error');
      }
    } catch {
      toast('Failed to save PDF', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: 'var(--text3)', marginBottom: 14 }}>Session not found</p>
        <button className="btn btn-ghost" onClick={() => nav('/cash-register')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    );
  }

  const shopName = settings?.shop?.name || 'MobileTrack Pro';
  const shopAddress = settings?.shop?.address || '';
  const shopMobile = settings?.shop?.mobile || '';
  const profit = (summary?.totalSales || 0) - (summary?.totalReturns || 0);

  return (
    <div>
      {/* ── Action Bar ────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={() => nav('/cash-register')}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">Day Report — {session.session_date}</h1>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {session.created_at?.slice(11, 16)} — {session.closed_at?.slice(11, 16) || 'Active'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print
          </button>
          <button className="btn btn-ghost" onClick={handleSavePdf}>
            <Download size={15} /> Save PDF
          </button>
        </div>
      </div>

      {/* ── Printable Report ──────────────────────────────────────────────── */}
      <div ref={reportRef}>
        {/* Header */}
        <div className="header">
          <h1>{shopName}</h1>
          {shopAddress && <div className="shop">{shopAddress}</div>}
          {shopMobile && <div className="shop">{shopMobile}</div>}
          <div className="date">Daily Sales Report — {session.session_date}</div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <div className="label">Total Sales</div>
            <div className="value green">{money(summary?.totalSales || 0)}</div>
          </div>
          <div className="stat">
            <div className="label">Returns</div>
            <div className="value red">{money(summary?.totalReturns || 0)}</div>
          </div>
          <div className="stat">
            <div className="label">Net Received</div>
            <div className="value blue">{money(summary?.totalReceived || 0)}</div>
          </div>
          <div className="stat">
            <div className="label">Items Sold</div>
            <div className="value">{summary?.salesCount || 0}</div>
          </div>
        </div>

        {/* Sales Table */}
        <h2>Sales ({summary?.salesCount || 0} items)</h2>
        {sales.length === 0 ? (
          <p style={{ color: '#8b93ac', textAlign: 'center', padding: 20 }}>No sales recorded this day.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice</th>
                <th>Phone</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{s.invoice_number}</td>
                  <td>{s.brand} {s.model}</td>
                  <td>{s.customer || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(s.final_amount)}</td>
                  <td style={{ textAlign: 'right', color: s.profit >= 0 ? '#16a362' : '#e03c3c', fontWeight: 600 }}>
                    {money(s.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 800 }}>
                <td colSpan={4} style={{ textAlign: 'right', borderTop: '2px solid #dde0ec' }}>TOTAL</td>
                <td style={{ textAlign: 'right', borderTop: '2px solid #dde0ec' }}>{money(summary?.totalSales || 0)}</td>
                <td style={{ textAlign: 'right', borderTop: '2px solid #dde0ec', color: profit >= 0 ? '#16a362' : '#e03c3c' }}>{money(profit)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Returns */}
        {(summary?.returnsCount || 0) > 0 && (
          <>
            <h2>Returns ({summary.returnsCount})</h2>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Refund</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.returns || []).map((r: any, i: number) => (
                  <tr key={i}>
                    <td>{r.invoice_number}</td>
                    <td>{r.reason || '—'}</td>
                    <td style={{ textAlign: 'right', color: '#e03c3c' }}>{money(r.refund_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer */}
        <div className="footer">
          Generated by {shopName} · MobileTrack Pro
        </div>
      </div>

      {/* ── On-screen Preview (styled) ────────────────────────────────────── */}
      <style>{`
        @media screen {
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--border); }
          .header h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
          .header .shop { font-size: 12px; color: var(--text3); }
          .header .date { font-size: 14px; font-weight: 700; margin-top: 4px; color: var(--text2); }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat { background: var(--surface2); border-radius: 10px; padding: 16px; text-align: center; border: 1px solid var(--border); }
          .stat .label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-weight: 600; }
          .stat .value { font-size: 22px; font-weight: 800; }
          .stat .value.green { color: var(--green); }
          .stat .value.red { color: var(--red); }
          .stat .value.blue { color: var(--blue); }
        }
      `}</style>
    </div>
  );
};

export default RegisterDetail;
