'use client'

import { useMemo, useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'

import {
  Bell,
  ClipboardList,
  Leaf,
  Settings,
  ShieldAlert,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Send,
  Search,
  Pencil,
  Trash2,
  X,
  LogOut,
  Eye,
  Menu,
} from 'lucide-react'

const categories = [
  { value: 'pencatatan-pesanan', label: 'Pencatatan Pesanan', helper: 'Catat pesanan baru atau perubahan detail.' },
  { value: 'tambah-tanaman', label: 'Tambah Tanaman', helper: 'Menambahkan item tanaman ke pesanan.' },
  { value: 'hapus-tanaman', label: 'Hapus Tanaman', helper: 'Menghapus item tanaman dari pesanan.' },
  { value: 'request-penting', label: 'Request Penting Customer', helper: 'Permintaan prioritas dari customer.', escalation: true },
  { value: 'cancel', label: 'Cancel', helper: 'Pembatalan pesanan yang perlu diproses.', escalation: true },
  { value: 'resend', label: 'Resend', helper: 'Pengiriman ulang karena kendala order.', escalation: true },
  { value: 'ganti-tanaman', label: 'Ganti Tanaman', helper: 'Penggantian tanaman dalam pesanan.', escalation: true },
  { value: 'refund', label: 'Refund', helper: 'Pengembalian dana untuk customer.', escalation: true },
  { value: 'rto', label: 'RTO / Return to Origin', helper: 'Pesanan kembali ke asal.', escalation: true },
  { value: 'laporan-pengiriman', label: 'Laporan Pengiriman', helper: 'Update status atau kendala kiriman.' },
  { value: 'report-id-number', label: 'Report ID Number', helper: 'Pelaporan terkait nomor identitas order.' },
  { value: 'review-positif', label: 'Review Positif', helper: 'Catatan apresiasi dari customer.' },
]

const escalationCategories = new Set(
  categories.filter((category) => category.escalation).map((category) => category.value)
)

function getCategoryLabel(value) {
  return categories.find((category) => category.value === value)?.label ?? value
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
}

function SlaCell({ report }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    const isEscalation = report.is_escalation ?? report.isEscalation
    const deadline = report.sla_deadline ?? report.slaDeadline
    
    if (!isEscalation || !deadline) return
    
    const updateRemaining = () => setRemaining(new Date(deadline).getTime() - Date.now())
    updateRemaining()
    const interval = window.setInterval(updateRemaining, 60_000)
    return () => window.clearInterval(interval)
  }, [report])

  const isEscalation = report.is_escalation ?? report.isEscalation
  const deadline = report.sla_deadline ?? report.slaDeadline

  if (!isEscalation || !deadline) {
    return <span className="text-xs font-normal text-[#8c9087]">Routine</span>
  }
  if (remaining === null) {
    return <span className="text-xs font-normal text-[#8c9087]">Menghitung...</span>
  }
  const days = Math.max(0, Math.floor(remaining / 86400000))
  const hours = Math.max(0, Math.floor((remaining % 86400000) / 3600000))

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="w-2 h-2 rounded-full bg-[#d96b27] inline-block shrink-0 animate-pulse" />
      <div>
        <p className="text-xs font-semibold text-[#1c2826] leading-tight m-0">
          {days}d {hours}h tersisa
        </p>
        <p className="text-[11px] text-[#8c9087] leading-tight m-0">s.d. {formatDate(deadline)}</p>
      </div>
    </div>
  )
}

function CsForm({ allowedCategories, isEscalationMenu }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    category: allowedCategories[0]?.value ?? 'pencatatan-pesanan',
    orderId: '',
    customer: '',
    description: '',
    isEscalation: isEscalationMenu,
  })

  useEffect(() => {
    if (allowedCategories.length > 0) {
      setData((prev) => ({
        ...prev,
        category: allowedCategories[0].value,
        isEscalation: isEscalationMenu,
      }))
    }
  }, [allowedCategories, isEscalationMenu])

  const selected = useMemo(() => categories.find((item) => item.value === data.category), [data.category])
  const isEscalation = escalationCategories.has(data.category)

  function handleSubmit(event) {
    event.preventDefault()
    post('/cs-reports', {
      onSuccess: () => {
        reset('orderId', 'customer', 'description')
      },
    })
  }

  return (
    <section className="bg-white rounded-[16px] border border-[#e9e5d9] p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8c9087] mb-1">
            {isEscalationMenu ? 'ESKALASI BARU' : 'FORM LAPORAN'}
          </p>
          <h2 className="text-[18px] font-bold text-[#1c2826] tracking-tight leading-snug m-0">
            {isEscalationMenu ? 'Buat Eskalasi Baru' : 'Buat Catatan CS'}
          </h2>
        </div>
        <div className="w-[36px] h-[36px] rounded-full bg-[#f7f5ed] text-[#2f6850] flex items-center justify-center shrink-0 border border-[#e9e5d9]">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[6px]">
          <label className="text-xs font-semibold text-[#1c2826]">
            Kategori laporan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={data.category}
              onChange={(event) => setData('category', event.target.value)}
              className="w-full h-[42px] bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] pl-[12px] pr-[40px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer focus:bg-white focus:border-[#2f6850] transition-colors"
            >
              {allowedCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                  {item.escalation ? ' · SLA 3 hari' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-[12px] top-[13px] w-4 h-4 text-[#8c9087] pointer-events-none" />
          </div>
          <span className="text-[11px] text-[#8c9087]">{selected?.helper}</span>
        </div>

        {isEscalation && (
          <div className="flex items-start gap-[10px] bg-[#fff7ed] border border-[#ffedd5] rounded-[10px] p-[12px] text-xs text-[#9a3412]">
            <Clock3 className="w-4 h-4 shrink-0 text-[#d96b27] mt-[2px]" />
            <span>
              <strong className="font-semibold">Escalation aktif.</strong> Tenggat SLA 3 hari akan dibuat otomatis.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-xs font-semibold text-[#1c2826]">
              Order ID <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={data.orderId}
              onChange={(event) => setData('orderId', event.target.value)}
              placeholder="AM-240813-000"
              className="h-[42px] bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] px-[12px] text-xs font-medium text-[#1c2826] outline-none focus:bg-white focus:border-[#2f6850] transition-colors placeholder:text-[#8c9087]"
            />
            {errors.orderId && <span className="text-red-500 text-[11px]">{errors.orderId}</span>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="text-xs font-semibold text-[#1c2826]">
              Nama customer <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={data.customer}
              onChange={(event) => setData('customer', event.target.value)}
              placeholder="Nama lengkap customer"
              className="h-[42px] bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] px-[12px] text-xs font-medium text-[#1c2826] outline-none focus:bg-white focus:border-[#2f6850] transition-colors placeholder:text-[#8c9087]"
            />
            {errors.customer && <span className="text-red-500 text-[11px]">{errors.customer}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label className="text-xs font-semibold text-[#1c2826]">
            Deskripsi catatan <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={data.description}
            onChange={(event) => setData('description', event.target.value)}
            placeholder="Tulis rincian kendala..."
            rows={4}
            className="bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] p-[12px] text-xs font-medium text-[#1c2826] outline-none focus:bg-white focus:border-[#2f6850] transition-colors placeholder:text-[#8c9087] resize-none leading-relaxed"
          />
          {errors.description && <span className="text-red-500 text-[11px]">{errors.description}</span>}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="h-[42px] bg-[#2f6850] text-white font-semibold rounded-[10px] text-xs flex items-center justify-between px-[16px] border-none cursor-pointer mt-[4px] hover:bg-[#255340] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <span className="flex items-center gap-[8px]">
            <Send className="w-[14px] h-[14px]" /> {processing ? 'Menyimpan...' : 'Kirim Laporan'}
          </span>
          <Check className="w-[16px] h-[16px] opacity-70" />
        </button>
      </form>
    </section>
  )
}

function CsTable({ reports, onStatusChange, onDelete, onUpdate, isEscalationMenu }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const [editingReport, setEditingReport] = useState(null)
  const [viewingReport, setViewingReport] = useState(null)

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const orderId = String(r.order_id ?? r.orderId ?? '')
      const customer = String(r.customer ?? '')
      const description = String(r.description ?? '')
      const category = String(r.category ?? '')
      const status = String(r.status ?? '')

      const matchesSearch =
        customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryLabel(category).toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [reports, searchTerm, statusFilter, categoryFilter])

  const handleSaveEdit = (e) => {
    e.preventDefault()
    onUpdate(editingReport)
    setEditingReport(null)
  }

  return (
    <section className="bg-white rounded-[16px] border border-[#e9e5d9] shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="p-[20px_24px] border-b border-[#e9e5d9] flex flex-wrap items-center justify-between gap-[12px] bg-[#fdfcf7]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8c9087] mb-1">
              {isEscalationMenu ? 'PRIORITAS ESKALASI' : 'DAFTAR LAPORAN'}
            </p>
            <div className="flex items-center gap-[8px]">
              <h2 className="text-[18px] font-bold text-[#1c2826] m-0">
                {isEscalationMenu ? 'Tabel Eskalasi Kasus' : 'Catatan Customer Service'}
              </h2>
              <span className="bg-[#2f6850]/10 text-[#2f6850] text-xs px-[8px] py-[2px] rounded-full font-bold">
                {filteredReports.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-[8px] flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[36px] bg-white border border-[#e9e5d9] rounded-[8px] pl-[10px] pr-[28px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer focus:border-[#2f6850]"
              >
                <option value="all">Semua Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown className="absolute right-[8px] top-[10px] w-[14px] h-[14px] text-[#8c9087] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[36px] bg-white border border-[#e9e5d9] rounded-[8px] pl-[10px] pr-[28px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer max-w-[140px] truncate focus:border-[#2f6850]"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-[8px] top-[10px] w-[14px] h-[14px] text-[#8c9087] pointer-events-none" />
            </div>

            <div className="flex items-center gap-[8px] bg-white border border-[#e9e5d9] rounded-[8px] px-[10px] h-[36px] text-[#8c9087] w-[160px] focus-within:border-[#2f6850]">
              <Search className="w-[14px] h-[14px] shrink-0" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-[#1c2826] outline-none border-none w-full placeholder:text-[#8c9087]"
                placeholder="Cari..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f5ed] border-b border-[#e9e5d9] text-[10px] uppercase tracking-[0.08em] font-bold text-[#8c9087]">
                <th className="p-[12px_20px]">KATEGORI</th>
                <th className="p-[12px_20px]">ORDER ID</th>
                <th className="p-[12px_20px]">CUSTOMER</th>
                <th className="p-[12px_20px]">STATUS</th>
                <th className="p-[12px_20px]">SLA TIMELINE</th>
                <th className="p-[12px_20px] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#e9e5d9]">
  {filteredReports.map((report) => {
    const isEscalation = report.is_escalation ?? report.isEscalation
    const rawOrderId = report.order_id ?? report.orderId ?? '—'
    const createdAt = report.created_at ?? report.createdAt

    return (
      <tr key={report.id} className="hover:bg-[#fdfcf7] transition-colors">
        <td className="p-[14px_20px]">
          <div className="font-semibold text-[#1c2826] flex items-center gap-[6px]">
            {isEscalation && <ShieldAlert className="w-[14px] h-[14px] text-[#d96b27] shrink-0" />}
            {getCategoryLabel(report.category)}
          </div>
          {/* Tambahan title={report.description} ada di tag p bawah ini */}
          <p 
            className="text-[11px] text-[#8c9087] m-[2px_0_0_0] truncate max-w-[160px]"
            title={report.description}
          >
            {report.description}
          </p>
        </td>
        <td className="p-[14px_20px] font-mono text-xs">
          <span className="font-bold text-[#2f6850] bg-[#2f6850]/10 border border-[#2f6850]/20 px-2 py-0.5 rounded text-[11px] inline-block">
            {rawOrderId}
          </span>
        </td>
        <td className="p-[14px_20px]">
          <p className="font-semibold text-[#1c2826] m-0">{report.customer}</p>
          <p className="text-[11px] text-[#8c9087] m-[2px_0_0_0]">{formatDate(createdAt)}</p>
        </td>
        <td className="p-[14px_20px]">
          <button
            onClick={() => onStatusChange(report.id, report.status)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-transform active:scale-95 ${
              report.status === 'resolved'
                ? 'bg-[#e8f5e9] text-[#2f6850]'
                : report.status === 'in-progress'
                ? 'bg-[#fff3e0] text-[#d96b27]'
                : 'bg-[#f7f5ed] text-[#1c2826]'
            }`}
          >
            {report.status === 'open' ? 'Open' : report.status === 'in-progress' ? 'In Progress' : 'Resolved'}
          </button>
        </td>
        <td className="p-[14px_20px]">
          <SlaCell report={report} />
        </td>
        <td className="p-[14px_20px] text-center">
          <div className="flex items-center justify-center gap-[6px]">
            <button
              onClick={() => setViewingReport(report)}
              className="border-none bg-[#f7f5ed] p-[6px] rounded-[6px] cursor-pointer text-[#2f6850] hover:bg-[#e9e5d9] transition-colors"
              title="Lihat Catatan"
            >
              <Eye className="w-[13px] h-[13px]" />
            </button>
            <button
              onClick={() => setEditingReport(report)}
              className="border-none bg-[#f7f5ed] p-[6px] rounded-[6px] cursor-pointer text-[#1c2826] hover:bg-[#e9e5d9] transition-colors"
              title="Edit Catatan"
            >
              <Pencil className="w-[13px] h-[13px]" />
            </button>
            <button
              onClick={() => onDelete(report.id)}
              className="border-none bg-red-50 p-[6px] rounded-[6px] cursor-pointer text-red-600 hover:bg-red-100 transition-colors"
              title="Hapus Catatan"
            >
              <Trash2 className="w-[13px] h-[13px]" />
            </button>
          </div>
        </td>
      </tr>
    )
  })}
</tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="p-[48px] text-center text-xs text-[#8c9087]">Belum ada laporan yang sesuai filter.</div>
          )}
        </div>
      </div>
      <div className="p-[14px_24px] border-t border-[#e9e5d9] text-[11px] text-[#8c9087] bg-[#fdfcf7]">
        Klik status untuk mengubah progres laporan ke tahap berikutnya.
      </div>

      {/* MODAL VIEW */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-[16px] backdrop-blur-sm">
          <div className="bg-white rounded-[16px] p-[24px] w-full max-w-[480px] shadow-xl border border-[#e9e5d9]">
            <div className="flex justify-between items-center mb-[16px] border-b border-[#e9e5d9] pb-[12px]">
              <div>
                <span className="text-[10px] font-bold tracking-[0.1em] text-[#d96b27] uppercase">DETAIL CATATAN CS</span>
                <h3 className="text-[18px] font-bold m-[2px_0_0_0] text-[#1c2826]">
                  {getCategoryLabel(viewingReport.category)}
                </h3>
              </div>
              <button onClick={() => setViewingReport(null)} className="border-none bg-transparent cursor-pointer text-[#8c9087] hover:text-[#1c2826]">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="flex flex-col gap-[12px] text-xs">
              <div className="grid grid-cols-2 gap-[8px] bg-[#f7f5ed] p-[12px] rounded-[10px]">
                <div>
                  <span className="text-[#8c9087] text-[11px]">Order ID:</span>
                  <p className="font-bold m-[2px_0_0_0] text-[#2f6850] font-mono">{viewingReport.order_id ?? viewingReport.orderId ?? '—'}</p>
                </div>
                <div>
                  <span className="text-[#8c9087] text-[11px]">Nama Customer:</span>
                  <p className="font-semibold m-[2px_0_0_0] text-[#1c2826]">{viewingReport.customer}</p>
                </div>
                <div>
                  <span className="text-[#8c9087] text-[11px]">Status:</span>
                  <p className={`font-semibold m-[2px_0_0_0] ${viewingReport.status === 'resolved' ? 'text-[#2f6850]' : 'text-[#d96b27]'}`}>
                    {viewingReport.status?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="text-[#8c9087] text-[11px]">Dibuat Pada:</span>
                  <p className="font-medium m-[2px_0_0_0] text-[#1c2826]">{formatDate(viewingReport.created_at ?? viewingReport.createdAt)}</p>
                </div>
              </div>

              <div>
                <span className="text-[#1c2826] font-semibold block mb-[6px]">Deskripsi Lengkap / Catatan CS:</span>
                <div className="bg-[#fdfcf7] border border-[#e9e5d9] p-[12px] rounded-[10px] text-[#1c2826] leading-[1.5] whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {viewingReport.description}
                </div>
              </div>
            </div>

            <div className="mt-[20px] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="h-[36px] px-[16px] rounded-[8px] border border-[#e9e5d9] bg-white text-xs font-semibold cursor-pointer hover:bg-[#f7f5ed] text-[#1c2826]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-[16px] backdrop-blur-sm">
          <div className="bg-white rounded-[16px] p-[24px] w-full max-w-[420px] shadow-xl border border-[#e9e5d9]">
            <div className="flex justify-between items-center mb-[16px]">
              <h3 className="text-[18px] font-bold m-0 text-[#1c2826]">Edit Catatan Laporan</h3>
              <button onClick={() => setEditingReport(null)} className="border-none bg-transparent cursor-pointer text-[#8c9087] hover:text-[#1c2826]">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-[12px]">
              <div>
                <label className="text-[11px] font-semibold text-[#1c2826] block mb-[4px]">Nama Customer</label>
                <input
                  value={editingReport.customer ?? ''}
                  onChange={(e) => setEditingReport({ ...editingReport, customer: e.target.value })}
                  className="w-full h-[38px] px-[10px] rounded-[8px] border border-[#e9e5d9] text-xs outline-none focus:border-[#2f6850]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#1c2826] block mb-[4px]">Order ID</label>
                <input
                  value={editingReport.order_id ?? editingReport.orderId ?? ''}
                  onChange={(e) => setEditingReport({ ...editingReport, orderId: e.target.value, order_id: e.target.value })}
                  className="w-full h-[38px] px-[10px] rounded-[8px] border border-[#e9e5d9] text-xs outline-none focus:border-[#2f6850]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#1c2826] block mb-[4px]">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingReport.description ?? ''}
                  onChange={(e) => setEditingReport({ ...editingReport, description: e.target.value })}
                  className="w-full p-[8px_10px] rounded-[8px] border border-[#e9e5d9] text-xs outline-none resize-none focus:border-[#2f6850]"
                />
              </div>
              <div className="flex gap-[8px] justify-end mt-[8px]">
                <button type="button" onClick={() => setEditingReport(null)} className="h-[36px] px-[14px] rounded-[8px] border border-[#e9e5d9] bg-white text-xs cursor-pointer hover:bg-[#f7f5ed] text-[#1c2826]">
                  Batal
                </button>
                <button type="submit" className="h-[36px] px-[14px] rounded-[8px] border-none bg-[#2f6850] text-white text-xs font-semibold cursor-pointer hover:bg-[#255340]">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default function CustomerService({ reports = [] }) {
  const [activeMenu, setActiveMenu] = useState('daily')

  const visibleCategories = useMemo(
    () => categories.filter((category) => (activeMenu === 'escalation' ? category.escalation : !category.escalation)),
    [activeMenu]
  )

  const visibleReports = useMemo(
    () => reports.filter((report) => {
      const isEscalation = report.is_escalation ?? report.isEscalation
      return activeMenu === 'escalation' ? isEscalation : !isEscalation
    }),
    [activeMenu, reports]
  )

  const escalationCount = useMemo(
    () => reports.filter((report) => (report.is_escalation ?? report.isEscalation) && report.status !== 'resolved').length,
    [reports]
  )
  const pendingCount = useMemo(
    () => visibleReports.filter((report) => report.status !== 'resolved').length,
    [visibleReports]
  )
  const resolvedCount = useMemo(
    () => visibleReports.filter((report) => report.status === 'resolved').length,
    [visibleReports]
  )

  function deleteReport(id) {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      router.delete(`/cs-reports/${id}`)
    }
  }

  function updateReport(updated) {
    router.put(`/cs-reports/${updated.id}`, {
      orderId: updated.orderId ?? updated.order_id,
      customer: updated.customer,
      category: updated.category,
      description: updated.description,
      status: updated.status,
    })
  }

  function cycleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'open' ? 'in-progress' : currentStatus === 'in-progress' ? 'resolved' : 'open'
    router.put(`/cs-reports/${id}`, { status: nextStatus })
  }

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      router.post('/logout')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ed] flex text-[#1c2826] font-sans">
      {/* Sidebar Warna Dark Forest Green Sesuai Manager Dashboard */}
      <aside className="w-[260px] bg-[#1b4332] text-white flex flex-col justify-between shrink-0 p-[20px] select-none">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-[10px] pb-5 border-b border-white/10 mb-5">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#2f6850] flex items-center justify-center text-white shrink-0">
              <Leaf className="w-[19px] h-[19px]" />
            </div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight m-0 text-white">
                Aroid<span className="text-[#8c9087] font-normal">Market</span>
              </h1>
              <p className="text-[9px] tracking-[0.15em] uppercase text-[#8c9087] font-bold m-0">OPERATIONAL HUB</p>
            </div>
          </div>

          {/* Active Workspace Banner */}
          <div className="bg-white/10 rounded-[10px] p-[10px_12px] mb-5 flex items-center gap-[10px] border border-white/5">
            <div className="w-[28px] h-[28px] rounded-[6px] bg-[#f7f5ed] text-[#1b4332] font-bold text-[11px] flex items-center justify-center shrink-0">
              CS
            </div>
            <div>
              <p className="text-[9px] text-[#8c9087] m-0 uppercase tracking-[0.05em] font-semibold">WORKSPACE AKTIF</p>
              <p className="text-xs font-bold text-white m-0">Customer Service</p>
            </div>
          </div>

          {/* Navigasi */}
          <nav className="flex flex-col gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8c9087] px-2 mb-2">OPERASIONAL CS</p>
              <button
                onClick={() => setActiveMenu('daily')}
                className={`w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] text-left border-none cursor-pointer transition-colors ${
                  activeMenu === 'daily'
                    ? 'bg-[#2f6850] text-white font-semibold'
                    : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-normal'
                }`}
              >
                <ClipboardList className="w-[16px] h-[16px] shrink-0" />
                <span className="text-xs">Catatan Harian</span>
              </button>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8c9087] px-2 mb-2">MENU PRIORITAS</p>
              <button
                onClick={() => setActiveMenu('escalation')}
                className={`w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] text-left border-none cursor-pointer transition-colors ${
                  activeMenu === 'escalation'
                    ? 'bg-[#d96b27] text-white font-semibold'
                    : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-normal'
                }`}
              >
                <ShieldAlert className="w-[16px] h-[16px] shrink-0" />
                <span className="text-xs">Eskalasi Kasus ({escalationCount})</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <button className="flex items-center gap-2 text-xs text-white/70 bg-transparent border-none cursor-pointer px-2 hover:text-white transition-colors">
            <Settings className="w-[15px] h-[15px]" /> Pengaturan
          </button>
          
          <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-[10px] border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-full bg-[#2f6850] text-white text-xs font-bold flex items-center justify-center shrink-0">AS</div>
              <div>
                <p className="text-xs font-semibold m-0 leading-none text-white">Alya Sari</p>
                <p className="text-[10px] text-[#8c9087] m-0 mt-0.5">CS Lead</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="border-none bg-red-500/20 text-red-300 p-1.5 rounded-[6px] cursor-pointer flex items-center justify-center hover:bg-red-500/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar Navigation */}
        <header className="h-[60px] bg-white border-b border-[#e9e5d9] flex items-center justify-between px-8 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#8c9087]">
            <span className="text-[10px] font-bold tracking-wider uppercase">WORKSPACE</span>
            <span>/</span>
            <span className="font-bold text-[#1c2826] text-[11px]">CUSTOMER SERVICE</span>
          </div>
          <div className="flex items-center gap-4 text-[#8c9087]">
            <span className="bg-[#f7f5ed] border border-[#e9e5d9] px-3 py-1 rounded-full text-[11px] font-medium text-[#1c2826]">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <button className="relative bg-transparent border-none text-[#8c9087] cursor-pointer hover:text-[#1c2826]">
              <Bell className="w-[18px] h-[18px]" />
              {escalationCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#d96b27] rounded-full" />}
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {/* Header Title Banner */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d96b27] flex items-center gap-1.5 m-0 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d96b27]" />
                {activeMenu === 'daily' ? 'OPERASIONAL HARIAN' : 'PENANGANAN PRIORITAS'}
              </p>
              <h1 className="text-[24px] font-bold text-[#1c2826] m-0">
                {activeMenu === 'daily' ? 'Catatan Pesanan & Harian' : 'Eskalasi Kasus Khusus'}
              </h1>
            </div>

            {/* Metric Counter Badges */}
            <div className="flex gap-3">
              <div className="bg-white border border-[#e9e5d9] rounded-[12px] px-4 py-2 text-center min-w-[100px] shadow-sm">
                <span className="text-[10px] text-[#8c9087] font-bold uppercase block tracking-wider">TINDAKAN</span>
                <span className="text-[20px] font-bold text-[#1c2826]">{pendingCount}</span>
              </div>
              <div className="bg-white border border-[#e9e5d9] rounded-[12px] px-4 py-2 text-center min-w-[100px] shadow-sm">
                <span className="text-[10px] text-[#2f6850] font-bold uppercase block tracking-wider">SELESAI</span>
                <span className="text-[20px] font-bold text-[#2f6850]">{resolvedCount}</span>
              </div>
            </div>
          </div>

          {/* Grid Layout Form & Table */}
          <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
            <CsForm allowedCategories={visibleCategories} isEscalationMenu={activeMenu === 'escalation'} />
            <CsTable
              reports={visibleReports}
              onStatusChange={cycleStatus}
              onDelete={deleteReport}
              onUpdate={updateReport}
              isEscalationMenu={activeMenu === 'escalation'}
            />
          </div>
        </div>
      </main>
    </div>
  )
}