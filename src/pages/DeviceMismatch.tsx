import React, { useEffect, useState } from 'react';
import { ShieldOff, Copy, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SupportContact from '../components/ui/SupportContact';

const DeviceMismatch: React.FC = () => {
  const { licenseStatus, activateLicense } = useApp();
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 520);

  useEffect(() => {
    window.api.license.getDeviceId().then(setDeviceId);
  }, []);

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
    if (res.ok) {
      setActivated(true);
    } else {
      setError(res.error || 'Activation failed');
    }
    setLoading(false);
  };

  const copyDeviceId = async () => {
    if (!deviceId) return;
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const p = isMobile ? 16 : 32;
  const h = isMobile ? 28 : 36;
  const iconSize = isMobile ? 28 : 32;
  const titleSize = isMobile ? 18 : 22;
  const btnH = 44;

  if (activated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
        <div style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: `${h}px ${p}px ${h - 6}px` }}>
            <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: isMobile ? 13 : 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Check size={iconSize} color="#fff" />
            </div>
            <div style={{ fontSize: titleSize, fontWeight: 800, color: '#fff' }}>Activation Successful</div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>MobileTrack Pro is now activated on this device.</div>
          </div>
          <div style={{ padding: `${isMobile ? 18 : 28}px ${p}px ${p}px` }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ width: '100%', justifyContent: 'center', height: btnH, fontSize: isMobile ? 13 : 14 }}>
              Continue to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: `${h}px ${p}px ${h - 8}px`, textAlign: 'center' }}>
          <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: isMobile ? 13 : 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <ShieldOff size={iconSize} color="#fff" />
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 800, color: '#fff' }}>License Not Valid for This Device</div>
        </div>

        <div style={{ padding: `${isMobile ? 18 : 28}px ${p}px ${p}px` }}>
          <div style={{ display: 'flex', gap: 10, background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 16px', marginBottom: isMobile ? 14 : 18 }}>
            <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text)', lineHeight: 1.6 }}>
              {licenseStatus?.message || 'This license is registered to another computer. Copying the activation file will not work on a different device.'}
            </p>
          </div>

          <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: isMobile ? 14 : 18 }}>
            Enter a new license key for this device below, or contact support for assistance.
          </p>

          <form onSubmit={handleActivate}>
            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: isMobile ? 10 : 14 }}>
              <label style={{ display: 'block', fontSize: isMobile ? 11 : 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>New License Key</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  value={licenseKey}
                  onChange={e => setLicenseKey(formatKeyInput(e.target.value))}
                  placeholder="MTP-XXXX-XXXX-XXXX-XXXX"
                  style={{ paddingLeft: 38, fontFamily: 'monospace', letterSpacing: '0.04em', width: '100%', boxSizing: 'border-box', height: btnH, fontSize: isMobile ? 13 : 14 }}
                  autoFocus
                  spellCheck={false}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || licenseKey.replace(/-/g, '').length < 23} style={{ width: '100%', justifyContent: 'center', height: btnH, fontSize: isMobile ? 13 : 14, marginBottom: isMobile ? 12 : 16 }}>
              {loading ? 'Activating…' : 'Activate on This Device'}
            </button>
          </form>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: isMobile ? '10px 12px' : '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>This Device ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <code style={{ fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all' }}>{deviceId ? `${deviceId.slice(0, 8)}…${deviceId.slice(-8)}` : '…'}</code>
              <button type="button" className="btn btn-ghost" onClick={copyDeviceId} style={{ height: 30, padding: '0 10px', flexShrink: 0, fontSize: isMobile ? 11 : 12 }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <SupportContact title="Need help? Contact the developer" />
        </div>
      </div>
    </div>
  );
};

export default DeviceMismatch;
