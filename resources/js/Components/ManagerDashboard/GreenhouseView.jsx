import React, { useState } from 'react'
import { router } from '@inertiajs/react'

function StatusBadge({ value }) {
  const s = String(value || '').toLowerCase()

  let badgeClass = 'status-progress'
  if (s === 'available') badgeClass = 'status-success'
  if (s === 'indukan') badgeClass = 'status-warning'
  if (s === 'sold') badgeClass = 'status-muted'

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="status-dot" />
      {value}
    </span>
  )
}

function formatRupiah(amount) {
  if (!amount || Number(amount) === 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function GreenhouseView({
  greenhousePlants = [],
  greenhouseStats = {},
  laporanPanen = [],
  laporanAktivitas = [],
  filters = {},
}) {
  const plantList = Array.isArray(greenhousePlants) ? greenhousePlants : (greenhousePlants?.data || [])
  const panenList = Array.isArray(laporanPanen) ? laporanPanen : (laporanPanen?.data || [])
  const aktivitasList = Array.isArray(laporanAktivitas) ? laporanAktivitas : (laporanAktivitas?.data || [])
  const combinedLaporan = panenList.concat(aktivitasList)

  // State Filter Local & Query
  const [search, setSearch] = useState(filters.search || '')
  const [status, setStatus] = useState(filters.status || '')
  const [health, setHealth] = useState(filters.health_condition || '')

  // Fungsi Kirim Filter ke Backend via Inertia
  const triggerBackendFilter = (newSearch, newStatus, newHealth) => {
    router.get(
      window.location.pathname,
      {
        search: newSearch,
        status: newStatus,
        health_condition: newHealth,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    )
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerBackendFilter(search, status, health)
    }
  }

  const handleStatusChange = (e) => {
    const val = e.target.value
    setStatus(val)
    triggerBackendFilter(search, val, health)
  }

  const handleHealthChange = (e) => {
    const val = e.target.value
    setHealth(val)
    triggerBackendFilter(search, status, val)
  }

  const handleReset = () => {
    setSearch('')
    setStatus('')
    setHealth('')
    triggerBackendFilter('', '', '')
  }

  // Filter Client-Side (Responsif & Instant saat data sudah dimuat)
  const filteredPlantList = plantList.filter((plant) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      plant.name?.toLowerCase().includes(searchLower) ||
      plant.barcode?.toLowerCase().includes(searchLower) ||
      plant.sku?.toLowerCase().includes(searchLower) ||
      plant.variegation?.toLowerCase().includes(searchLower)

    const matchesStatus = !status || String(plant.status).toLowerCase() === status.toLowerCase()
    const matchesHealth = !health || String(plant.health_condition).toLowerCase() === health.toLowerCase()

    return matchesSearch && matchesStatus && matchesHealth
  })

  const isFiltered = Boolean(search || status || health)

  return (
    <div className="view-stack">
      {/* 1. TABEL INVENTARIS TANAMAN REAL-TIME DARI PJ GREENHOUSE */}
      <article className="panel table-panel">
        <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">INVENTARIS STOK</p>
            <h2>Daftar Tanaman PJ Greenhouse Hub</h2>
          </div>

          {/* BAR FILTER & PENCARIAN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Input Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari tanaman / barcode... (Enter)"
                style={{
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #e9e5d9',
                  backgroundColor: '#fdfcf7',
                  fontSize: '12px',
                  color: '#1c2826',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>

            {/* Dropdown Status */}
            <select
              value={status}
              onChange={handleStatusChange}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #e9e5d9',
                backgroundColor: '#fdfcf7',
                fontSize: '12px',
                color: '#1c2826',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Semua Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="indukan">Indukan</option>
            </select>

            {/* Dropdown Kondisi Kesehatan */}
            <select
              value={health}
              onChange={handleHealthChange}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #e9e5d9',
                backgroundColor: '#fdfcf7',
                fontSize: '12px',
                color: '#1c2826',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Semua Kondisi</option>
              <option value="sehat">Sehat</option>
              <option value="tidak_sehat">Tidak Sehat</option>
            </select>

            {/* Tombol Reset */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TANAMAN</th>
                <th>SKU / BARCODE</th>
                <th>STOK</th>
                <th>HARGA</th>
                <th>LOKASI</th>
                <th>STATUS</th>
                <th>KONDISI</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlantList.length > 0 ? (
                filteredPlantList.map((plant, idx) => (
                  <tr key={plant.id || idx}>
                    <td>
                      <strong>{plant.name}</strong>
                      {(plant.variegation || plant.category?.name) && (
                        <div className="text-xs text-muted">
                          {plant.category?.name || 'Aroid'} {plant.variegation ? `· ${plant.variegation}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <code className="font-mono">{plant.barcode || plant.sku || '-'}</code>
                    </td>
                    <td>{plant.stock_qty ?? plant.stok ?? 0} pcs</td>
                    <td>{plant.status === 'indukan' ? '-' : formatRupiah(plant.unit_price || plant.harga)}</td>
                    <td>{plant.greenhouse_location || plant.lokasi || '-'}</td>
                    <td>
                      <StatusBadge value={plant.status || 'AVAILABLE'} />
                    </td>
                    <td>
                      <span className={`status-badge ${plant.health_condition === 'tidak_sehat' ? 'status-danger' : 'status-success'}`}>
                        {plant.health_condition === 'tidak_sehat' ? 'Tidak Sehat' : 'Sehat'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 muted-cell">
                    Tidak ada data tanaman yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}