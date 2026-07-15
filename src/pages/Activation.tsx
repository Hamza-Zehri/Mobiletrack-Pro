import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Copy, Check, Smartphone, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SupportContact from '../components/ui/SupportContact';

const Activation: React.FC = () => {
  const { activateLicense, refreshLicense, licenseStatus } = useApp();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 520);

  const isTrialExpired = licenseStatus?.status === 'trial_expired';

  useEffect(() => {
    refreshLicense();
    window.api.license.getDeviceId().then(setDeviceId);
  }, [refreshLicense]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 520);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const p = isMobile ? 16 : 32;
  const h = isMobile ? 28 : 36;
  const iconSize = isMobile ? 28 : 32;
  const titleSize = isMobile ? 18 : 22;
  const subSize = isMobile ? 12 : 13;
  const bodySize = isMobile ? 12 : 13;
  const btnH = 44;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: isTrialExpired ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#6c63ff,#4f46e5)', padding: `${h}px ${p}px ${h - 6}px`, textAlign: 'center' }}>
          <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: isMobile ? 13 : 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            {isTrialExpired ? <AlertTriangle size={iconSize} color="#fff" /> : <Shield size={iconSize} color="#fff" />}
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 800, color: '#fff' }}>
            {isTrialExpired ? 'Trial Expired' : 'Activate MobileTrack Pro'}
          </div>
          <div style={{ fontSize: subSize, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
            {isTrialExpired
              ? 'Your 7-day free trial has ended. Enter your license key to continue.'
              : 'Enter your license key to unlock the software'}
          </div>
        </div>

        {isTrialExpired && (
          <div style={{ margin: `${isMobile ? 12 : 20}px ${p}px 0`, background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={16} color="var(--red)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>7-day trial has expired</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Enter a valid license key to continue using MobileTrack Pro.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleActivate} style={{ padding: `${isMobile ? 18 : 28}px ${p}px ${p}px` }}>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 12 }}>
                {error}
              </div>
              <SupportContact title="Need help? Contact the developer" />
            </div>
          )}

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: isMobile ? 11 : 12 }}>License Key</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                value={licenseKey}
                onChange={e => setLicenseKey(formatKeyInput(e.target.value))}
                placeholder="MTP-XXXX-XXXX-XXXX-XXXX"
                style={{ paddingLeft: 38, fontFamily: 'monospace', letterSpacing: '0.04em', height: btnH, fontSize: isMobile ? 13 : 14 }}
                autoFocus
                spellCheck={false}
              />
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: isMobile ? '10px 12px' : '12px 14px', marginBottom: isMobile ? 16 : 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Device ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <code style={{ fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all' }}>{shortDeviceId}</code>
              <button type="button" className="btn btn-ghost" onClick={copyDeviceId} style={{ height: 30, padding: '0 10px', flexShrink: 0, fontSize: isMobile ? 11 : 12 }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
              Your license will be bound to this device after activation.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || licenseKey.replace(/-/g, '').length < 23} style={{ width: '100%', justifyContent: 'center', height: btnH, fontSize: isMobile ? 13 : 14 }}>
            {loading ? 'Activating…' : 'Activate Software'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, color: 'var(--text3)', fontSize: 11 }}>
            <Smartphone size={12} />
            <span>Licensed software · Engr. Hamza Asad</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Activation;
