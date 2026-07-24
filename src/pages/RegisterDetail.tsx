import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Spinner, EmptyState } from '../components/ui/Toast';
import XReportSlideshow from '../components/ui/XReportSlideshow';
import {
  ArrowLeft, Eye, Play, Clock, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, ShoppingCart, RotateCcw, DollarSign
} from 'lucide-react';
import { CashSession, Sale } from '../types';

const money = (v: number) => `₨ ${(v || 0).toLocaleString()}`;

const RegisterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CashSession | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);

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
        <p style={{ color: 'var(--text3)', marginBottom: 14 }}>Register session not found</p>
        <button className="btn btn-ghost" onClick={() => nav('/cash-register')}>
          <ArrowLeft size={15} /> Back to Register
        </button>
      </div>
    );
  }

  const isOpen = session.status === 'open';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={() => nav('/cash-register')}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">Register — {session.session_date}</h1>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {isOpen ? 'Open' : 'Closed'} · ID #{session.id}
            </div>
          </div>
        </div>
        {sales.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowSlideshow(true)}>
            <Play size={15} /> X Report
          </button>
        )}
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card stat-glow">
          <div className="stat-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent2)' }}><DollarSign size={18} /></div>
          <div className="stat-label">Opening Balance</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{money(session.opening_balance)}</div>
        </div>
        <div className="stat-card stat-glow">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><ShoppingCart size={18} /></div>
          <div className="stat-label">Total Sales</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{money(session.total_sales)}</div>
          <div className="stat-sub">{sales.length} items sold</div>
        </div>
        <div className="stat-card stat-glow">
          <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><RotateCcw size={18} /></div>
          <div className="stat-label">Total Returns</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{money(session.total_returns)}</div>
          <div className="stat-sub">{summary?.returnsCount || 0} returns</div>
        </div>
        <div className="stat-card stat-glow">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><TrendingUp size={18} /></div>
          <div className="stat-label">Net Received</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{money(session.total_received)}</div>
        </div>
      </div>

      {/* ── Extra info if closed ───────────────────────────────────────── */}
      {!isOpen && (
        <div className="stats-grid" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Closing Balance</div>
            <div className="stat-value">{money(session.closing_balance)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cash In</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{money(session.cash_in)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cash Out</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{money(session.cash_out)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Closed At</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{session.closed_at || '—'}</div>
          </div>
        </div>
      )}

      {/* ── Sales Table ────────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Sales in this Session</div>
        {sales.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={40} />}
            message="No sales recorded in this session"
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Phone</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Profit</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.invoice_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.brand} {s.model}</div>
                      <div className="sub">{s.imei1}</div>
                    </td>
                    <td>
                      <div>{s.customer}</div>
                      <div className="sub">{s.customer_mobile}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{money(s.final_amount)}</td>
                    <td style={{ color: s.profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {money(s.profit)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.sale_date?.slice(11, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── X Report Slideshow ─────────────────────────────────────────── */}
      {showSlideshow && (
        <XReportSlideshow
          summary={summary}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </div>
  );
};

export default RegisterDetail;
