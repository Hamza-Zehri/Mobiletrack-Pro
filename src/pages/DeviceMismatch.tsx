import React, { useEffect, useState } from 'react';
import { ShieldOff, Copy, Check, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DeviceMismatch: React.FC = () => {
  const { licenseStatus } = useApp();
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.api.license.getDeviceId().then(setDeviceId);
  }, []);

  const copyDeviceId = async () => {
    if (!deviceId) return;
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '36px 32px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldOff size={32} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>License Not Valid for This Device</div>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', gap: 12, background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 16px', marginBottom: 22 }}>
            <AlertTriangle size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              {licenseStatus?.message || 'This license is registered to another computer. Copying the activation file will not work on a different device.'}
            </p>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
            Each license is bound to a single device. To use MobileTrack Pro on this computer, contact your software provider for a new license key.
          </p>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>This Device ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <code style={{ fontSize: 10, color: 'var(--text2)', wordBreak: 'break-all' }}>{deviceId || '…'}</code>
              <button type="button" className="btn btn-ghost" onClick={copyDeviceId} style={{ height: 30, padding: '0 10px', flexShrink: 0 }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            Activation file location: AppData\Roaming\MobileShopSystem
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceMismatch;
