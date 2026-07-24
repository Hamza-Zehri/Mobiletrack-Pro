import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { RegisterSummary } from '../../types';

const money = (v: number) => `₨ ${(v || 0).toLocaleString()}`;

interface Props {
  summary: RegisterSummary;
  onClose: () => void;
}

const SLIDE_INTERVAL = 5000;

const XReportSlideshow: React.FC<Props> = ({ summary, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const totalSlides = 2 + summary.sales.length; // summary + sales + closing
  const maxSlide = totalSlides - 1;

  const next = useCallback(() => {
    setCurrentSlide(s => (s >= maxSlide ? 0 : s + 1));
  }, [maxSlide]);

  const prev = useCallback(() => {
    setCurrentSlide(s => (s <= 0 ? maxSlide : s - 1));
  }, [maxSlide]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const s = summary.session;
  const topSellers = summary.sales.reduce((acc: Record<string, number>, sale) => {
    const key = `${sale.brand} ${sale.model}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topList = Object.entries(topSellers).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const profit = summary.totalSales - summary.totalReturns;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: '#0a0c14',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: '#fff', width: 40, height: 40, borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={20} />
      </button>

      {/* Slide content */}
      <div style={{ width: '100%', maxWidth: 800, padding: '0 60px' }}>
        {currentSlide === 0 && (
          <SlideIn>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                X Report
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {s.session_date}
              </div>
              <div style={{ fontSize: 14, color: '#8b93ac', marginBottom: 32 }}>
                {s.created_at?.slice(11, 16)} — {s.closed_at?.slice(11, 16) || 'Open'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <SummaryTile label="Opening" value={money(s.opening_balance)} color="#8b83ff" />
                <SummaryTile label="Total Sales" value={money(summary.totalSales)} color="#22c97a" />
                <SummaryTile label="Returns" value={money(summary.totalReturns)} color="#ff5e5e" />
                <SummaryTile label="Net Received" value={money(summary.totalReceived)} color="#3b9eff" />
              </div>
            </div>
          </SlideIn>
        )}

        {currentSlide > 0 && currentSlide <= summary.sales.length && (
          <SlideIn>
            <SaleSlide sale={summary.sales[currentSlide - 1]} index={currentSlide} total={summary.sales.length} />
          </SlideIn>
        )}

        {currentSlide === maxSlide && summary.sales.length > 0 && (
          <SlideIn>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Closing Summary
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 28 }}>
                Day Complete
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <SummaryTile label="Items Sold" value={String(summary.salesCount)} color="#22c97a" />
                <SummaryTile label="Revenue" value={money(summary.totalSales)} color="#3b9eff" />
                <SummaryTile label="Profit" value={money(profit)} color={profit >= 0 ? '#22c97a' : '#ff5e5e'} />
              </div>

              {topList.length > 0 && (
                <div style={{ textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
                  <div style={{ fontSize: 11, color: '#8b93ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 600 }}>
                    Top Selling Phones
                  </div>
                  {topList.map(([name, count], i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 14px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)', marginBottom: 4,
                    }}>
                      <span style={{ color: '#e8eaf0', fontSize: 14, fontWeight: 500 }}>{name}</span>
                      <span style={{ color: '#22c97a', fontSize: 14, fontWeight: 700 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SlideIn>
        )}
      </div>

      {/* Nav arrows */}
      <button onClick={prev} style={{
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e8eaf0', width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ChevronLeft size={22} />
      </button>
      <button onClick={next} style={{
        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e8eaf0', width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ChevronRight size={22} />
      </button>

      {/* Progress dots */}
      <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 6 }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} style={{
            width: i === currentSlide ? 24 : 8, height: 8,
            borderRadius: 4, transition: 'all 0.3s',
            background: i === currentSlide ? '#6c63ff' : 'rgba(255,255,255,0.15)',
          }} />
        ))}
      </div>

      {/* Paused indicator */}
      {paused && (
        <div style={{ position: 'absolute', bottom: 50, fontSize: 11, color: '#555d78' }}>
          Paused
        </div>
      )}
    </div>
  );
};

const SlideIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ animation: 'slideIn 0.4s ease both' }}>
    {children}
    <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: none; } }`}</style>
  </div>
);

const SummaryTile: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '18px 14px',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{ fontSize: 10, color: '#8b93ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
  </div>
);

const SaleSlide: React.FC<{ sale: any; index: number; total: number }> = ({ sale, index, total }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 11, color: '#8b93ac', marginBottom: 6, fontWeight: 600 }}>
      Sale {index} of {total}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
      {sale.brand} {sale.model}
    </div>
    <div style={{ fontSize: 13, color: '#8b93ac', marginBottom: 24 }}>
      {sale.imei1}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <SummaryTile label="Invoice" value={sale.invoice_number || '—'} color="#8b83ff" />
      <SummaryTile label="Amount" value={money(sale.final_amount)} color="#22c97a" />
      <SummaryTile label="Profit" value={money(sale.profit)} color={sale.profit >= 0 ? '#22c97a' : '#ff5e5e'} />
    </div>

    <div style={{
      marginTop: 20, padding: '12px 20px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)', display: 'inline-block',
    }}>
      <div style={{ fontSize: 11, color: '#8b93ac', marginBottom: 4, fontWeight: 600 }}>Customer</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>{sale.customer || '—'}</div>
      <div style={{ fontSize: 12, color: '#8b93ac' }}>{sale.customer_mobile || ''}</div>
    </div>

    <div style={{ marginTop: 12, fontSize: 12, color: '#555d78' }}>
      {sale.sale_date?.slice(11, 16)}
    </div>
  </div>
);

export default XReportSlideshow;
