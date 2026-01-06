// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface Progetto {
  id?: number;
  nome: string;
  societa: string;
  cliente: string;
  tecnologia: string;
  descrizione: string;
  anno_inizio: number;
  mese_inizio: number;
  anno_fine: number | null;
  mese_fine: number | null;
  impegno_saltuario: boolean;
}

export default function Home() {
  const [progetti, setProgetti] = useState<Progetto[]>([]);
  const [filtri, setFiltri] = useState({ societa: '', cliente: '', anno: '' });
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [selectedProgetto, setSelectedProgetto] = useState<Progetto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

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
        <h1 style={styles.title}>Timeline - Attività Lavorativa</h1>
        <div style={styles.headerActions}>
          <div style={styles.viewToggle}>
            <button 
              onClick={() => setViewMode('list')} 
              style={{...styles.toggleBtn, ...(viewMode === 'list' ? styles.toggleBtnActive : {})}}
            >
              📋 Lista
            </button>
            <button 
              onClick={() => setViewMode('timeline')} 
              style={{...styles.toggleBtn, ...(viewMode === 'timeline' ? styles.toggleBtnActive : {})}}
            >
              📅 Timeline
            </button>
          </div>
          <button onClick={() => { setSelectedProgetto(null); setShowForm(true); }} style={styles.addButton}>
            + Nuovo Progetto
          </button>
        </div>
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
      ) : viewMode === 'list' ? (
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
      ) : (
        <TimelineCalendar 
          progetti={progetti} 
          onEdit={(p) => { setSelectedProgetto(p); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {showForm && <ProgettoForm progetto={selectedProgetto} onClose={() => { setShowForm(false); fetchProgetti(); }} />}
    </div>
  );
}

function TimelineCalendar({ progetti, onEdit, onDelete }: { 
  progetti: Progetto[]; 
  onEdit: (p: Progetto) => void;
  onDelete: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Calcola il range temporale
  const minAnno = Math.min(...progetti.map(p => p.anno_inizio));
  const maxAnno = Math.max(...progetti.map(p => p.anno_fine || new Date().getFullYear()));
  
  const anni = [];
  for (let anno = minAnno; anno <= maxAnno; anno++) {
    anni.push(anno);
  }

  // Colori per le società
  const coloriSocieta: {[key: string]: string} = {};
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const societa = Array.from(new Set(progetti.map(p => p.societa)));
  societa.forEach((s, i) => {
    coloriSocieta[s] = palette[i % palette.length];
  });

  // Funzione per calcolare la posizione e larghezza della barra
  const getBarPosition = (progetto: Progetto) => {
    const startMonth = (progetto.anno_inizio - minAnno) * 12 + progetto.mese_inizio - 1;
    const endMonth = progetto.anno_fine && progetto.mese_fine 
      ? (progetto.anno_fine - minAnno) * 12 + progetto.mese_fine - 1
      : (maxAnno - minAnno + 1) * 12 - 1;
    
    const monthWidth = 50; // larghezza fissa di ogni mese in px
    const left = startMonth * monthWidth;
    const width = (endMonth - startMonth + 1) * monthWidth;
    
    return { left: `${left}px`, width: `${width}px` };
  };

  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (startX - x) * 1.5; // velocità del drag
    scrollRef.current.scrollLeft = scrollLeft + walk;
    
    // Sincronizza tutte le righe
    const rows = document.querySelectorAll('.timeline-scrollable-row');
    rows.forEach(row => {
      (row as HTMLElement).scrollLeft = scrollRef.current!.scrollLeft;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      style={styles.timelineContainer}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header con gli anni - scrollabile */}
      <div style={styles.timelineHeaderWrapper}>
        <div style={styles.fixedColumns}>
          <div style={styles.fixedColumnHeader}>Progetto</div>
          <div style={styles.fixedColumnHeaderDesc}>Descrizione</div>
        </div>
        <div 
          style={styles.scrollableHeader} 
          ref={scrollRef}
          onScroll={(e) => {
            // Sincronizza lo scroll dell'header con tutte le righe
            const rows = document.querySelectorAll('.timeline-scrollable-row');
            rows.forEach(row => {
              (row as HTMLElement).scrollLeft = e.currentTarget.scrollLeft;
            });
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={styles.timelineGrid}>
            {anni.map(anno => (
              <div key={anno} style={styles.yearColumn}>
                <div style={styles.yearLabel}>{anno}</div>
                <div style={styles.monthsRow}>
                  {MESI.map(mese => (
                    <div key={mese} style={styles.monthLabel}>{mese}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Corpo con le barre dei progetti */}
      <div style={styles.timelineBodyWrapper}>
        {progetti.map((progetto, index) => {
          const position = getBarPosition(progetto);
          const isSelected = selectedBar === progetto.id;
          
          return (
            <div key={progetto.id} style={styles.timelineRowWrapper}>
              {/* Colonne fisse */}
              <div style={styles.fixedColumns}>
                <div style={styles.fixedColumnCell}>
                  <div style={styles.progettoNome}>{progetto.nome}</div>
                  <div style={styles.progettoCliente}>{progetto.cliente}</div>
                  <div style={styles.progettoActions}>
                    <button onClick={() => onEdit(progetto)} style={styles.smallBtn}>✏️</button>
                    <button onClick={() => onDelete(progetto.id!)} style={styles.smallBtn}>🗑️</button>
                  </div>
                </div>
                <div style={styles.fixedColumnCellDesc}>
                  <div style={styles.descrizioneTruncate}>{progetto.descrizione}</div>
                  <div style={styles.tecnologiaSmall}>
                    <strong>Tech:</strong> {progetto.tecnologia}
                  </div>
                </div>
              </div>
              
              {/* Area scrollabile con la timeline */}
              <div 
                className="timeline-scrollable-row"
                style={{
                  ...styles.scrollableRow,
                  ...(index === progetti.length - 1 ? {} : styles.scrollableRowHidden)
                }}
                onScroll={(e) => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                  // Sincronizza con le altre righe
                  const rows = document.querySelectorAll('.timeline-scrollable-row');
                  rows.forEach(row => {
                    if (row !== e.currentTarget) {
                      (row as HTMLElement).scrollLeft = e.currentTarget.scrollLeft;
                    }
                  });
                }}
                onMouseDown={handleMouseDown}
              >
                <div style={styles.timelineRowGrid}>
                  {/* Griglia di sfondo */}
                  <div style={styles.gridBackground}>
                    {anni.map(anno => (
                      <div key={anno} style={styles.yearGrid}>
                        {MESI.map((m, i) => (
                          <div key={i} style={styles.monthGrid}></div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  {/* Barra del progetto */}
                  <div 
                    style={{
                      ...styles.progettoBar,
                      ...position,
                      backgroundColor: coloriSocieta[progetto.societa],
                      ...(progetto.impegno_saltuario ? styles.barSaltuario : {}),
                      ...(isSelected ? styles.barSelected : {})
                    }}
                    onClick={() => setSelectedBar(isSelected ? null : progetto.id!)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-50%) scaleY(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(-50%) scaleY(1)';
                    }}
                  >
                    <div style={styles.barContent}>
                      <span style={styles.barText}>{progetto.societa}</span>
                    </div>
                  </div>

                  {/* Dettagli espandibili */}
                  {isSelected && (
                    <div style={styles.detailsPopup}>
                      <div style={styles.detailsContent}>
                        <div style={styles.detailsHeader}>
                          <h4 style={styles.detailsTitle}>{progetto.nome}</h4>
                          <button onClick={() => setSelectedBar(null)} style={styles.detailsCloseBtn}>✕</button>
                        </div>
                        <div style={styles.detailsMeta}>
                          <span style={{...styles.badge, backgroundColor: coloriSocieta[progetto.societa], color: 'white'}}>
                            {progetto.societa}
                          </span>
                          <span style={styles.badge}>{progetto.cliente}</span>
                          {progetto.impegno_saltuario && <span style={{...styles.badge, ...styles.saltuario}}>Saltuario</span>}
                        </div>
                        <p style={styles.detailsPeriodo}>
                          {MESI[progetto.mese_inizio - 1]} {progetto.anno_inizio} - {' '}
                          {progetto.anno_fine && progetto.mese_fine 
                            ? `${MESI[progetto.mese_fine - 1]} ${progetto.anno_fine}`
                            : 'In corso'}
                        </p>
                        <p style={styles.detailsTech}><strong>Tecnologia:</strong> {progetto.tecnologia}</p>
                        <p style={styles.detailsDesc}>{progetto.descrizione}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div style={styles.legend}>
        <h4 style={styles.legendTitle}>Legenda Società:</h4>
        <div style={styles.legendItems}>
          {societa.map(s => (
            <div key={s} style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: coloriSocieta[s]}}></div>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
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
        <div style={styles.form}>
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
            <button onClick={handleSubmit} style={styles.saveBtn}>Salva</button>
            <button onClick={onClose} style={styles.cancelBtn}>Annulla</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: { maxWidth: '1600px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
  title: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' },
  headerActions: { display: 'flex', gap: '15px', alignItems: 'center' },
  viewToggle: { display: 'flex', gap: '5px', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '8px' },
  toggleBtn: { padding: '8px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#666', transition: 'all 0.2s' },
  toggleBtnActive: { backgroundColor: 'white', color: '#0066cc', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
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
  
  // Timeline Calendar Styles con colonne fisse
  timelineContainer: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  
  timelineHeaderWrapper: { display: 'flex', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', marginBottom: '10px' },
  fixedColumns: { display: 'flex', flexShrink: 0, borderRight: '2px solid #e0e0e0' },
  fixedColumnHeader: { width: '200px', fontWeight: 'bold', fontSize: '14px', color: '#666', padding: '8px', borderRight: '1px solid #e0e0e0' },
  fixedColumnHeaderDesc: { width: '300px', fontWeight: 'bold', fontSize: '14px', color: '#666', padding: '13px' },
  
  scrollableHeader: { flex: 1, overflowX: 'hidden', overflowY: 'hidden', cursor: 'grab' },
  timelineGrid: { display: 'flex' },
  yearColumn: { display: 'flex', flexDirection: 'column' },
  yearLabel: { textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#1a1a1a', marginBottom: '8px', minWidth: '600px' },
  monthsRow: { display: 'flex' },
  monthLabel: { width: '51px', minWidth: '51px', textAlign: 'center', fontSize: '10px', color: '#999', padding: '0', flexShrink: 0 },
  
  timelineBodyWrapper: { display: 'flex', flexDirection: 'column' },
  timelineRowWrapper: { display: 'flex', borderBottom: '1px solid #f0f0f0', minHeight: '80px' },
  
  fixedColumnCell: { width: '200px', padding: '10px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  fixedColumnCellDesc: { width: '300px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '2px solid #e0e0e0' },
  
  progettoNome: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  progettoCliente: { fontSize: '12px', color: '#666', marginBottom: '6px' },
  progettoActions: { display: 'flex', gap: '6px' },
  smallBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px' },
  
  descrizioneTruncate: { fontSize: '12px', color: '#666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '6px' },
  tecnologiaSmall: { fontSize: '11px', color: '#999' },
  
  scrollableRow: { flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative', cursor: 'grab' },
  scrollableRowHidden: { overflowX: 'hidden' },
  timelineRowGrid: { position: 'relative', height: '80px' },
  gridBackground: { display: 'flex', position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 },
  yearGrid: { display: 'flex' },
  monthGrid: { width: '50px', minWidth: '50px', flexShrink: 0, borderRight: '1px solid #f5f5f5' },
  
  progettoBar: {
    position: 'absolute',
    height: '36px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 10
  },
  barSaltuario: {
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.3) 5px, rgba(255,255,255,0.3) 10px)'
  },
  barSelected: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 20
  },
  barContent: { display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px' },
  barText: { fontSize: '13px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  
  detailsPopup: {
    position: 'absolute',
    top: '85px',
    left: '10px',
    right: '10px',
    backgroundColor: 'white',
    border: '2px solid #0066cc',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    zIndex: 100,
    padding: '15px'
  },
  detailsContent: {},
  detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' },
  detailsTitle: { fontSize: '16px', fontWeight: '600', margin: '0' },
  detailsCloseBtn: { background: '#f0f0f0', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#666' },
  detailsMeta: { display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' },
  detailsPeriodo: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  detailsTech: { fontSize: '13px', color: '#333', marginBottom: '8px' },
  detailsDesc: { fontSize: '13px', color: '#666', lineHeight: '1.5', margin: '0' },
  
  legend: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' },
  legendTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#666' },
  legendItems: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  legendColor: { width: '20px', height: '20px', borderRadius: '4px' },
  
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