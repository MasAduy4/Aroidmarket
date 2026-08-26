import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
  BookOpen, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  MoreHorizontal, 
  Database, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check 
} from 'lucide-react';

function MetricCard({ icon: Icon, label, value, trend, tone = 'green' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}><Icon size={18} /></div>
      <div className="metric-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        {trend && <span className="trend-up"><ArrowUpRight size={13} />{trend}</span>}
      </div>
      <button className="icon-button subtle" aria-label={`Opsi ${label}`}><MoreHorizontal size={18} /></button>
    </article>
  );
}

export default function FinanceView({ 
  financial, 
  sheets = {}, 
  monthlyRevenueData = {}, 
  stats = {}, 
  endorseCandidates = [] 
}) {
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    // --- PERHITUNGAN 3 METRIK UTAMA ---
    const monthlyIncome = financial?.monthlyIncome ?? financial?.totalIncome ?? stats?.finansial ?? 0;
  
    const yearlyIncome = useMemo(() => {
      // 1. Utamakan menghitung penjumlahan dari monthlyRevenueData (Jan - Okt)
      if (monthlyRevenueData && Object.keys(monthlyRevenueData).length > 0) {
        const sumMonthly = Object.values(monthlyRevenueData).reduce((acc, curr) => acc + Number(curr || 0), 0);
        if (sumMonthly > 0) {
          return sumMonthly;
        }
      }
  
      // 2. Fallback jika monthlyRevenueData kosong / bernilai 0
      if (financial?.yearlyIncome !== undefined && financial?.yearlyIncome !== null) {
        return financial.yearlyIncome;
      }
  
      return financial?.totalIncome || 0;
    }, [financial, monthlyRevenueData]);

  const totalInfluencer = useMemo(() => {
    if (financial?.totalInfluencer !== undefined && financial?.totalInfluencer !== null) {
      return financial.totalInfluencer;
    }
    if (stats?.totalInfluencer !== undefined && stats?.totalInfluencer !== null) {
      return stats.totalInfluencer;
    }
    if (Array.isArray(endorseCandidates)) {
      return endorseCandidates.length;
    }
    if (endorseCandidates && Array.isArray(endorseCandidates.data)) {
      return endorseCandidates.data.length;
    }
    return 0;
  }, [financial, stats, endorseCandidates]);

  // Tab Sheets
  const sheetKeys = Object.keys(sheets).length > 0 
    ? Object.keys(sheets) 
    : ['Buku Kas', 'Operasional', 'Penjualan Lokal', 'Data Order Shopify', 'Uang $ Aroid Market', 'Belanja Tanaman Order', 'Orderan Terkirim', 'Tanaman Baru'];

  const [activeTab, setActiveTab] = useState(sheetKeys[0]);
  const currentData = sheets[activeTab] || [];

  // --- PEMBENTUKAN KOLOM DINAMIS & STABIL ---
  const columns = useMemo(() => {
    if (activeTab === 'Buku Kas') {
      return ['Tanggal', 'Deskripsi', 'Akun', 'Debit', 'Kredit', 'Saldo'];
    }
    
    // Gabungkan seluruh kunci dari tiap baris data jika ada
    if (currentData.length > 0) {
      const keySet = new Set();
      currentData.forEach(row => {
        Object.keys(row).forEach(k => {
          if (!['id', 'created_at', 'updated_at'].includes(k)) {
            keySet.add(k);
          }
        });
      });
      return Array.from(keySet);
    }

    // Default kolom jika data sheet masih kosong
    return ['Tanggal', 'Deskripsi', 'Akun', 'Nominal'];
  }, [activeTab, currentData]);

  const formColumns = useMemo(() => {
    return columns.filter(col => col !== 'Saldo');
  }, [columns]);

  // --- STATE MODAL CRUD ---
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [formData, setFormData] = useState({});

  // Buka Modal Tambah Data
  const handleOpenAdd = () => {
    const initialForm = {};
    const today = new Date().toISOString().split('T')[0];
    
    formColumns.forEach(col => {
      if (col.toLowerCase().includes('tanggal')) {
        initialForm[col] = today;
      } else {
        initialForm[col] = '';
      }
    });

    setFormData(initialForm);
    setModalMode('add');
    setShowModal(true);
  };

  // Buka Modal Edit Data
  const handleOpenEdit = (row) => {
    setSelectedRowId(row.id);
    const initialForm = {};
    formColumns.forEach(col => { initialForm[col] = row[col] ?? ''; });
    setFormData(initialForm);
    setModalMode('edit');
    setShowModal(true);
  };

  // Submit Form (Tambah / Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = `/akuntansi-marketing/sheet/${encodeURIComponent(activeTab)}`;

    if (modalMode === 'add') {
      router.post(endpoint, formData, {
        preserveScroll: true,
        onSuccess: () => setShowModal(false)
      });
    } else {
      router.put(`${endpoint}/${selectedRowId}`, formData, {
        preserveScroll: true,
        onSuccess: () => setShowModal(false)
      });
    }
  };

  // Hapus Data
  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      router.delete(`/akuntansi-marketing/sheet/${encodeURIComponent(activeTab)}/${id}`, {
        preserveScroll: true
      });
    }
  };

  return (
    <div className="view-stack">
      {/* METRIC CARDS */}
      <section className="metric-grid finance-grid">
        <MetricCard 
          icon={BookOpen} 
          label="Pendapatan Bulan Ini" 
          value={formatRupiah(monthlyIncome)} 
          trend="Bulan Ini" 
        />
        <MetricCard 
          icon={DollarSign} 
          label="Total Pendapatan Tahun Ini" 
          value={formatRupiah(yearlyIncome)} 
          trend="Tahun Ini" 
          tone="olive" 
        />
        <MetricCard 
          icon={Users} 
          label="Total Influencer" 
          value={`${totalInfluencer} User`} 
          trend="Active" 
          tone="cream" 
        />
      </section>

      {/* TABEL DATA SHEET */}
      <section className="table-card" style={{ marginTop: '1.5rem', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e9e5d9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#1c2826' }}>
            <Database size={16} /> Data Sheet: {activeTab}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8c9087', fontWeight: 600 }}>
              {currentData.length} Baris Data
            </span>
            <button
              onClick={handleOpenAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Plus size={14} /> Tambah Data
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '1rem' }}>
          {sheetKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid #e9e5d9',
                backgroundColor: activeTab === key ? '#1b4332' : '#f7f5ed',
                color: activeTab === key ? '#ffffff' : '#1c2826',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Output Tabel */}
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e9e5d9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7f5ed', borderBottom: '1px solid #e9e5d9', color: '#8c9087', textTransform: 'uppercase' }}>
                {columns.map((col) => (
                  <th key={col} style={{ padding: '10px 12px', fontWeight: 700 }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', width: '80px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#8c9087' }}>
                    Belum ada data masuk pada tabel <strong>{activeTab}</strong>.
                  </td>
                </tr>
              ) : (
                currentData.map((row, index) => (
                  <tr key={row.id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {columns.map((col) => (
                      <td key={col} style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#1c2826' }}>
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                      </td>
                    ))}
                    <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(row)}
                          title="Edit"
                          style={{
                            background: '#f7f5ed',
                            border: '1px solid #e9e5d9',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#1b4332'
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          title="Hapus"
                          style={{
                            background: '#fff5f5',
                            border: '1px solid #ffe3e3',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#e03131'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL INPUT / EDIT */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e9e5d9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1c2826' }}>
                {modalMode === 'add' ? `Tambah Data (${activeTab})` : `Edit Data (${activeTab})`}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8c9087' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {formColumns.map((col) => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1c2826' }}>
                      {col.replace(/_/g, ' ')}
                    </label>
                    <input
                      type={col.toLowerCase().includes('tanggal') ? 'date' : 'text'}
                      value={formData[col] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      placeholder={`Masukkan ${col.replace(/_/g, ' ')}`}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e9e5d9',
                        fontSize: '0.8rem',
                        outline: 'none',
                        backgroundColor: '#fbfaf8'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #e9e5d9',
                    backgroundColor: '#f7f5ed',
                    color: '#1c2826',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#1b4332',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Check size={14} /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}