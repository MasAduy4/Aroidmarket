import React, { useState, useEffect } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import axios from 'axios'
import {
  Boxes, Edit3, FileBarChart2, Filter, Leaf,
  PackageCheck, Plus, Search, Sprout, Tag, Warehouse, Barcode, Check, X, AlertTriangle, Trash2,
  Bell, Settings, LogOut, ChevronDown, ShieldAlert
} from 'lucide-react'

/* ==========================================================================
   1. HELPERS & FORMATTERS
   ========================================================================== */
export function formatCurrency(value) {
  if (!value || Number(value) === 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

// Helper untuk memformat angka dengan separator titik (contoh: 85000 -> 85.000)
export function formatDisplayNumber(value) {
  if (!value) return ''
  const cleanVal = String(value).replace(/\D/g, '')
  if (!cleanVal) return ''
  return new Intl.NumberFormat('id-ID').format(cleanVal)
}

// Helper untuk membaca nominal (Satuan, Ribuan, Jutaan, Miliar, dsb)
export function formatNominalText(value) {
  const num = Number(String(value).replace(/\D/g, ''))
  if (!num || isNaN(num)) return ''

  if (num < 1000) return `${num} Rupiah`
  if (num < 1000000) {
    const val = num / 1000
    return `${Number.isInteger(val) ? val : val.toFixed(1).replace('.', ',')} Ribu Rupiah`
  }
  if (num < 1000000000) {
    const val = num / 1000000
    return `${Number.isInteger(val) ? val : val.toFixed(2).replace('.', ',')} Juta Rupiah`
  }
  if (num < 1000000000000) {
    const val = num / 1000000000
    return `${Number.isInteger(val) ? val : val.toFixed(2).replace('.', ',')} Miliar Rupiah`
  }
  return `${new Intl.NumberFormat('id-ID').format(num)} Rupiah`
}

export function getStatusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'available') return 'bg-[#e8f5e9] text-[#2f6850] border-[#2f6850]/20'
  if (s === 'sold') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (s === 'indukan') return 'bg-[#fff3e0] text-[#d96b27] border-[#d96b27]/20'
  return 'bg-[#f7f5ed] text-[#1c2826] border-[#e9e5d9]'
}

export function getHealthClass(health) {
  const h = health?.toLowerCase()
  return h === 'sehat' ? 'bg-[#e8f5e9] text-[#2f6850]' : 'bg-rose-50 text-rose-700'
}

function Field({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-xs font-semibold text-[#1c2826]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-500 font-normal">{error}</span>}
    </div>
  )
}

/* ==========================================================================
   2. MODAL COMPONENTS
   ========================================================================== */
function ModalFrame({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="bg-white rounded-[16px] p-6 w-full max-w-2xl shadow-xl border border-[#e9e5d9] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#e9e5d9] mb-5">
          <div>
            <h2 className="text-[18px] font-bold text-[#1c2826] m-0">{title}</h2>
            {subtitle && <p className="text-xs text-[#8c9087] m-0 mt-0.5">{subtitle}</p>}
          </div>
          <button 
            aria-label="Tutup" 
            onClick={onClose} 
            className="border-none bg-transparent cursor-pointer text-[#8c9087] hover:text-[#1c2826] p-1 rounded-[6px] hover:bg-[#f7f5ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PlantModal({ open, plant, categories = [], onClose }) {
  const isEdit = Boolean(plant)

  const { data, setData, post, put, processing, errors, reset } = useForm({
    plant_category_id: '',
    name: '',
    variegation: '',
    status: 'available',
    health_condition: 'sehat',
    health_note: '',
    stock_qty: 1,
    unit_price: '',
    greenhouse_location: '',
    barcode: '',
    barcodes: [''],
    description: '',
  })

  useEffect(() => {
    if (open) {
      if (plant) {
        setData({
          plant_category_id: plant.plant_category_id || (categories[0]?.id || ''),
          name: plant.name || '',
          variegation: plant.variegation || '',
          status: plant.status || 'available',
          health_condition: plant.health_condition || 'sehat',
          health_note: plant.health_note || '',
          stock_qty: plant.stock_qty || 1,
          unit_price: plant.unit_price ? String(plant.unit_price) : '',
          greenhouse_location: plant.greenhouse_location || '',
          barcode: plant.barcode || '',
          barcodes: [plant.barcode || ''],
          description: plant.description || '',
        })
      } else {
        reset()
        if (categories.length > 0) setData('plant_category_id', categories[0].id)
        setData('barcodes', [''])
      }
    }
  }, [open, plant])

  const handleStockChange = (e) => {
    const qty = Math.max(1, parseInt(e.target.value) || 1)
    
    if (!isEdit) {
      const currentBarcodes = [...data.barcodes]
      if (qty > currentBarcodes.length) {
        while (currentBarcodes.length < qty) {
          currentBarcodes.push('')
        }
      } else {
        currentBarcodes.length = qty
      }
      setData((prev) => ({ ...prev, stock_qty: qty, barcodes: currentBarcodes }))
    } else {
      setData('stock_qty', qty)
    }
  }

  const handleBarcodeChange = (index, value) => {
    const updated = [...data.barcodes]
    updated[index] = value
    setData('barcodes', updated)
  }

  const handleBarcodeKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextInput = document.getElementById(`barcode-input-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const getDuplicateFormError = (index) => {
    const val = data.barcodes[index]?.trim()
    if (!val) return null
    const occurrences = data.barcodes.filter((b) => b?.trim() === val).length
    return occurrences > 1 ? 'Barcode ganda terdeteksi di dalam form.' : null
  }

  if (!open) return null

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) {
      put(`/pj-greenhouse/${plant.id}`, {
        onSuccess: () => onClose(),
      })
    } else {
      post('/pj-greenhouse', {
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    }
  }

  const inputStyle = "h-[42px] bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] px-[12px] text-xs font-medium text-[#1c2826] outline-none focus:bg-white focus:border-[#2f6850] transition-colors placeholder:text-[#8c9087] w-full"
  const selectStyle = "h-[42px] bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] px-[12px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer focus:bg-white focus:border-[#2f6850] transition-colors w-full"

  return (
    <ModalFrame title={isEdit ? 'Edit Data Tanaman' : 'Tambah Tanaman Baru'} subtitle="Lengkapi detail inventori dan lokasi tanaman." onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 text-xs">
        <Field label="Kategori" error={errors.plant_category_id} required>
          <div className="relative">
            <select className={selectStyle} value={data.plant_category_id} onChange={(e) => setData('plant_category_id', e.target.value)} required>
              <option value="" disabled>Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-[12px] top-[13px] w-4 h-4 text-[#8c9087] pointer-events-none" />
          </div>
        </Field>

        <Field label="Nama Tanaman" error={errors.name} required>
          <input className={inputStyle} required value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Monstera Deliciosa" />
        </Field>

        <Field label="Varian / Variegata" error={errors.variegation}>
          <input className={inputStyle} value={data.variegation} onChange={(e) => setData('variegation', e.target.value)} placeholder="Albo Variegata" />
        </Field>

        <Field label="Jumlah Stok (Pot)" error={errors.stock_qty} required>
          <input 
            className={`${inputStyle} ${isEdit ? 'disabled:bg-[#f7f5ed] disabled:text-[#8c9087]' : ''}`} 
            required 
            min="1" 
            type="number" 
            disabled={isEdit}
            value={data.stock_qty} 
            onChange={handleStockChange} 
          />
        </Field>

        <div className="sm:col-span-2 border-t border-b border-[#e9e5d9] py-3 my-1 bg-[#fdfcf7] -mx-6 px-6">
          <p className="text-xs font-bold text-[#1c2826] m-0 mb-1 flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-[#2f6850]" />
            Scan / Input Stiker Barcode Fisik <span className="text-red-500">*</span>
          </p>
          <p className="text-[11px] text-[#8c9087] m-0 mb-3">
            {isEdit 
              ? 'Barcode unik untuk pot tanaman ini.' 
              : `Scan stiker barcode fisik sebanyak ${data.stock_qty} pot. Tekan Enter untuk lanjut ke pot berikutnya.`
            }
          </p>

          {isEdit ? (
            <Field label="Barcode Unik" error={errors.barcode}>
              <input 
                className={inputStyle} 
                value={data.barcode} 
                onChange={(e) => setData('barcode', e.target.value)} 
                placeholder="Scan barcode..." 
              />
            </Field>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.barcodes.map((code, idx) => {
                const formDuplicateError = getDuplicateFormError(idx)
                const backendError = errors[`barcodes.${idx}`] || (idx === 0 ? errors.barcodes : null)
                const activeError = formDuplicateError || backendError

                return (
                  <Field 
                    key={idx} 
                    label={`Barcode Pot #${idx + 1}`} 
                    error={activeError} 
                    required
                  >
                    <div className="relative">
                      <input
                        id={`barcode-input-${idx}`}
                        className={`${inputStyle} ${activeError ? 'border-red-500 bg-red-50/30' : ''}`}
                        required
                        value={code}
                        onChange={(e) => handleBarcodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBarcodeKeyDown(e, idx)}
                        placeholder={`Scan stiker pot #${idx + 1}...`}
                      />
                      {code && !activeError && (
                        <Check className="absolute right-[12px] top-[13px] w-4 h-4 text-[#2f6850] pointer-events-none" />
                      )}
                      {activeError && (
                        <AlertTriangle className="absolute right-[12px] top-[13px] w-4 h-4 text-red-500 pointer-events-none" />
                      )}
                    </div>
                  </Field>
                )
              })}
            </div>
          )}
        </div>

        <Field label="Harga Satuan (Rp)" error={errors.unit_price}>
          <div className="flex flex-col gap-1">
            <input
              className={`${inputStyle} disabled:bg-[#f7f5ed] disabled:text-[#8c9087]`}
              disabled={data.status === 'indukan'}
              type="text"
              value={data.status === 'indukan' ? '' : formatDisplayNumber(data.unit_price)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, '')
                setData('unit_price', rawValue)
              }}
              placeholder={data.status === 'indukan' ? 'Tidak berlaku' : '85.000'}
            />
            {data.unit_price && data.status !== 'indukan' && (
              <span className="text-[11px] font-semibold text-[#2f6850]">
                ≈ {formatNominalText(data.unit_price)}
              </span>
            )}
          </div>
        </Field>

        <Field label="Lokasi Greenhouse" error={errors.greenhouse_location}>
          <input className={inputStyle} value={data.greenhouse_location} onChange={(e) => setData('greenhouse_location', e.target.value)} placeholder="Rak A1" />
        </Field>

        <Field label="Status" error={errors.status}>
          <div className="relative">
            <select className={selectStyle} value={data.status} onChange={(e) => setData('status', e.target.value)}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="indukan">Indukan</option>
            </select>
            <ChevronDown className="absolute right-[12px] top-[13px] w-4 h-4 text-[#8c9087] pointer-events-none" />
          </div>
        </Field>

        <Field label="Kondisi Kesehatan" error={errors.health_condition}>
          <div className="relative">
            <select className={selectStyle} value={data.health_condition} onChange={(e) => setData('health_condition', e.target.value)}>
              <option value="sehat">Sehat</option>
              <option value="tidak_sehat">Tidak Sehat</option>
            </select>
            <ChevronDown className="absolute right-[12px] top-[13px] w-4 h-4 text-[#8c9087] pointer-events-none" />
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="h-[38px] px-4 rounded-[8px] border border-[#e9e5d9] bg-white text-xs font-semibold cursor-pointer hover:bg-[#f7f5ed] text-[#1c2826] transition-colors">
            Batal
          </button>
          <button type="submit" disabled={processing} className="h-[38px] px-4 rounded-[8px] border-none bg-[#2f6850] text-white text-xs font-semibold cursor-pointer hover:bg-[#255340] transition-colors disabled:opacity-70">
            {processing ? 'Menyimpan...' : 'Simpan Tanaman'}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}

export function BarcodeModal({ open, onClose }) {
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setBarcode('')
      setResult(null)
      setErrorMessage('')
    }
  }, [open])

  const handleValidate = async (e) => {
    e?.preventDefault()
    if (!barcode.trim()) return

    setLoading(true)
    setErrorMessage('')
    setResult(null)

    try {
      const response = await axios.post('/pj-greenhouse/validate-barcode', { barcode: barcode.trim() })
      setResult(response.data)
    } catch (err) {
      const respData = err.response?.data
      // Jika backend mengembalikan data tanaman meskipun statusnya error/tidak valid
      if (respData?.data || respData?.plant) {
        setResult({
          data: respData.data || respData.plant,
          message: respData.message
        })
      } else {
        setErrorMessage(respData?.message || 'Barcode tidak ditemukan.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkSold = (plantId) => {
    router.post(`/pj-greenhouse/${plantId}/sold`, {}, {
      onSuccess: () => onClose()
    })
  }

  if (!open) return null

  const plant = result?.data
  const plantStatus = plant?.status?.toLowerCase()
  const isHealthOk = (plant?.health_condition || plant?.kondisi)?.toLowerCase() === 'sehat'

  return (
    <ModalFrame title="Validasi Barcode & Keluarkan" subtitle="Scan atau masukkan barcode untuk memvalidasi status tanaman." onClose={onClose}>
      <div className="flex flex-col gap-4 text-xs">
        <form onSubmit={handleValidate} className="flex items-center gap-2 rounded-[10px] border border-[#e9e5d9] bg-[#fdfcf7] p-2">
          <Barcode className="w-5 h-5 text-[#2f6850] shrink-0 ml-1" />
          <input
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Masukkan barcode tanaman lalu tekan Enter..."
            className="min-w-0 flex-1 bg-transparent text-xs outline-none text-[#1c2826] placeholder:text-[#8c9087]"
          />
          <button type="submit" disabled={loading} className="h-[34px] px-3 bg-[#2f6850] text-white font-semibold rounded-[8px] text-xs border-none cursor-pointer hover:bg-[#255340] transition-colors">
            {loading ? 'Cek...' : 'Periksa'}
          </button>
        </form>

        {/* Hanya tampil jika barcode benar-benar tidak terdaftar di database */}
        {errorMessage && (
          <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Card Detail Tanaman (Selalu muncul jika tanaman ditemukan) */}
        {plant && (
          <div className="rounded-[12px] border border-[#e9e5d9] bg-[#fdfcf7] p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-[#1c2826] text-sm m-0">{plant.name || plant.nama_tanaman}</p>
                <p className="text-xs text-[#8c9087] m-0 mt-0.5">
                  {plant.barcode || plant.kode_barcode} · {plant.greenhouse_location || plant.variegation || 'Standard'}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${getStatusClass(plant.status)}`}>
                {plant.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-[#e9e5d9]">
              <div>
                <p className="text-[#8c9087] text-[11px] m-0">Kondisi Kesehatan</p>
                <p className={isHealthOk ? 'font-bold text-[#2f6850] m-0' : 'font-bold text-rose-700 m-0'}>
                  {isHealthOk ? 'Sehat' : 'Tidak Sehat'}
                </p>
              </div>
              <div>
                <p className="text-[#8c9087] text-[11px] m-0">Harga</p>
                <p className="font-bold text-[#1c2826] m-0">{plantStatus === 'indukan' ? '—' : formatCurrency(plant.unit_price || plant.harga)}</p>
              </div>
            </div>

            {/* Box Peringatan Dinamis berdasarkan Status & Kesehatan */}
            {plantStatus === 'sold' && (
              <div className="rounded-[8px] bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Tanaman ini sudah berstatus <strong>SOLD (terjual)</strong>.</span>
              </div>
            )}

            {plantStatus === 'indukan' && (
              <div className="rounded-[8px] bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Tanaman ini berstatus <strong>INDUKAN</strong> dan tidak boleh dijual.</span>
              </div>
            )}

            {plantStatus === 'available' && !isHealthOk && (
              <div className="rounded-[8px] bg-[#fff3e0] border border-[#ffedd5] p-3 text-xs font-medium text-[#9a3412] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#d96b27]" />
                <span>Peringatan: Tanaman ini terdeteksi <strong>TIDAK SEHAT!</strong></span>
              </div>
            )}

            {result?.message && plantStatus === 'available' && isHealthOk && (
              <div className="rounded-[8px] bg-[#fff3e0] border border-[#ffedd5] p-3 text-xs font-medium text-[#9a3412] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#d96b27]" />
                <span>{result.message}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="h-[36px] px-4 rounded-[8px] border border-[#e9e5d9] bg-white text-xs font-semibold cursor-pointer hover:bg-[#f7f5ed] text-[#1c2826]">
            Tutup
          </button>
          
          {/* Tombol Tandai Sold HANYA MUNCUL jika status === 'available' */}
          {plant && plantStatus === 'available' && (
            <button onClick={() => handleMarkSold(plant.id)} className="h-[36px] px-4 rounded-[8px] border-none bg-[#2f6850] text-white text-xs font-semibold cursor-pointer hover:bg-[#255340] transition-colors">
              Tandai Sold
            </button>
          )}
        </div>
      </div>
    </ModalFrame>
  )
}

/* ==========================================================================
   3. MAIN DASHBOARD PAGE
   ========================================================================== */
export default function PjGreenhouse({ plants = { data: [], links: [] }, categories = [], stats = {}, filters = {} }) {
  const [activeMenu, setActiveMenu] = useState('inventory')
  const [search, setSearch] = useState(filters.search || '')
  const [status, setStatus] = useState(filters.status || '')
  const [health, setHealth] = useState(filters.health_condition || '')
  const [plantModal, setPlantModal] = useState({ open: false, plant: null })
  const [barcodeOpen, setBarcodeOpen] = useState(false)

  const applyFilters = (newSearch, newStatus, newHealth) => {
    router.get('/pj-greenhouse', {
      search: newSearch,
      status: newStatus,
      health_condition: newHealth,
    }, {
      preserveState: true,
      replace: true,
    })
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters(search, status, health)
    }
  }

  const handleStatusChange = (e) => {
    const val = e.target.value
    setStatus(val)
    applyFilters(search, val, health)
  }

  const handleHealthChange = (e) => {
    const val = e.target.value
    setHealth(val)
    applyFilters(search, status, val)
  }

  const handleDelete = (plant) => {
    if (confirm(`Apakah Anda yakin ingin menghapus tanaman "${plant.name}"?`)) {
      router.delete(`/pj-greenhouse/${plant.id}`, {
        preserveScroll: true,
      })
    }
  }

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      router.post('/logout')
    }
  }

  const plantList = plants.data || []

  return (
    <>
      <Head title="PJ Greenhouse Hub - Inventory" />

      <div className="min-h-screen bg-[#f7f5ed] flex text-[#1c2826] font-sans">
        {/* SIDEBAR */}
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
                GH
              </div>
              <div>
                <p className="text-[9px] text-[#8c9087] m-0 uppercase tracking-[0.05em] font-semibold">WORKSPACE AKTIF</p>
                <p className="text-xs font-bold text-white m-0">PJ Greenhouse</p>
              </div>
            </div>

            {/* Navigasi */}
            <nav className="flex flex-col gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8c9087] px-2 mb-2">OPERASIONAL GREENHOUSE</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveMenu('inventory')}
                    className={`w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] text-left border-none cursor-pointer transition-colors ${
                      activeMenu === 'inventory'
                        ? 'bg-[#2f6850] text-white font-semibold'
                        : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-normal'
                    }`}
                  >
                    <Warehouse className="w-[16px] h-[16px] shrink-0" />
                    <span className="text-xs">Inventory Tanaman</span>
                  </button>
                </div>
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
                <div className="w-[30px] h-[30px] rounded-full bg-[#2f6850] text-white text-xs font-bold flex items-center justify-center shrink-0">GH</div>
                <div>
                  <p className="text-xs font-semibold m-0 leading-none text-white">Greenhouse Lead</p>
                  <p className="text-[10px] text-[#8c9087] m-0 mt-0.5">Aroid Market</p>
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Topbar Navigation */}
          <header className="h-[60px] bg-white border-b border-[#e9e5d9] flex items-center justify-between px-8 text-xs shrink-0">
            <div className="flex items-center gap-2 text-[#8c9087]">
              <span className="text-[10px] font-bold tracking-wider uppercase">WORKSPACE</span>
              <span>/</span>
              <span className="font-bold text-[#1c2826] text-[11px]">PJ GREENHOUSE</span>
            </div>
            <div className="flex items-center gap-4 text-[#8c9087]">
              <span className="bg-[#f7f5ed] border border-[#e9e5d9] px-3 py-1 rounded-full text-[11px] font-medium text-[#1c2826]">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <button className="relative bg-transparent border-none text-[#8c9087] cursor-pointer hover:text-[#1c2826]">
                <Bell className="w-[18px] h-[18px]" />
              </button>
            </div>
          </header>

          <div className="p-8 flex-1 overflow-y-auto">
            {/* Header Title Banner */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d96b27] flex items-center gap-1.5 m-0 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d96b27]" />
                  OPERASIONAL GREENHOUSE
                </p>
                <h1 className="text-[24px] font-bold text-[#1c2826] m-0">Inventory Tanaman</h1>
                <p className="text-xs text-[#8c9087] m-0 mt-1">Pantau stok, kondisi, dan status tanaman Aroid Market secara real-time.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBarcodeOpen(true)}
                  className="h-[38px] bg-white border border-[#e9e5d9] text-[#1c2826] font-semibold rounded-[10px] text-xs px-3.5 flex items-center gap-2 cursor-pointer hover:bg-[#f7f5ed] transition-colors shadow-sm"
                >
                  <Tag className="w-4 h-4 text-[#2f6850]" /> Validasi Barcode
                </button>
                <button
                  onClick={() => setPlantModal({ open: true, plant: null })}
                  className="h-[38px] bg-[#2f6850] text-white font-semibold rounded-[10px] text-xs px-3.5 flex items-center gap-2 border-none cursor-pointer hover:bg-[#255340] active:scale-[0.99] transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Tambah Tanaman
                </button>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-[#e9e5d9] rounded-[16px] p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c9087] m-0">TOTAL TANAMAN</p>
                  <p className="text-[22px] font-bold text-[#1c2826] mt-1 m-0">{stats.total_plants || 0}</p>
                  <p className="text-[11px] text-[#8c9087] mt-1 m-0">Total unit fisik</p>
                </div>
                <div className="w-9 h-9 rounded-[10px] bg-[#f7f5ed] text-[#1c2826] flex items-center justify-center shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white border border-[#e9e5d9] rounded-[16px] p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2f6850] m-0">AVAILABLE</p>
                  <p className="text-[22px] font-bold text-[#2f6850] mt-1 m-0">{stats.available_count || 0}</p>
                  <p className="text-[11px] text-[#8c9087] mt-1 m-0">Siap untuk dijual</p>
                </div>
                <div className="w-9 h-9 rounded-[10px] bg-[#e8f5e9] text-[#2f6850] flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white border border-[#e9e5d9] rounded-[16px] p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c9087] m-0">SOLD</p>
                  <p className="text-[22px] font-bold text-[#1c2826] mt-1 m-0">{stats.sold_count || 0}</p>
                  <p className="text-[11px] text-[#8c9087] mt-1 m-0">Sudah keluar/terjual</p>
                </div>
                <div className="w-9 h-9 rounded-[10px] bg-[#f7f5ed] text-[#8c9087] flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white border border-[#e9e5d9] rounded-[16px] p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d96b27] m-0">PERLU PERHATIAN</p>
                  <p className="text-[22px] font-bold text-[#d96b27] mt-1 m-0">{stats.need_attention || 0}</p>
                  <p className="text-[11px] text-[#8c9087] mt-1 m-0">Kondisi tidak sehat</p>
                </div>
                <div className="w-9 h-9 rounded-[10px] bg-[#fff3e0] text-[#d96b27] flex items-center justify-center shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* INVENTORY TABLE */}
            <section className="bg-white rounded-[16px] border border-[#e9e5d9] shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-[20px_24px] border-b border-[#e9e5d9] flex flex-wrap items-center justify-between gap-3 bg-[#fdfcf7]">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8c9087] mb-1">DAFTAR INVENTORI</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-bold text-[#1c2826] m-0">Daftar Tanaman</h2>
                      <span className="bg-[#2f6850]/10 text-[#2f6850] text-xs px-[8px] py-[2px] rounded-full font-bold">
                        {plants.total || plantList.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-[#e9e5d9] rounded-[8px] px-[10px] h-[36px] text-[#8c9087] w-[220px] focus-within:border-[#2f6850]">
                      <Search className="w-[14px] h-[14px] shrink-0" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Cari tanaman, barcode... (Enter)"
                        className="bg-transparent text-xs text-[#1c2826] outline-none border-none w-full placeholder:text-[#8c9087]"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={status}
                        onChange={handleStatusChange}
                        className="h-[36px] bg-white border border-[#e9e5d9] rounded-[8px] pl-[10px] pr-[28px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer focus:border-[#2f6850] capitalize"
                      >
                        <option value="">Semua Status</option>
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="indukan">Indukan</option>
                      </select>
                      <ChevronDown className="absolute right-[8px] top-[10px] w-[14px] h-[14px] text-[#8c9087] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={health}
                        onChange={handleHealthChange}
                        className="h-[36px] bg-white border border-[#e9e5d9] rounded-[8px] pl-[10px] pr-[28px] text-xs font-medium text-[#1c2826] outline-none appearance-none cursor-pointer focus:border-[#2f6850] capitalize"
                      >
                        <option value="">Semua Kondisi</option>
                        <option value="sehat">Sehat</option>
                        <option value="tidak_sehat">Tidak Sehat</option>
                      </select>
                      <ChevronDown className="absolute right-[8px] top-[10px] w-[14px] h-[14px] text-[#8c9087] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f7f5ed] border-b border-[#e9e5d9] text-[10px] uppercase tracking-[0.08em] font-bold text-[#8c9087]">
                        <th className="p-[12px_20px]">TANAMAN</th>
                        <th className="p-[12px_20px]">SKU / BARCODE</th>
                        <th className="p-[12px_20px]">STOK</th>
                        <th className="p-[12px_20px]">HARGA</th>
                        <th className="p-[12px_20px]">LOKASI</th>
                        <th className="p-[12px_20px]">STATUS</th>
                        <th className="p-[12px_20px]">KONDISI</th>
                        <th className="p-[12px_20px] text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-[#e9e5d9]">
                      {plantList.map((plant) => (
                        <tr key={plant.id} className="hover:bg-[#fdfcf7] transition-colors">
                          <td className="p-[14px_20px]">
                            <p className="font-bold text-[#1c2826] m-0 text-xs">{plant.name}</p>
                            <p className="text-[11px] text-[#8c9087] m-0 mt-0.5">
                              {plant.variegation || 'Standard'} · {plant.category?.name || 'Aroid'}
                            </p>
                          </td>
                          <td className="p-[14px_20px] font-mono text-xs">
                            <span className="font-bold text-[#2f6850] bg-[#2f6850]/10 border border-[#2f6850]/20 px-2 py-0.5 rounded text-[11px] inline-block">
                              {plant.barcode || '—'}
                            </span>
                          </td>
                          <td className="p-[14px_20px] font-semibold text-[#1c2826]">{plant.stock_qty} pcs</td>
                          <td className="p-[14px_20px] font-semibold text-[#1c2826]">
                            {plant.status === 'indukan' ? '—' : formatCurrency(plant.unit_price)}
                          </td>
                          <td className="p-[14px_20px] text-[#8c9087] font-medium">{plant.greenhouse_location || '—'}</td>
                          <td className="p-[14px_20px]">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase ${getStatusClass(plant.status)}`}>
                              {plant.status}
                            </span>
                          </td>
                          <td className="p-[14px_20px]">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getHealthClass(plant.health_condition)}`}>
                              {plant.health_condition === 'sehat' ? 'Sehat' : 'Tidak Sehat'}
                            </span>
                          </td>
                          <td className="p-[14px_20px] text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                title="Edit Tanaman"
                                onClick={() => setPlantModal({ open: true, plant })}
                                className="border-none bg-[#f7f5ed] p-[6px] rounded-[6px] cursor-pointer text-[#1c2826] hover:bg-[#e9e5d9] transition-colors"
                              >
                                <Edit3 className="w-[13px] h-[13px]" />
                              </button>
                              <button
                                title="Hapus Tanaman"
                                onClick={() => handleDelete(plant)}
                                className="border-none bg-red-50 p-[6px] rounded-[6px] cursor-pointer text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-[13px] h-[13px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {plantList.length === 0 && (
                    <div className="p-12 text-center text-xs text-[#8c9087]">
                      Tidak ada tanaman yang sesuai filter.
                    </div>
                  )}
                </div>
              </div>

              {/* PAGINATION */}
              {plants.links && plants.links.length > 3 && (
                <div className="p-[14px_24px] border-t border-[#e9e5d9] bg-[#fdfcf7] flex items-center justify-between text-xs text-[#8c9087]">
                  <span>
                    Halaman <strong className="text-[#1c2826] font-semibold">{plants.current_page}</strong> dari <strong className="text-[#1c2826] font-semibold">{plants.last_page}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    {plants.links.map((link, idx) => (
                      <button
                        key={idx}
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`h-[28px] px-2.5 rounded-[6px] text-xs font-medium border-none cursor-pointer transition-colors ${
                          link.active
                            ? 'bg-[#2f6850] text-white font-semibold'
                            : link.url
                            ? 'bg-white border border-[#e9e5d9] text-[#1c2826] hover:bg-[#f7f5ed]'
                            : 'bg-transparent text-[#8c9087] cursor-not-allowed'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODALS */}
      <PlantModal open={plantModal.open} plant={plantModal.plant} categories={categories} onClose={() => setPlantModal({ open: false, plant: null })} />
      <BarcodeModal open={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
    </>
  )
}