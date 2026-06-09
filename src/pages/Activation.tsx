import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Copy, Check, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Activation: React.FC = () => {
  const { activateLicense, refreshLicense } = useApp();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    refreshLicense();
    window.api.license.getDeviceId().then(setDeviceId);
  }, [refreshLicense]);

  const formatKeyInput = (value: string) => {
    const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let body = raw.startsWith('MTP') ? raw.slice(3) : raw;
    body = body.slice(0, 20);
    const parts = body.match(/.{1,4}/g) || [];
    return parts.length ? `MTP-${parts.join('-')}` : (raw.startsWith('MTP') ? 'MTP' : '');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await activateLicense(licenseKey);
    if (!res.ok) setError(res.error || 'Activation failed');
    setLoading(false);
  };

  const copyDeviceId = async () => {
    if (!deviceId) return;
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortDeviceId = deviceId ? `${deviceId.slice(0, 8)}…${deviceId.slice(-8)}` : '…';

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', padding: '36px 32px 30px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={32} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Activate MobileTrack Pro</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>Enter your license key to unlock the software</div>
        </div>

        <form onSubmit={handleActivate} style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <div className="field" style={{ marginBottom: 18 }}>
            <label>License Key</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                value={licenseKey}
                onChange={e => setLicenseKey(formatKeyInput(e.target.value))}
                placeholder="MTP-XXXX-XXXX-XXXX-XXXX"
                style={{ paddingLeft: 38, fontFamily: 'monospace', letterSpacing: '0.04em' }}
                autoFocus
                spellCheck={false}
              />
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Device ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <code style={{ fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all' }}>{shortDeviceId}</code>
              <button type="button" className="btn btn-ghost" onClick={copyDeviceId} style={{ height: 30, padding: '0 10px', flexShrink: 0 }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
              Your license will be bound to this device after activation.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || licenseKey.replace(/-/g, '').length < 23} style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}>
            {loading ? 'Activating…' : 'Activate Software'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, color: 'var(--text3)', fontSize: 11 }}>
            <Smartphone size={12} />
            <span>Licensed software · Engr. Hamza Asad</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Activation;
