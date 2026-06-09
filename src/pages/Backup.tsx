import React, { useEffect, useState } from 'react';
import { UploadCloud, DownloadCloud, Clock, CheckCircle, AlertCircle, FolderOpen, Trash2 } from 'lucide-react';
import { BackupFile, BackupSettings } from '../types';
import { formatDateTime } from '../utils';
import { Confirm } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const Backup: React.FC = () => {
  const { toast } = useApp();
  const [backups,  setBackups]  = useState<BackupFile[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({ enabled:true, frequency:'daily', time:'06:00', backup_folder:'', last_backup_at:'' });
  const [creating,  setCreating]  = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string|null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const list = await window.api.backup.list();
    setBackups(list);
    const cfg = await window.api.backup.settings.get();
    if (cfg) setSettings({ ...cfg, enabled: !!cfg.enabled });
  };

  const handleCreate = async () => {
    const dest = await window.api.dialog.saveFile({
      defaultPath: `backup_${new Date().toISOString().slice(0,10)}.shopbackup`,
      filters: [{ name: 'Shop Backup', extensions: ['shopbackup'] }],
    });
    if (!dest) return;
    setCreating(true);
    try {
      const res = await window.api.backup.create(dest);
      toast(`Backup saved: ${res.filename}`);
      load();
    } catch(e: any) {
      toast(e.message || 'Backup failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filePath?: string) => {
    let src = filePath;
    if (!src) {
      src = await window.api.dialog.openFile({
        filters: [{ name: 'Shop Backup', extensions: ['shopbackup'] }],
        properties: ['openFile'],
      }) || undefined;
    }
    if (!src) return;
    setConfirmRestore(src);
  };

  const doRestore = async () => {
    if (!confirmRestore) return;
    setRestoring(true);
    setConfirmRestore(null);
    try {
      const res = await window.api.backup.restore(confirmRestore);
      toast(res.message || 'Restore complete. Please restart.');
    } catch(e: any) {
      toast(e.message || 'Restore failed', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await window.api.backup.settings.save(settings);
    toast('Backup settings saved');
    setSaving(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  };

  const lastBackup = settings.last_backup_at;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Backup & Restore</h1>
      </div>

      {/* Status Banner */}
      <div style={{ background: lastBackup ? 'var(--green-bg)' : 'var(--amber-bg)', border:`1px solid ${lastBackup?'rgba(34,201,122,.25)':'rgba(245,166,35,.25)'}`, borderRadius:'var(--r)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        {lastBackup
          ? <CheckCircle size={24} color="var(--green)"/>
          : <AlertCircle size={24} color="var(--amber)"/>
        }
        <div>
          <div style={{ fontSize:14, fontWeight:700, color: lastBackup?'var(--green)':'var(--amber)' }}>
            {lastBackup ? 'Last backup successful' : 'No backup found'}
          </div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
            {lastBackup ? `${formatDateTime(lastBackup)}` : 'Create your first backup to protect your data'}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Manual Backup */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <UploadCloud size={20} color="var(--accent2)"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>Create Backup</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Save encrypted .shopbackup file</div>
            </div>
          </div>
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
            Creates a fully encrypted <strong>.shopbackup</strong> file containing your database, all phone images, invoices, logo, and settings.
          </p>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
            onClick={handleCreate} disabled={creating}>
            <UploadCloud size={15}/>
            {creating ? 'Creating Backup…' : 'Create Backup Now'}
          </button>
        </div>

        {/* Restore */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--green-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <DownloadCloud size={20} color="var(--green)"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>Restore Backup</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Recover from a .shopbackup file</div>
            </div>
          </div>
          <div className="upload-zone" style={{ marginBottom:14, cursor:'pointer' }} onClick={()=>handleRestore()}>
            <FolderOpen size={24} color="var(--text3)" style={{ display:'block', margin:'0 auto 8px' }}/>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Click to select .shopbackup file</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>This will replace ALL current data</div>
          </div>
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }}
            onClick={()=>handleRestore()} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Select & Restore Backup'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Auto Backup Settings */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--amber-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Clock size={20} color="var(--amber)"/>
            </div>
            <div style={{ fontSize:14, fontWeight:700 }}>Auto Backup Settings</div>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--surface2)', borderRadius:'var(--r2)', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Enable Auto Backup</span>
            <label style={{ position:'relative', display:'inline-block', width:42, height:24, cursor:'pointer' }}>
              <input type="checkbox" checked={settings.enabled} onChange={e=>setSettings(s=>({...s,enabled:e.target.checked}))} style={{ opacity:0, width:0, height:0 }}/>
              <span style={{ position:'absolute', inset:0, background: settings.enabled?'var(--accent)':'var(--border2)', borderRadius:24, transition:'background .2s' }}/>
              <span style={{ position:'absolute', left: settings.enabled?'20px':'2px', top:2, width:20, height:20, background:'#fff', borderRadius:'50%', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
            </label>
          </div>

          <div className="form-grid cols-2" style={{ gap:12, marginBottom:14 }}>
            <div className="field">
              <label>Frequency</label>
              <select value={settings.frequency} onChange={e=>setSettings(s=>({...s,frequency:e.target.value as any}))}>
                <option value="daily">Daily (Recommended)</option>
                <option value="every6h">Every 6 Hours</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
            <div className="field">
              <label>Backup Time</label>
              <input type="time" value={settings.time} onChange={e=>setSettings(s=>({...s,time:e.target.value}))}/>
            </div>
            <div className="field" style={{ gridColumn:'span 2' }}>
              <label>Backup Folder</label>
              <input value={settings.backup_folder||''} onChange={e=>setSettings(s=>({...s,backup_folder:e.target.value}))} placeholder="C:\MobileShop\Backups"/>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
            onClick={handleSaveSettings} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>

        {/* Backup History */}
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Backup History</div>
          {backups.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)', fontSize:13 }}>No backups found in default folder</div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {backups.map((b, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)' }}>
                <UploadCloud size={14} color="var(--accent2)" style={{ flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.filename}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{formatDateTime(b.mtime)} · {formatSize(b.size)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>handleRestore(b.path)} style={{ flexShrink:0, fontSize:11 }}>Restore</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Confirm
        open={confirmRestore !== null}
        title="Restore Backup"
        message="This will replace ALL current data with the backup. This cannot be undone. The application will need to restart after restore."
        confirmLabel="Yes, Restore"
        danger
        onConfirm={doRestore}
        onCancel={()=>setConfirmRestore(null)}
      />
    </div>
  );
};

export default Backup;
