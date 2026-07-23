import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Calendar, FolderOpen, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LicenseOwnerInfo } from '../types';

const OwnerLicense: React.FC = () => {
  const nav = useNavigate();
  const { toast, refreshLicense } = useApp();
  const [info, setInfo] = useState<LicenseOwnerInfo | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await window.api.license.getOwnerInfo();
      setInfo(data);
      setLoading(false);
    })();
  }, []);

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'active': return { text: 'Activated', color: 'var(--green)' };
      case 'device_mismatch': return { text: 'Device Mismatch', color: 'var(--red)' };
      case 'corrupt': return { text: 'Corrupt / Invalid', color: 'var(--amber)' };
      default: return { text: 'Not Activated', color: 'var(--text3)' };
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Remove activation from this device? The software will require a new license key.')) return;
    const res = await window.api.license.deactivate();
    if (res.ok) {
      toast('Activation removed', 'info');
      await refreshLicense();
      nav('/about');
    } else {
      toast(res.error || 'Failed to deactivate', 'error');
    }
  };

  const st = statusLabel(info?.status);

  if (loading) {
    return <div className="fade-in page-content" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text3)' }}>Loading license info…</div>;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => nav('/about')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to About
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="var(--accent2)" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>License Administration</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Owner-only · Not visible in navigation</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <Row icon={<Shield size={16} />} label="Activation Status" value={
          <span style={{ color: st.color, fontWeight: 700 }}>{st.text}</span>
        } />
        <Row icon={<KeyRound size={16} />} label="License Key" value={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ fontSize: 12 }}>{showKey ? (info?.licenseKey || '—') : (info?.licenseKeyMasked || '—')}</code>
            {info?.licenseKey && (
              <button type="button" className="btn btn-ghost" style={{ height: 28, padding: '0 8px' }} onClick={() => setShowKey(s => !s)}>
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            )}
          </div>
        } />
        <Row icon={<Calendar size={16} />} label="Activated At" value={info?.activatedAt ? new Date(info.activatedAt).toLocaleString() : '—'} />
        <Row icon={<FolderOpen size={16} />} label="Activation File" value={
          <code style={{ fontSize: 10, wordBreak: 'break-all' }}>{info?.activationFile || '—'}</code>
        } last />
      </div>

      {info?.activated && (
        <button className="btn" onClick={handleDeactivate} style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)' }}>
          <Trash2 size={14} /> Remove Activation
        </button>
      )}
    </div>
  );
};

const Row: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; last?: boolean }> = ({ icon, label, value, last }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--border)', alignItems: 'flex-start' }}>
    <div style={{ color: 'var(--text3)', marginTop: 2 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{value}</div>
    </div>
  </div>
);

export default OwnerLicense;
