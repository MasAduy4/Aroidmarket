import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { MessageSquareText, Search, Plus, Eye, Edit2, Trash2, X, ArrowDownRight, ArrowUpRight, MoreHorizontal } from 'lucide-react';

const ROUTINE_CATEGORIES = ['Pencatatan pesanan', 'tambah tanaman', 'hapus tanaman', 'laporan pengiriman', 'report id number', 'review positif'];
const ESCALATION_CATEGORIES = ['Request penting customer', 'cancel', 'ganti tanaman', 'refund', 'resend', 'RTO'];

const getNormalizedStatus = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (['in_progress', 'in-progress', 'in progress', 'diproses', 'proses'].includes(s)) return 'in_progress';
  if (['resolved', 'selesai', 'tervalidasi'].includes(s)) return 'resolved';
  if (['open', 'baru'].includes(s)) return 'open';
  return s.replace(/[-\s]/g, '_');
};

function StatusBadge({ value }) {
  const styles = {
    resolved: 'status-success', Selesai: 'status-success', Tervalidasi: 'status-success',
    in_progress: 'status-progress', 'in-progress': 'status-progress', Diproses: 'status-progress', Open: 'status-progress', open: 'status-progress',
    Menunggu: 'status-waiting', Pending: 'status-waiting', Urgent: 'status-urgent',
  }
  return <span className={`status-badge ${styles[value] || 'status-neutral'}`}><span className="status-dot" />{value}</span>
}

function MetricCard({ icon: Icon, label, value, trend, tone = 'green' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}><Icon size={18} /></div>
      <div className="metric-copy"><p>{label}</p><strong>{value}</strong>{trend && <span className={trend?.startsWith('-') ? 'trend-down' : 'trend-up'}>{trend?.startsWith('-') ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}</span>}</div>
      <button className="icon-button subtle" aria-label={`Opsi ${label}`}><MoreHorizontal size={18} /></button>
    </article>
  )
}

export default function CustomerServiceView({ customerServiceData = [], stats }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') 
  const [statusFilter, setStatusFilter] = useState('all') 

  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  const reportsList = Array.isArray(customerServiceData) ? customerServiceData : (customerServiceData?.data || []);
  const totalEskalasi = stats?.totalCsEskalasi ?? reportsList.filter(i => i.is_escalation || i.isEscalation).length;
  const totalCatatan = stats?.totalCsCatatan ?? reportsList.filter(i => !(i.is_escalation || i.isEscalation)).length;

  const { data, setData, post, put, delete: destroy, reset, processing, errors } = useForm({
    category: ROUTINE_CATEGORIES[0], orderId: '', customer: '', status: 'in_progress', description: '', isEscalation: false,
  })

  const filtered = reportsList.filter((row) => {
    const isEsc = Boolean(row.is_escalation ?? row.isEscalation);
    if (typeFilter === 'escalation' && !isEsc) return false;
    if (typeFilter === 'routine' && isEsc) return false;

    if (statusFilter !== 'all') {
      if (getNormalizedStatus(row.status) !== getNormalizedStatus(statusFilter)) return false;
    }

    const cat = row.category || row.kategori || '';
    const cust = row.customer || row.nama_customer || '';
    const ord = row.orderId || row.order_id || '';
    const desc = row.description || row.deskripsi || row.catatan || row.keterangan || row.note || row.pesan || row.content || '';

    return cat.toLowerCase().includes(query.toLowerCase()) || cust.toLowerCase().includes(query.toLowerCase()) || ord.toLowerCase().includes(query.toLowerCase()) || desc.toLowerCase().includes(query.toLowerCase());
  })

  const handleOpenCreate = () => {
    setEditItem(null); reset();
    setData({ category: ROUTINE_CATEGORIES[0], orderId: '', customer: '', status: 'in_progress', description: '', isEscalation: false });
    setShowModal(true);
  }

  const handleOpenEdit = (item) => {
    setEditItem(item);
    const isEsc = Boolean(item.is_escalation ?? item.isEscalation);
    const validCategories = isEsc ? ESCALATION_CATEGORIES : ROUTINE_CATEGORIES;
    const currentCat = item.category || item.kategori;
    setData({
      category: validCategories.includes(currentCat) ? currentCat : validCategories[0],
      orderId: item.orderId || item.order_id || '',
      customer: item.customer || item.nama_customer || '',
      status: item.status || 'in_progress',
      description: item.description || item.deskripsi || item.catatan || item.keterangan || item.note || item.pesan || item.content || '',
      isEscalation: isEsc,
    });
    setShowModal(true);
  }

  const handleTypeChange = (isEscalationVal) => {
    setData((prev) => ({ ...prev, isEscalation: isEscalationVal, category: isEscalationVal ? ESCALATION_CATEGORIES[0] : ROUTINE_CATEGORIES[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const itemId = editItem?.id || editItem?.report_id;
    if (editItem) {
      put(`/cs-reports/${itemId}`, { onSuccess: () => { setShowModal(false); reset(); } });
    } else {
      post('/cs-reports', { onSuccess: () => { setShowModal(false); reset(); } });
    }
  }

  const handleDelete = (item) => {
    const id = item?.id || item?.report_id;
    if (id && confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      destroy(`/cs-reports/${id}`, { preserveScroll: true });
    }
  }

  return (
    <div className="view-stack">
      {/* Metrics Section */}
      <section className="metric-grid compact">
        <MetricCard icon={MessageSquareText} label="Total Laporan CS" value={reportsList.length} trend="Total" />
        <MetricCard icon={MessageSquareText} label="Eskalasi Khusus" value={totalEskalasi} trend="Prioritas" tone="cream" />
        <MetricCard icon={MessageSquareText} label="Catatan Harian" value={totalCatatan} trend="Rutin" tone="olive" />
      </section>

      {/* PANEL BOX PUTIH MEMBUNGKUS HEADER & TABEL */}
      <article className="panel table-panel">
        <div className="panel-heading flex-wrap gap-3">
          <div>
            <p className="eyebrow">CUSTOMER REPORT</p>
            <h2>Daftar Report Customer Service</h2>
            <p className="panel-description">Laporan gabungan dari tim CS dan Eskalasi.</p>
          </div>
          <div className="table-actions flex flex-wrap items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-lg px-7 py-1.5 font-medium text-slate-900 outline-none">
              <option value="all">Semua Tipe Laporan</option>
              <option value="escalation">Eskalasi Khusus</option>
              <option value="routine">Catatan Harian</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-lg px-7 py-1.5 font-medium text-slate-900 outline-none">
              <option value="all">Semua Status</option>
              <option value="open">Open / Baru</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <label className="small-search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari report..." />
            </label>
            <button onClick={handleOpenCreate} className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition">
              <Plus size={15} /> Tambah Report
            </button>
          </div>
        </div>

        {/* TABEL SEKARANG DIBUNGKUS DI DALAM ARTICLE PANEL */}
        <div className="table-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">KATEGORI & TIPE</th>
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map((item, idx) => {
                const isEsc = Boolean(item.is_escalation ?? item.isEscalation);
                return (
                  <tr key={item.id || item.report_id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${isEsc ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isEsc ? 'Eskalasi Khusus' : 'Catatan Harian'}
                      </span>
                      <div className="font-semibold text-slate-800">{item.category || item.kategori}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{item.orderId || item.order_id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.customer || item.nama_customer}</td>
                    <td className="py-3.5 px-4"><StatusBadge value={item.status} /></td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setDetailItem(item); setShowDetailModal(true); }} className="p-1.5 hover:bg-slate-100 rounded-md text-emerald-600" title="Detail"><Eye size={17} /></button>
                        <button onClick={() => handleOpenEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600" title="Edit"><Edit2 size={17} /></button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 rounded-md text-red-600" title="Hapus"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-sm text-slate-400">Data laporan tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Detail CS Laporan */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 m-0">DETAIL CATATAN CS</p>
                <h3 className="font-bold text-lg text-slate-800 m-0">{detailItem.category || detailItem.kategori}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm border border-amber-100/60">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Order ID:</span>
                <span className="font-mono font-bold text-emerald-800">{detailItem.orderId || detailItem.order_id || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Nama Customer:</span>
                <span className="font-bold text-slate-800">{detailItem.customer || detailItem.nama_customer || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Status:</span>
                <StatusBadge value={detailItem.status} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Dibuat Pada:</span>
                <span className="font-semibold text-slate-700">
                  {detailItem.created_at ? new Date(detailItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi Lengkap / Catatan CS:</label>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 min-h-[90px] whitespace-pre-wrap leading-relaxed">
                {detailItem.description || detailItem.deskripsi || detailItem.catatan || detailItem.keterangan || detailItem.note || detailItem.pesan || detailItem.content || 'Tidak ada catatan tambahan.'}
              </div>
            </div>

            <div className="flex justify-end border-t pt-3">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">{editItem ? 'Edit Report CS' : 'Tambah Report CS'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Laporan</label>
                <select value={data.isEscalation ? 'true' : 'false'} onChange={(e) => handleTypeChange(e.target.value === 'true')} className="w-full text-sm border rounded-lg p-2 bg-white">
                  <option value="false">Catatan Harian (Rutin)</option>
                  <option value="true">Eskalasi Khusus (Prioritas)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
                <select value={data.category} onChange={(e) => setData('category', e.target.value)} className="w-full text-sm border rounded-lg p-2 bg-white">
                  {(data.isEscalation ? ESCALATION_CATEGORIES : ROUTINE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Order ID</label>
                <input type="text" value={data.orderId} onChange={(e) => setData('orderId', e.target.value)} className="w-full text-sm border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer</label>
                <input type="text" value={data.customer} onChange={(e) => setData('customer', e.target.value)} className="w-full text-sm border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi / Catatan CS</label>
                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full text-sm border rounded-lg p-2 min-h-[70px]" placeholder="Masukkan deskripsi laporan..." />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 text-xs font-medium bg-green-700 text-white rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}