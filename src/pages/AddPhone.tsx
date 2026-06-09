import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Smartphone, Shield, Cpu, Package, DollarSign, User, Camera, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { PtaStatus } from '../types';
import { fileToBase64 } from '../utils';
import { SectionTitle } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const BRANDS = [
  'Apple','Samsung','Xiaomi','Redmi','Oppo','Infinix','Vivo','Realme',
  'Tecno','Google','OnePlus','Huawei','Nokia','Motorola','Other'
];

const IPHONE_MODELS = [
  // iPhone 17 series
  'iPhone 17 Pro Max','iPhone 17 Pro','iPhone 17 Air','iPhone 17',
  // iPhone 16 series
  'iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16 Plus','iPhone 16',
  // iPhone 15 series
  'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
  // iPhone 14 series
  'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
  // iPhone 13 series
  'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13','iPhone 13 mini',
  // iPhone SE 3rd gen
  'iPhone SE (2022)',
  // iPhone 12 series
  'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12','iPhone 12 mini',
  // iPhone SE 2nd gen
  'iPhone SE (2020)',
  // iPhone 11 series
  'iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11',
  // iPhone XS / XR
  'iPhone XS Max','iPhone XS','iPhone XR',
  // iPhone X
  'iPhone X',
  // iPhone 8 series
  'iPhone 8 Plus','iPhone 8',
  // iPhone 7 series
  'iPhone 7 Plus','iPhone 7',
  // iPhone SE 1st gen
  'iPhone SE',
  // iPhone 6s series
  'iPhone 6s Plus','iPhone 6s',
  // iPhone 6 series
  'iPhone 6 Plus','iPhone 6',
];

const ANDROID_MODELS: Record<string, string[]> = {
  Samsung: ['Galaxy S25 Ultra','Galaxy S25+','Galaxy S25','Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy A55','Galaxy A35','Galaxy A25','Galaxy A15','Galaxy A05','Galaxy F55','Galaxy M55','Galaxy M35','Galaxy Z Fold 6','Galaxy Z Flip 6'],
  Xiaomi:  ['Xiaomi 14 Ultra','Xiaomi 14 Pro','Xiaomi 14','Xiaomi 13 Ultra','Xiaomi 13 Pro','Xiaomi 13','Xiaomi 12 Pro','Xiaomi 12','Xiaomi 11T Pro','Xiaomi 11T'],
  Redmi:   ['Redmi Note 14 Pro+','Redmi Note 14 Pro','Redmi Note 14','Redmi Note 13 Pro+','Redmi Note 13 Pro','Redmi Note 13','Redmi 14C','Redmi 13C','Redmi 12','Redmi A3','Redmi A2+','Redmi A2'],
  Oppo:    ['Oppo Find X8 Pro','Oppo Find X8','Oppo Reno 12 Pro','Oppo Reno 12','Oppo Reno 11 Pro','Oppo Reno 11','Oppo Reno 10 Pro','Oppo Reno 10','Oppo A3 Pro','Oppo A3','Oppo A79','Oppo A58','Oppo A38','Oppo A18'],
  Infinix: ['Infinix Note 40 Pro+','Infinix Note 40 Pro','Infinix Note 40','Infinix Note 30 Pro','Infinix Note 30','Infinix Hot 40 Pro','Infinix Hot 40','Infinix Hot 30','Infinix Smart 8','Infinix Zero 30 5G','Infinix Zero Ultra'],
  Vivo:    ['Vivo X200 Pro','Vivo X200','Vivo V40 Pro','Vivo V40','Vivo V30 Pro','Vivo V30','Vivo Y300 Pro','Vivo Y300','Vivo Y200','Vivo Y100','Vivo Y28','Vivo Y18','Vivo Y16'],
  Realme:  ['Realme GT 6','Realme GT 5','Realme 12 Pro+','Realme 12 Pro','Realme 12','Realme 11 Pro+','Realme 11 Pro','Realme 11','Realme C65','Realme C53','Realme C35','Realme Narzo 70 Pro'],
  Tecno:   ['Tecno Phantom X2 Pro','Tecno Phantom X2','Tecno Camon 30 Pro','Tecno Camon 30','Tecno Spark 20 Pro','Tecno Spark 20','Tecno Spark 10 Pro','Tecno Pop 8'],
  Google:  ['Pixel 9 Pro XL','Pixel 9 Pro','Pixel 9','Pixel 8 Pro','Pixel 8','Pixel 7 Pro','Pixel 7','Pixel 6 Pro','Pixel 6'],
  OnePlus: ['OnePlus 13','OnePlus 12','OnePlus 11','OnePlus Nord 4','OnePlus Nord CE 4','OnePlus Nord CE 3 Lite','OnePlus 10 Pro'],
  Huawei:  ['Huawei Mate 60 Pro','Huawei Mate 60','Huawei Nova 12 Pro','Huawei Nova 12','Huawei P60 Pro','Huawei P60','Huawei Y9s'],
  Nokia:   ['Nokia X30','Nokia G42','Nokia G22','Nokia C32','Nokia C22','Nokia 5710'],
  Motorola:['Motorola Edge 50 Pro','Motorola Edge 50','Motorola Moto G85','Motorola Moto G54','Motorola Moto G34','Motorola Moto E14'],
};

const STORAGE = ['32GB','64GB','128GB','256GB','512GB','1TB'];
const PTA_OPTIONS: { value: PtaStatus; label: string }[] = [
  { value:'pta',      label:'PTA Approved' },
  { value:'non_pta',  label:'Non PTA' },
  { value:'jv',       label:'JV' },
  { value:'cpid',     label:'CPID' },
  { value:'unlocked', label:'Factory Unlocked' },
];

const EMPTY: any = {
  brand:'Apple', model:'iPhone 15 Pro Max', color:'', storage:'128GB',
  pta_status:'pta', battery_health:'', face_id:'Working', true_tone:'Working', sim_lock:'Unlocked',
  imei1:'', imei2:'', box:false, charger:false, cable:false, earphones:false,
  cost_price:'', sale_price:'', notes:'',
  purchase_type:'customer', customer_name:'', customer_mobile:'', customer_cnic:'',
  supplier_name:'', supplier_mobile:'', market_name:'Saddar Mobile Market', purchase_date: new Date().toISOString().slice(0,10),
};

const AddPhone: React.FC = () => {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { toast } = useApp();

  const [form, setForm]   = useState<any>({ ...EMPTY });
  const [errors, setErrors] = useState<any>({});
  const [images, setImages] = useState<{ preview:string; b64:string; name:string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [imeiError, setImeiError] = useState('');

  useEffect(() => {
    if (isEdit) {
      window.api.phones.getById(Number(id)).then(p => {
        if (p) setForm({ ...EMPTY, ...p, purchase_type: 'customer', cost_price: p.cost_price, sale_price: p.sale_price || '', purchase_date: EMPTY.purchase_date });
      });
    }
  }, [id, isEdit]);

  const set = (k: string, v: any) => { setForm((f: any) => ({ ...f, [k]: v })); setErrors((e: any) => ({ ...e, [k]: '' })); };

  const checkImei = async (imei: string) => {
    if (!imei || imei.length < 15) return;
    const dup = await window.api.phones.checkImei(imei, isEdit ? Number(id) : undefined);
    if (dup) setImeiError('This IMEI already exists in inventory.');
    else setImeiError('');
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const b64 = await fileToBase64(file);
      setImages(prev => [...prev, { preview: `data:${file.type};base64,${b64}`, b64, name: `phone_${Date.now()}_${file.name}` }]);
    }
  };

  const validate = () => {
    const e: any = {};
    if (!form.brand)      e.brand = 'Required';
    if (!form.model)      e.model = 'Required';
    if (!form.imei1 || form.imei1.length < 15) e.imei1 = 'Valid 15-digit IMEI required';
    if (!form.cost_price) e.cost_price = 'Required';
    if (imeiError)        e.imei1 = imeiError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Save images first
      const savedPaths: string[] = [];
      for (const img of images) {
        const p = await window.api.images.save(img.b64, img.name);
        savedPaths.push(p);
      }

      const payload = {
        ...form,
        cost_price: parseFloat(form.cost_price) || 0,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        images: savedPaths,
      };

      if (isEdit) {
        await window.api.phones.update(Number(id), payload);
        toast('Phone updated successfully');
      } else {
        // Create purchase + phone together
        if (form.purchase_type === 'customer') {
          await window.api.purchases.add({ type:'customer', customer_name:form.customer_name, customer_mobile:form.customer_mobile, customer_cnic:form.customer_cnic, purchase_date:form.purchase_date, cost_price:payload.cost_price, phone:payload });
        } else {
          await window.api.purchases.add({ type:'bulk', supplier_name:form.supplier_name, supplier_mobile:form.supplier_mobile, market_name:form.market_name, purchase_date:form.purchase_date, cost_price:payload.cost_price, phone:payload });
        }
        toast('Phone added to inventory!');
      }
      nav('/inventory');
    } catch(e: any) {
      toast(e.message || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  const models = form.brand === 'Apple'
    ? IPHONE_MODELS
    : (ANDROID_MODELS[form.brand] || []);

  const listId = `models-${form.brand.replace(/\s+/g,'-')}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>nav('/inventory')}><ArrowLeft size={14}/></button>
          <h1 className="page-title">{isEdit ? 'Edit Phone' : 'Add Phone to Inventory'}</h1>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={15}/>{loading ? 'Saving…' : 'Save to Inventory'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Device Info */}
          <div className="card">
            <SectionTitle icon={<Smartphone size={15}/>}>Device Information</SectionTitle>
            <div className="form-grid cols-3">
              <div className={`field${errors.brand?' error':''}`}><label>Brand *</label>
                <input
                  list="brand-list"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="Type or select brand"
                />
                <datalist id="brand-list">
                  {BRANDS.map(b => <option key={b} value={b}/>)}
                </datalist>
              </div>
              <div className={`field${errors.model?' error':''}`} style={{ gridColumn:'span 2' }}><label>Model *</label>
                <input
                  list={listId}
                  value={form.model}
                  onChange={e => set('model', e.target.value)}
                  placeholder="Type or select model"
                />
                {models.length > 0 && (
                  <datalist id={listId}>
                    {models.map(m => <option key={m} value={m}/>)}
                  </datalist>
                )}
              </div>
              <div className="field"><label>Color</label><input value={form.color} onChange={e=>set('color',e.target.value)} placeholder="e.g. Natural Titanium"/></div>
              <div className="field"><label>Storage</label>
                <select value={form.storage} onChange={e=>set('storage',e.target.value)}>{STORAGE.map(s=><option key={s}>{s}</option>)}</select>
              </div>
              <div className="field"><label>Battery Health</label><input value={form.battery_health} onChange={e=>set('battery_health',e.target.value)} placeholder="e.g. 92%"/></div>
            </div>

            <div className="divider"/>
            <SectionTitle icon={<Shield size={15}/>}>PTA Status</SectionTitle>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {PTA_OPTIONS.map(o => (
                <label key={o.value} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background: form.pta_status===o.value ? 'var(--accent-bg)' : 'var(--surface2)', border:`1px solid ${form.pta_status===o.value ? 'var(--accent)' : 'var(--border)'}`, borderRadius:'var(--r2)', cursor:'pointer', fontSize:13, transition:'all .15s' }}>
                  <input type="radio" name="pta" checked={form.pta_status===o.value} onChange={()=>set('pta_status',o.value)} style={{ accentColor:'var(--accent)' }}/>
                  {o.label}
                </label>
              ))}
            </div>

            <div className="divider"/>
            <SectionTitle icon={<Cpu size={15}/>}>Technical Details</SectionTitle>
            <div className="form-grid cols-3">
              <div className="field"><label>Face ID</label>
                <select value={form.face_id} onChange={e=>set('face_id',e.target.value)}>
                  <option>Working</option><option>Not Working</option><option>N/A</option>
                </select>
              </div>
              <div className="field"><label>True Tone</label>
                <select value={form.true_tone} onChange={e=>set('true_tone',e.target.value)}>
                  <option>Working</option><option>Not Working</option><option>N/A</option>
                </select>
              </div>
              <div className="field"><label>SIM Lock</label>
                <select value={form.sim_lock} onChange={e=>set('sim_lock',e.target.value)}>
                  <option>Unlocked</option><option>Locked</option>
                </select>
              </div>
              <div className={`field${errors.imei1?' error':''}`}>
                <label>IMEI 1 *</label>
                <input value={form.imei1} maxLength={15} onChange={e=>{set('imei1',e.target.value);}} onBlur={e=>checkImei(e.target.value)} placeholder="15-digit IMEI"/>
                {(errors.imei1||imeiError) && <span className="err-msg"><AlertCircle size={11}/> {errors.imei1||imeiError}</span>}
              </div>
              <div className="field"><label>IMEI 2</label><input value={form.imei2} maxLength={15} onChange={e=>set('imei2',e.target.value)} placeholder="Optional"/></div>
            </div>
          </div>

          {/* Accessories */}
          <div className="card">
            <SectionTitle icon={<Package size={15}/>}>Accessories</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {([['box','Box Available'],['charger','Charger'],['cable','Cable'],['earphones','Earphones']] as [string,string][]).map(([k,l])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--surface2)', border:`1px solid ${form[k]?'var(--accent)':'var(--border)'}`, borderRadius:'var(--r2)', cursor:'pointer', transition:'all .15s' }}>
                  <input type="checkbox" checked={!!form[k]} onChange={e=>set(k,e.target.checked)} style={{ accentColor:'var(--accent)', width:15, height:15 }}/>
                  <span style={{ fontSize:13 }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Financial */}
          <div className="card">
            <SectionTitle icon={<DollarSign size={15}/>}>Financial Details</SectionTitle>
            <div className={`field${errors.cost_price?' error':''}`} style={{ marginBottom:12 }}>
              <label>Cost Price (₨) *</label>
              <input type="number" value={form.cost_price} onChange={e=>set('cost_price',e.target.value)} placeholder="0"/>
              {errors.cost_price && <span className="err-msg">{errors.cost_price}</span>}
            </div>
            <div className="field">
              <label>Expected Sale Price (₨)</label>
              <input type="number" value={form.sale_price} onChange={e=>set('sale_price',e.target.value)} placeholder="0"/>
            </div>
            {form.cost_price && form.sale_price && (
              <div style={{ marginTop:10, padding:'10px 12px', background:'var(--green-bg)', border:'1px solid rgba(34,201,122,.2)', borderRadius:8, fontSize:13 }}>
                Expected Profit: <strong style={{ color:'var(--green)' }}>₨ {(parseFloat(form.sale_price)-parseFloat(form.cost_price)).toLocaleString('en-PK')}</strong>
              </div>
            )}
          </div>

          {/* Purchase Source */}
          {!isEdit && (
            <div className="card">
              <SectionTitle icon={<User size={15}/>}>Purchased From</SectionTitle>
              <div className="field" style={{ marginBottom:12 }}>
                <label>Source Type</label>
                <select value={form.purchase_type} onChange={e=>set('purchase_type',e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="wholesaler">Wholesaler / Market</option>
                </select>
              </div>
              {form.purchase_type === 'customer'
                ? <>
                    <div className="field" style={{ marginBottom:10 }}><label>Customer Name</label><input value={form.customer_name} onChange={e=>set('customer_name',e.target.value)} placeholder="Full name"/></div>
                    <div className="field" style={{ marginBottom:10 }}><label>Mobile</label><input value={form.customer_mobile} onChange={e=>set('customer_mobile',e.target.value)} placeholder="03XX XXXXXXX"/></div>
                    <div className="field" style={{ marginBottom:10 }}><label>CNIC</label><input value={form.customer_cnic} onChange={e=>set('customer_cnic',e.target.value)} placeholder="XXXXX-XXXXXXX-X"/></div>
                  </>
                : <>
                    <div className="field" style={{ marginBottom:10 }}><label>Supplier Name</label><input value={form.supplier_name} onChange={e=>set('supplier_name',e.target.value)} placeholder="Supplier name"/></div>
                    <div className="field" style={{ marginBottom:10 }}><label>Mobile</label><input value={form.supplier_mobile} onChange={e=>set('supplier_mobile',e.target.value)} placeholder="03XX XXXXXXX"/></div>
                    <div className="field" style={{ marginBottom:10 }}><label>Market</label>
                      <select value={form.market_name} onChange={e=>set('market_name',e.target.value)}>
                        <option>Saddar Mobile Market</option><option>Star City Mall</option><option>Karachi Wholesale Market</option><option>Other</option>
                      </select>
                    </div>
                  </>
              }
              <div className="field"><label>Purchase Date</label><input type="date" value={form.purchase_date} onChange={e=>set('purchase_date',e.target.value)}/></div>
            </div>
          )}

          {/* Images */}
          <div className="card">
            <SectionTitle icon={<Camera size={15}/>}>Phone Images</SectionTitle>
            <label style={{ display:'block', cursor:'pointer' }}>
              <input type="file" multiple accept="image/*" style={{ display:'none' }} onChange={handleImages}/>
              <div className="upload-zone">
                <Camera size={24} color="var(--text3)" style={{ margin:'0 auto 8px', display:'block' }}/>
                <div style={{ fontSize:12, color:'var(--text2)' }}>Click to upload photos</div>
              </div>
            </label>
            {images.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
                {images.map((img,i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={img.preview} alt="" style={{ width:'100%', height:70, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)' }}/>
                    <button onClick={()=>setImages(prev=>prev.filter((_,j)=>j!==i))} style={{ position:'absolute', top:3, right:3, width:18, height:18, borderRadius:'50%', background:'var(--red)', border:'none', cursor:'pointer', color:'#fff', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <div className="field">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional notes about this phone…"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPhone;
