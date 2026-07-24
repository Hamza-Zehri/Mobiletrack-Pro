import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Spinner, EmptyState } from '../components/ui/Toast';
import { Sun, Moon, Eye, Calendar } from 'lucide-react';
import { CashSession } from '../types';

const money = (v: number) => `₨ ${(v || 0).toLocaleString()}`;

const CashRegister: React.FC = () => {
  const { toast } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const load = async () => {
    try {
      const [cur, all] = await Promise.all([
        window.api.register.getCurrent(),
        window.api.register.getAll(),
      ]);
      setCurrentSession(cur);
      setSessions(all);
    } catch (e: any) {
      toast(e.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStartDay = async () => {
    setStarting(true);
    try {
      const res = await window.api.register.open({ opening_balance: 0 });
      if (res.ok) {
        toast('Day started! All sales will be tracked.', 'success');
        await load();
      } else {
        toast(res.error || 'Failed', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Failed', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleEndDay = async () => {
    if (!currentSession) return;
    setEnding(true);
    try {
      const res = await window.api.register.close(currentSession.id, { closing_balance: 0 });
      if (res.ok) {
        toast(`Day ended. ${res.salesCount} sales recorded.`, 'success');
        await load();
        nav(`/cash-register/${currentSession.id}`);
      } else {
        toast(res.error || 'Failed', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Failed', 'error');
    } finally {
      setEnding(false);
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
        <h1 className="page-title">Day Sessions</h1>
      </div>

      {/* ── Main Action Card ─────────────────────────────────────────────── */}
      {currentSession ? (
        <div className="card" style={{
          marginBottom: 18, borderColor: 'var(--green)',
          background: 'linear-gradient(135deg, rgba(34,201,122,0.06), rgba(34,201,122,0.02))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--green-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sun size={26} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>Day In Progress</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
                  Started at {currentSession.created_at?.slice(11, 16) || '—'} · {currentSession.session_date}
                </div>
              </div>
            </div>
            <button className="btn btn-danger btn-lg" onClick={handleEndDay} disabled={ending}>
              {ending ? <Spinner size={16} /> : <Moon size={18} />}
              End Day
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{
          marginBottom: 18, textAlign: 'center', padding: 48,
          border: '2px dashed var(--border2)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Sun size={32} color="var(--accent2)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Start Your Day</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Click below to start the day. All sales made today will be tracked and you can view a full report when you end the day.
          </div>
          <button className="btn btn-success btn-lg" onClick={handleStartDay} disabled={starting}>
            {starting ? <Spinner size={18} /> : <Sun size={20} />}
            Start Day
          </button>
        </div>
      )}

      {/* ── Past Sessions ─────────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="var(--accent2)" /> Past Days
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
            message="No day sessions yet. Start your first day!"
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th>Sales</th>
                  <th>Net Received</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.session_date}</td>
                    <td>{s.created_at?.slice(11, 16) || '—'}</td>
                    <td>{s.closed_at?.slice(11, 16) || '—'}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{money(s.total_sales)}</td>
                    <td style={{ fontWeight: 600 }}>{money(s.total_received)}</td>
                    <td>
                      <span className={`badge ${s.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                        {s.status === 'open' ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => nav(`/cash-register/${s.id}`)}>
                        <Eye size={13} /> Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashRegister;
