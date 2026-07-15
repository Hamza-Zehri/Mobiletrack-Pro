import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Shield, ShieldCheck, ShieldOff, Clock, KeyRound, Copy, Check, Calendar, HardDrive } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OWNER_CLICKS = 5;
const OWNER_WINDOW_MS = 2500;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.FC<any> }> = {
  active:        { label: 'Licensed',       color: '#16a34a', bg: 'rgba(22,163,74,.08)',  border: 'rgba(22,163,74,.25)', icon: ShieldCheck },
  trial_active:  { label: 'Trial Active',   color: '#d97706', bg: 'rgba(217,119,6,.08)',  border: 'rgba(217,119,6,.25)', icon: Clock },
  trial_expired: { label: 'Trial Expired',  color: '#dc2626', bg: 'rgba(220,38,38,.08)',  border: 'rgba(220,38,38,.25)', icon: ShieldOff },
  not_activated: { label: 'Not Activated',  color: '#6b7280', bg: 'rgba(107,114,128,.08)', border: 'rgba(107,114,128,.25)', icon: ShieldOff },
};

const About: React.FC = () => {
  const nav = useNavigate();
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { licenseStatus, trialInfo } = useApp();
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.api.license.getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        nav('/owner/license');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  const handleVersionClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, OWNER_WINDOW_MS);
    if (clickCount.current >= OWNER_CLICKS) {
      clickCount.current = 0;
      nav('/owner/license');
    }
  };

  const copyDeviceId = async () => {
    if (!deviceId) return;
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = licenseStatus?.status || 'not_activated';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_activated;
  const StatusIcon = cfg.icon;

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: 22, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 60px rgba(108,99,255,.35)' }}>
        <Smartphone size={48} color="#fff" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>MobileTrack Pro</h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>Mobile Shop Inventory & Sales Management System</p>
      <div
        onClick={handleVersionClick}
        title="Version"
        style={{ display: 'inline-block', background: 'var(--accent-bg)', color: 'var(--accent2)', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 28, cursor: 'default', userSelect: 'none' }}
      >
        Version 1.0.0
      </div>

      {/* ── License Status Card ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        textAlign: 'left',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: cfg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <StatusIcon size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>License Status</div>
            <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600, marginTop: 2 }}>{cfg.label}</div>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 20px' }}>
          {/* License Key */}
          {licenseStatus?.licenseKey && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={14} color="var(--text3)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>License Key</div>
                  <code style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.03em' }}>{licenseStatus.licenseKey}</code>
                </div>
              </div>
            </div>
          )}

          {/* Activated Date */}
          {licenseStatus?.activatedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Calendar size={14} color="var(--text3)" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activated On</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{new Date(licenseStatus.activatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          )}

          {/* Trial Info */}
          {trialInfo?.onTrial && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Clock size={14} color="var(--text3)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trial Period</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''} remaining</div>
              </div>
              <div style={{
                background: trialInfo.daysLeft <= 2 ? 'rgba(220,38,38,.1)' : 'rgba(217,119,6,.1)',
                color: trialInfo.daysLeft <= 2 ? '#dc2626' : '#d97706',
                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
              }}>
                {trialInfo.daysLeft <= 2 ? 'Expiring Soon' : 'Active'}
              </div>
            </div>
          )}

          {/* Device ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HardDrive size={14} color="var(--text3)" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Device ID</div>
                <code style={{ fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all' }}>{deviceId ? `${deviceId.slice(0, 12)}…${deviceId.slice(-12)}` : '…'}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={copyDeviceId}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 30, padding: '0 10px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, cursor: 'pointer', fontSize: 11, color: 'var(--text2)',
                fontFamily: 'inherit', transition: 'all .15s',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Developer Card ───────────────────────────────────────────────── */}
      <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>H</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Engr. Hamza Asad</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>Software Architect & Developer</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>All Rights Reserved © 2026</div>
          </div>
        </div>
      </div>

      {/* ── Features Card ────────────────────────────────────────────────── */}
      <div className="card" style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>Features</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {['Inventory Management', 'Purchase Tracking', 'Bulk Purchase Entry', 'Sales & Invoicing', 'PDF Invoice Generation', 'WhatsApp Sharing', 'Customer Management', 'Phone History Search', 'Reports & Analytics', 'Encrypted Backup', 'Auto Backup', 'Device License Protection'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', padding: '4px 0' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 24 }}>
        Designed for mobile phone shops across Pakistan
      </p>
    </div>
  );
};

export default About;
