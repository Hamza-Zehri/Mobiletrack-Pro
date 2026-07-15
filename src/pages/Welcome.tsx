import React, { useState, useEffect } from 'react';
import { KeyRound, Clock, Smartphone, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Activation from './Activation';

const Welcome: React.FC = () => {
  const { startTrial } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showActivation, setShowActivation] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 520);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 520);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleStartTrial = async () => {
    setError('');
    setLoading(true);
    const res = await startTrial();
    if (!res.ok) {
      setError(res.error || 'Failed to start trial');
      setLoading(false);
      return;
    }
    window.location.reload();
  };

  const handleEnterKey = () => {
    setShowActivation(true);
  };

  const p = isMobile ? 16 : 32;
  const h = isMobile ? 32 : 40;
  const iconSize = isMobile ? 30 : 36;
  const titleSize = isMobile ? 20 : 24;

  if (showActivation) return <Activation />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', padding: `${h}px ${p}px ${h - 8}px`, textAlign: 'center' }}>
          <div style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72, borderRadius: isMobile ? 15 : 18, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Smartphone size={iconSize} color="#fff" />
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 800, color: '#fff' }}>Welcome to MobileTrack Pro</div>
          <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.5 }}>
            Mobile Shop Inventory & Sales Management System
          </div>
        </div>

        <div style={{ padding: `${isMobile ? 20 : 32}px ${p}px ${isMobile ? 24 : 36}px` }}>
          <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginBottom: isMobile ? 20 : 28 }}>
            Choose how you'd like to get started:
          </p>

          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleEnterKey}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
              padding: isMobile ? '14px 16px' : '18px 20px', marginBottom: isMobile ? 10 : 14,
              background: 'var(--surface2)', border: '2px solid var(--border)', borderRadius: 14,
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
          >
            <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: isMobile ? 10 : 12, background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <KeyRound size={isMobile ? 18 : 22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: 'var(--text)' }}>I have a license key</div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text3)', marginTop: 3 }}>Enter your activation key to unlock permanently</div>
            </div>
            <ArrowRight size={isMobile ? 16 : 18} color="var(--text3)" />
          </button>

          <button
            onClick={handleStartTrial}
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
              padding: isMobile ? '14px 16px' : '18px 20px', marginBottom: 8,
              background: 'var(--surface2)', border: '2px solid var(--border)', borderRadius: 14,
              cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all .15s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)'; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
          >
            <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: isMobile ? 10 : 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={isMobile ? 18 : 22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: 'var(--text)' }}>
                {loading ? 'Starting trial…' : 'Start 7-day free trial'}
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text3)', marginTop: 3 }}>Full access for 7 days, then activation required</div>
            </div>
            <ArrowRight size={isMobile ? 16 : 18} color="var(--text3)" />
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text3)', fontSize: 11 }}>
            Licensed software · Engr. Hamza Asad
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
