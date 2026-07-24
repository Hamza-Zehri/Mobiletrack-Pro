import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Modal, Spinner, EmptyState } from '../components/ui/Toast';
import {
  DollarSign, Lock, Unlock, Eye, Clock, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, ShoppingCart, RotateCcw
} from 'lucide-react';
import { CashSession } from '../types';

const money = (v: number) => `₨ ${(v || 0).toLocaleString()}`;

const CashRegister: React.FC = () => {
  const { toast } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [cashIn, setCashIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [cur, all] = await Promise.all([
        window.api.register.getCurrent(),
        window.api.register.getAll(),
      ]);
      setCurrentSession(cur);
      setSessions(all);
    } catch (e: any) {
      toast(e.message || 'Failed to load register', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast('Enter a valid opening balance', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await window.api.register.open({
        opening_balance: parseFloat(openingBalance),
        notes: openingNotes || undefined,
      });
      if (res.ok) {
        toast('Register opened successfully', 'success');
        setOpenModal(false);
        setOpeningBalance('');
        setOpeningNotes('');
        await load();
      } else {
        toast(res.error || 'Failed to open register', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!currentSession) return;
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast('Enter a valid closing balance', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await window.api.register.close(currentSession.id, {
        closing_balance: parseFloat(closingBalance),
        cash_in: parseFloat(cashIn) || 0,
        cash_out: parseFloat(cashOut) || 0,
        notes: closingNotes || undefined,
      });
      if (res.ok) {
        toast(`Register closed. ${res.salesCount} sales recorded.`, 'success');
        setCloseModal(false);
        setClosingBalance('');
        setCashIn('');
        setCashOut('');
        setClosingNotes('');
        await load();
      } else {
        toast(res.error || 'Failed', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cash Register</h1>
      </div>

      {/* ── Status Banner ──────────────────────────────────────────────── */}
      {currentSession ? (
        <div className="card" style={{ marginBottom: 18, borderColor: 'var(--green)', background: 'linear-gradient(135deg, rgba(34,201,122,0.06), rgba(34,201,122,0.02))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Unlock size={20} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Register Open</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Since {currentSession.created_at?.slice(11, 16) || '—'} · {currentSession.session_date}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '0 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>OPENING</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{money(currentSession.opening_balance)}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>SALES</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{money(currentSession.total_sales)}</div>
              </div>
              <button className="btn btn-danger" onClick={() => setCloseModal(true)}>
                <Lock size={15} /> Close Register
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 18, textAlign: 'center', padding: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <DollarSign size={28} color="var(--accent2)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No Register Open</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 18 }}>
            Open a register to start tracking today's sales
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setOpenModal(true)}>
            <Unlock size={18} /> Open Register
          </button>
        </div>
      )}

      {/* ── History Table ───────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Register History</div>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Clock size={40} />}
            message="No register sessions yet"
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opening</th>
                  <th>Sales</th>
                  <th>Returns</th>
                  <th>Received</th>
                  <th>Closing</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.session_date}</div>
                      <div className="sub">{s.created_at?.slice(11, 16)}</div>
                    </td>
                    <td>{money(s.opening_balance)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{money(s.total_sales)}</td>
                    <td style={{ color: 'var(--red)' }}>{money(s.total_returns)}</td>
                    <td style={{ fontWeight: 600 }}>{money(s.total_received)}</td>
                    <td>{s.status === 'closed' ? money(s.closing_balance) : '—'}</td>
                    <td>
                      <span className={`badge ${s.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                        {s.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => nav(`/cash-register/${s.id}`)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Open Modal ─────────────────────────────────────────────────── */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Open Register" width={420}>
        <div className="form-grid">
          <div className="field">
            <label>Opening Balance *</label>
            <input
              type="number"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
              placeholder="0"
              min={0}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea
              value={openingNotes}
              onChange={e => setOpeningNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setOpenModal(false)}>Cancel</button>
          <button className="btn btn-success" onClick={handleOpen} disabled={submitting}>
            {submitting ? <Spinner size={16} /> : <Unlock size={15} />}
            Open Register
          </button>
        </div>
      </Modal>

      {/* ── Close Modal ────────────────────────────────────────────────── */}
      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Close Register" width={480}>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Enter the final cash count to close today's register.
        </div>
        <div className="form-grid cols-2">
          <div className="field">
            <label>Closing Balance *</label>
            <input
              type="number"
              value={closingBalance}
              onChange={e => setClosingBalance(e.target.value)}
              placeholder="0"
              min={0}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Cash In (extra additions)</label>
            <input
              type="number"
              value={cashIn}
              onChange={e => setCashIn(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="field">
            <label>Cash Out (withdrawals)</label>
            <input
              type="number"
              value={cashOut}
              onChange={e => setCashOut(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="field">
            <label>Notes</label>
            <input
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setCloseModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleClose} disabled={submitting}>
            {submitting ? <Spinner size={16} /> : <Lock size={15} />}
            Close Register
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CashRegister;
