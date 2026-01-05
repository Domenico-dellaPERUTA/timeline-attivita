// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Progetto } from '@/lib/db';

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function Home() {
  const [progetti, setProgetti] = useState<Progetto[]>([]);
  const [filtri, setFiltri] = useState({ societa: '', cliente: '', anno: '' });
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [selectedProgetto, setSelectedProgetto] = useState<Progetto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
    fetchProgetti();
  }, []);

  const fetchFilterOptions = async () => {
    const res = await fetch('/api/filters');
    const data = await res.json();
    setFilterOptions(data);
  };

  const fetchProgetti = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtri.societa) params.append('societa', filtri.societa);
    if (filtri.cliente) params.append('cliente', filtri.cliente);
    if (filtri.anno) params.append('anno', filtri.anno);

    const res = await fetch(`/api/progetti?${params}`);
    const data = await res.json();
    setProgetti(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo progetto?')) return;
    
    await fetch(`/api/progetti/${id}`, { method: 'DELETE' });
    fetchProgetti();
  };

  const formatPeriodo = (p: Progetto) => {
    const inizio = `${MESI[p.mese_inizio - 1]} ${p.anno_inizio}`;
    const fine = p.anno_fine && p.mese_fine ? `${MESI[p.mese_fine - 1]} ${p.anno_fine}` : 'In corso';
    return `${inizio} - ${fine}`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Timeline Attività Professionali</h1>
        <button onClick={() => { setSelectedProgetto(null); setShowForm(true); }} style={styles.addButton}>
          + Nuovo Progetto
        </button>
      </header>

      <div style={styles.filters}>
        <select value={filtri.societa} onChange={(e) => setFiltri({...filtri, societa: e.target.value})} style={styles.select}>
          <option value="">Tutte le Società</option>
          {filterOptions.societa?.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <select value={filtri.cliente} onChange={(e) => setFiltri({...filtri, cliente: e.target.value})} style={styles.select}>
          <option value="">Tutti i Clienti</option>
          {filterOptions.clienti?.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filtri.anno} onChange={(e) => setFiltri({...filtri, anno: e.target.value})} style={styles.select}>
          <option value="">Tutti gli Anni</option>
          {filterOptions.anni?.map((a: number) => <option key={a} value={a}>{a}</option>)}
        </select>

        <button onClick={fetchProgetti} style={styles.filterButton}>Applica Filtri</button>
        <button onClick={() => { setFiltri({ societa: '', cliente: '', anno: '' }); }} style={styles.resetButton}>Reset</button>
      </div>

      {loading ? (
        <div style={styles.loading}>Caricamento...</div>
      ) : (
        <div style={styles.timeline}>
          {progetti.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{p.nome}</h3>
                <div style={styles.cardActions}>
                  <button onClick={() => { setSelectedProgetto(p); setShowForm(true); }} style={styles.editBtn}>✏️</button>
                  <button onClick={() => handleDelete(p.id!)} style={styles.deleteBtn}>🗑️</button>
                </div>
              </div>
              
              <div style={styles.cardMeta}>
                <span style={styles.badge}>{p.societa}</span>
                <span style={styles.badge}>{p.cliente}</span>
                {p.impegno_saltuario && <span style={{...styles.badge, ...styles.saltuario}}>Saltuario</span>}
              </div>

              <p style={styles.periodo}>{formatPeriodo(p)}</p>
              <p style={styles.tech}><strong>Tech:</strong> {p.tecnologia}</p>
              <p style={styles.description}>{p.descrizione}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && <ProgettoForm progetto={selectedProgetto} onClose={() => { setShowForm(false); fetchProgetti(); }} />}
    </div>
  );
}

function ProgettoForm({ progetto, onClose }: { progetto: Progetto | null; onClose: () => void }) {
  const [form, setForm] = useState<Progetto>(progetto || {
    nome: '', societa: '', cliente: '', tecnologia: '', descrizione: '',
    anno_inizio: new Date().getFullYear(), mese_inizio: new Date().getMonth() + 1,
    anno_fine: null, mese_fine: null, impegno_saltuario: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const method = progetto?.id ? 'PUT' : 'POST';
    const url = progetto?.id ? `/api/progetti/${progetto.id}` : '/api/progetti';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    onClose();
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2>{progetto ? 'Modifica Progetto' : 'Nuovo Progetto'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input type="text" placeholder="Nome Progetto" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required style={styles.input} />
          <input type="text" placeholder="Società" value={form.societa} onChange={(e) => setForm({...form, societa: e.target.value})} required style={styles.input} />
          <input type="text" placeholder="Cliente" value={form.cliente} onChange={(e) => setForm({...form, cliente: e.target.value})} required style={styles.input} />
          <input type="text" placeholder="Tecnologia" value={form.tecnologia} onChange={(e) => setForm({...form, tecnologia: e.target.value})} required style={styles.input} />
          <textarea placeholder="Descrizione" value={form.descrizione} onChange={(e) => setForm({...form, descrizione: e.target.value})} required style={styles.textarea} />
          
          <div style={styles.row}>
            <input type="number" placeholder="Anno Inizio" value={form.anno_inizio} onChange={(e) => setForm({...form, anno_inizio: parseInt(e.target.value)})} required style={styles.inputSmall} />
            <select value={form.mese_inizio} onChange={(e) => setForm({...form, mese_inizio: parseInt(e.target.value)})} required style={styles.inputSmall}>
              {MESI.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <input type="number" placeholder="Anno Fine (opzionale)" value={form.anno_fine || ''} onChange={(e) => setForm({...form, anno_fine: e.target.value ? parseInt(e.target.value) : null})} style={styles.inputSmall} />
            <select value={form.mese_fine || ''} onChange={(e) => setForm({...form, mese_fine: e.target.value ? parseInt(e.target.value) : null})} style={styles.inputSmall}>
              <option value="">-</option>
              {MESI.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <label style={styles.checkbox}>
            <input type="checkbox" checked={form.impegno_saltuario} onChange={(e) => setForm({...form, impegno_saltuario: e.target.checked})} />
            Impegno Saltuario
          </label>

          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn}>Salva</button>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Annulla</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: any = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' },
  addButton: { padding: '12px 24px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' },
  filters: { display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', flex: '1', minWidth: '150px' },
  filterButton: { padding: '10px 20px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  resetButton: { padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' },
  timeline: { display: 'grid', gap: '20px' },
  card: { backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' },
  cardTitle: { fontSize: '20px', fontWeight: '600', color: '#1a1a1a', margin: '0' },
  cardActions: { display: 'flex', gap: '8px' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  cardMeta: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
  badge: { padding: '4px 12px', backgroundColor: '#e3f2fd', color: '#0066cc', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  saltuario: { backgroundColor: '#fff3e0', color: '#f57c00' },
  periodo: { fontSize: '14px', color: '#666', marginBottom: '8px' },
  tech: { fontSize: '14px', color: '#333', marginBottom: '8px' },
  description: { fontSize: '14px', color: '#666', lineHeight: '1.5' },
  modal: { position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  inputSmall: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', flex: '1' },
  textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', minHeight: '100px', resize: 'vertical' },
  row: { display: 'flex', gap: '10px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  formActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  saveBtn: { flex: '1', padding: '12px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  cancelBtn: { flex: '1', padding: '12px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }
};
