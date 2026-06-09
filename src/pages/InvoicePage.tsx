import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, MessageCircle } from 'lucide-react';
import { Sale } from '../types';
import { money, formatDate } from '../utils';
import { useApp } from '../context/AppContext';

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { settings, toast } = useApp();

  const [sale, setSale]             = useState<Sale | null>(null);
  const [invoicePath, setInvoicePath] = useState<string>('');
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  const shop = settings?.shop;

  useEffect(() => {
    (async () => {
      const s = await window.api.sales.getById(Number(id));
      setSale(s);
      // Generate PDF if not already generated
      try {
        setGenerating(true);
        const inv = await window.api.invoice.generate(Number(id));
        setInvoicePath(inv.path);
      } catch(e) {
        // PDF already exists or failed
      } finally {
        setGenerating(false);
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => window.print();

  const handleSave = async () => {
    if (!invoicePath) return;
    const dest = await window.api.dialog.saveFile({
      defaultPath: `${sale?.invoice_number}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!dest) return;
    try {
      const res = await window.api.files.copy(invoicePath, dest);
      if (res.ok) {
        toast('Invoice saved!');
        await window.api.shell.openPath(dest);
      } else {
        toast(res.error || 'Failed to save invoice', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Failed to save invoice', 'error');
    }
  };

  const handleWhatsApp = async () => {
    if (!sale) return;
    const template = settings?.whatsappTemplate || `السلام علیکم\n\nآپ کا خریداری انوائس منسلک ہے۔\n\nشکریہ\n${shop?.name || 'Mobile Shop'}`;
    const phone = sale.customer_mobile?.replace(/[^0-9]/g, '').replace(/^0/, '92') || '';
    await window.api.whatsapp.share(invoicePath, phone, template);
    toast('Opening WhatsApp…');
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div className="loading-spinner" style={{ width:32, height:32 }}/>
    </div>
  );

  if (!sale) return <div>Sale not found</div>;

  const terms = settings?.invoiceTerms || '';
  const footer = settings?.invoiceFooter || 'Thank you for your purchase!';

  return (
    <div className="fade-in">
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }} className="no-print">
        <button className="btn btn-ghost" onClick={()=>nav('/sales?tab=history')}><ArrowLeft size={14}/> Back</button>
        <div style={{ flex:1 }}/>
        {generating && <span style={{ fontSize:12, color:'var(--text3)' }}>Generating PDF…</span>}
        <button className="btn btn-ghost" onClick={handlePrint}><Printer size={14}/>Print</button>
        <button className="btn btn-ghost" onClick={handleSave} disabled={!invoicePath}><Download size={14}/>Save PDF</button>
        <button className="btn btn-success" onClick={handleWhatsApp}><MessageCircle size={14}/>Share on WhatsApp</button>
      </div>

      {/* Invoice Card */}
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div id="invoice-print" style={{
          background:'#fff', borderRadius:12, overflow:'hidden',
          boxShadow:'0 8px 40px rgba(0,0,0,0.15)', fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#6c63ff,#a78bfa)', padding:'24px 28px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{shop?.name || 'Mobile Shop'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:4 }}>{shop?.address || ''}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>
                {shop?.mobile && `Tel: ${shop.mobile}`}
                {shop?.whatsapp && ` · WA: ${shop.whatsapp}`}
              </div>
            </div>
            <div style={{ textAlign:'right', background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'12px 16px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:600, letterSpacing:'.1em' }}>INVOICE</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginTop:2 }}>{sale.invoice_number}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:4 }}>{formatDate(sale.sale_date)}</div>
            </div>
          </div>

          <div style={{ padding:'24px 28px' }}>
            {/* Customer + Device */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <InfoBox title="CUSTOMER">
                <strong style={{ fontSize:15 }}>{sale.customer}</strong>
                <div style={{ color:'#666', fontSize:12, marginTop:3 }}>{sale.customer_mobile}</div>
                {sale.customer_cnic && <div style={{ color:'#666', fontSize:12 }}>CNIC: {sale.customer_cnic}</div>}
                {sale.customer_address && <div style={{ color:'#666', fontSize:12 }}>{sale.customer_address}</div>}
              </InfoBox>
              <InfoBox title="DEVICE">
                <strong style={{ fontSize:15 }}>{sale.brand} {sale.model}</strong>
                <div style={{ color:'#666', fontSize:12, marginTop:3 }}>{sale.storage} · {sale.color}</div>
                <div style={{ marginTop:6 }}>
                  <span style={{ background: sale.pta_status==='pta'?'#e8fdf4':'#fff3f3', color: sale.pta_status==='pta'?'#16a362':'#e03c3c', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                    {sale.pta_status==='pta'?'PTA Approved': sale.pta_status==='non_pta'?'Non PTA': sale.pta_status?.toUpperCase()}
                  </span>
                </div>
              </InfoBox>
            </div>

            {/* IMEI Section */}
            <SectionCard title="DEVICE DETAILS">
              <Row label="IMEI 1" value={sale.imei1 || '—'} mono/>
              <Row label="IMEI 2" value={sale.imei2 || 'N/A'} mono/>
              <Row label="Battery Health" value={sale.battery_health || 'N/A'}/>
              <Row label="Face ID"    value={sale.face_id || 'N/A'}/>
              <Row label="True Tone"  value={sale.true_tone || 'N/A'}/>
              <Row label="SIM Lock"   value={sale.sim_lock || 'N/A'}/>
            </SectionCard>

            {/* Financial Section */}
            <SectionCard title="PAYMENT DETAILS">
              <Row label="Sale Price" value={money(sale.sale_price)}/>
              {sale.discount > 0 && <Row label="Discount" value={`- ${money(sale.discount)}`} valueColor="#e03c3c"/>}
              <div style={{ borderTop:'2px solid #6c63ff', marginTop:6, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <strong style={{ fontSize:15 }}>Total Amount</strong>
                <strong style={{ fontSize:20, color:'#6c63ff' }}>{money(sale.final_amount)}</strong>
              </div>
            </SectionCard>

            {/* Warranty */}
            {terms && (
              <div style={{ background:'#f8f7ff', border:'1px solid #e0ddff', borderRadius:8, padding:'12px 16px', marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', color:'#6c63ff', marginBottom:6 }}>WARRANTY / TERMS & CONDITIONS</div>
                <div style={{ fontSize:13, color:'#555', direction:'rtl', textAlign:'right', lineHeight:1.8 }}>{terms}</div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, marginTop:24, marginBottom:16 }}>
              <div style={{ borderTop:'1px solid #ddd', paddingTop:8, textAlign:'center', fontSize:11, color:'#999' }}>Customer Signature</div>
              <div style={{ borderTop:'1px solid #ddd', paddingTop:8, textAlign:'center', fontSize:11, color:'#999' }}>Shop Signature</div>
            </div>

            {/* Footer */}
            <div style={{ textAlign:'center', fontSize:12, color:'#fff', background:'#6c63ff', margin:'-0px -28px -24px', padding:'12px 28px', marginLeft:-28, marginRight:-28, marginBottom:-24 }}>
              {footer}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #invoice-print { box-shadow: none; }
        }
      `}</style>
    </div>
  );
};

const InfoBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background:'#f8f7ff', borderRadius:8, padding:'14px 16px' }}>
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'#6c63ff', marginBottom:8 }}>{title}</div>
    {children}
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'#999', marginBottom:8 }}>{title}</div>
    <div style={{ border:'1px solid #eee', borderRadius:8, overflow:'hidden' }}>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean; valueColor?: string }> = ({ label, value, mono, valueColor }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid #f0f0f0', fontSize:13 }}>
    <span style={{ color:'#666' }}>{label}</span>
    <span style={{ fontFamily: mono ? 'monospace' : 'inherit', fontWeight:500, color: valueColor || '#111' }}>{value}</span>
  </div>
);

export default InvoicePage;
