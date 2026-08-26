import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
  Sprout,
  Sparkles,
  Send,
  MapPin,
  BadgeCheck,
  Clock,
  CalendarDays,
  XCircle,
  Coins,
  Scale,
} from 'lucide-react';

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

function StatusPill({ status }) {
  const map = {
    'Tervalidasi':       'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Menunggu Validasi': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Ditolak':           'bg-red-100 text-red-700 border border-red-200',
  };
  const Icon = status === 'Tervalidasi' ? BadgeCheck : status === 'Ditolak' ? XCircle : Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

export default function UserIndex({ user = {}, lahanSaya = [], riwayat = [] }) {
  const [tab, setTab] = useState('Aktivitas Harian');

  const { data, setData, post, processing, reset, errors, setError, clearErrors, transform } = useForm({
    blok: '',
    jenis: 'Aktivitas Harian',
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: '',
    biaya: '',
    panen: '',
    hasil_panen: '',
  });

  // Helper untuk mengubah koma (,) menjadi titik (.) agar desimal terbaca presisi
  const parseDecimal = (val) => {
    if (!val) return 0;
    const sanitized = String(val).replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const submit = (e) => {
    e.preventDefault();
    clearErrors();

    // Validasi Manual di Frontend (Bahasa Indonesia)
    let hasError = false;

    if (!data.blok.trim()) {
      setError('blok', 'Blok / Lokasi Lahan wajib diisi.');
      hasError = true;
    }

    if (!data.catatan.trim()) {
      setError('catatan', 'Catatan Aktivitas wajib diisi.');
      hasError = true;
    }

    if (tab === 'Hasil Panen' && (!data.hasil_panen || parseDecimal(data.hasil_panen) <= 0)) {
      setError('hasil_panen', 'Jumlah hasil panen (kg) wajib diisi.');
      hasError = true;
    }

    // Hentikan proses pengiriman jika ada field wajib yang kosong
    if (hasError) return;

    transform((d) => ({
      ...d,
      jenis: tab,
      biaya: tab !== 'Hasil Panen' && d.biaya ? parseDecimal(d.biaya) : 0,
      total_pendapatan: tab === 'Hasil Panen' && d.panen ? parseDecimal(d.panen) : 0,
      jumlah_panen_kg: tab === 'Hasil Panen' && d.hasil_panen ? parseDecimal(d.hasil_panen) : 0,
      hasil_panen: tab === 'Hasil Panen' && d.hasil_panen ? parseDecimal(d.hasil_panen) : 0,
    }));

    post('/user/laporan', {
      preserveScroll: true,
      onSuccess: () => {
        reset('catatan', 'biaya', 'panen', 'hasil_panen', 'blok');
      },
    });
  };

  const tabs = [
    { key: 'Aktivitas Harian', icon: Sparkles },
    { key: 'Hasil Panen', icon: Sprout },
  ];

  return (
    <AppLayout title="Dashboard Petani">
      <Head title="Dashboard — OptimusFarm" />
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Form Input Laporan */}
        <form onSubmit={submit} noValidate className="rounded-3xl p-6 bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-50 shadow-lg shadow-emerald-900/20">
          <h3 className="font-[Sora,ui-sans-serif] font-bold text-lg tracking-tight mb-4">Input Laporan Harian</h3>

          {/* Tab Selector */}
          <div className="flex gap-1.5 p-1 bg-emerald-950/40 rounded-2xl mb-5 overflow-x-auto">
            {tabs.map(({ key, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  clearErrors();
                  setTab(key);
                }}
                className={`flex-1 min-w-max inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  tab === key ? 'bg-amber-400 text-emerald-950 shadow' : 'text-emerald-100/80 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {key}
              </button>
            ))}
          </div>

          {/* Input Blok Lahan */}
          <label className="block mb-3">
            <span className="text-xs font-medium text-emerald-200/80">Blok / Lokasi Lahan</span>
            <div className="mt-1 relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/60" />
              <input
                type="text"
                value={data.blok}
                onChange={(e) => setData('blok', e.target.value)}
                placeholder="Contoh: Sawah kidul / Blok A"
                className={`w-full pl-10 pr-3 py-2 rounded-xl bg-emerald-950/40 border text-emerald-50 placeholder-emerald-200/40 focus:ring-2 outline-none transition ${
                  errors.blok ? 'border-red-500 focus:ring-red-400/20' : 'border-emerald-700/40 focus:border-amber-400/60 focus:ring-amber-400/20'
                }`}
              />
            </div>
            {errors.blok && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.blok}</span>}
          </label>

          {/* Input Tanggal */}
          <label className="block mb-3">
            <span className="text-xs font-medium text-emerald-200/80">Tanggal</span>
            <div className="mt-1 relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/60" />
              <input
                type="date"
                value={data.tanggal}
                onChange={(e) => setData('tanggal', e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-50 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
              />
            </div>
            {errors.tanggal && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.tanggal}</span>}
          </label>

          {/* Form Bidang Khusus Aktivitas Harian */}
          {tab !== 'Hasil Panen' && (
            <label className="block mb-3">
              <span className="text-xs font-medium text-emerald-200/80">Biaya Operasional (Rp)</span>
              <input
                type="number"
                step="any"
                value={data.biaya}
                onChange={(e) => setData('biaya', e.target.value)}
                placeholder="0"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-50 placeholder-emerald-200/40 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
              />
              {errors.biaya && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.biaya}</span>}
            </label>
          )}

          {/* Form Bidang Khusus Hasil Panen */}
          {tab === 'Hasil Panen' && (
            <>
              <label className="block mb-3">
                <span className="text-xs font-medium text-emerald-200/80">Hasil Panen (kg)</span>
                <div className="mt-1 relative">
                  <Scale className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/60" />
                  <input
                    type="number"
                    step="any"
                    value={data.hasil_panen}
                    onChange={(e) => setData('hasil_panen', e.target.value)}
                    placeholder="Contoh: 300"
                    className={`w-full pl-10 pr-3 py-2 rounded-xl bg-emerald-950/40 border text-emerald-50 placeholder-emerald-200/40 focus:ring-2 outline-none transition ${
                      errors.hasil_panen ? 'border-red-500 focus:ring-red-400/20' : 'border-emerald-700/40 focus:border-amber-400/60 focus:ring-amber-400/20'
                    }`}
                  />
                </div>
                {errors.hasil_panen && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.hasil_panen}</span>}
              </label>

              <label className="block mb-3">
                <span className="text-xs font-medium text-emerald-200/80">Nilai / Pendapatan Panen (Rp)</span>
                <input
                  type="number"
                  step="any"
                  value={data.panen}
                  onChange={(e) => setData('panen', e.target.value)}
                  placeholder="Contoh: 500000"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-50 placeholder-emerald-200/40 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                />
                {errors.panen && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.panen}</span>}
              </label>
            </>
          )}

          {/* Input Catatan */}
          <label className="block mb-4">
            <span className="text-xs font-medium text-emerald-200/80">Catatan Aktivitas</span>
            <textarea
              value={data.catatan}
              onChange={(e) => setData('catatan', e.target.value)}
              rows={3}
              placeholder="Deskripsi aktivitas / bahan / hasil…"
              className={`mt-1 w-full px-3 py-2 rounded-xl bg-emerald-950/40 border text-emerald-50 placeholder-emerald-200/40 focus:ring-2 outline-none transition resize-none ${
                errors.catatan ? 'border-red-500 focus:ring-red-400/20' : 'border-emerald-700/40 focus:border-amber-400/60 focus:ring-amber-400/20'
              }`}
            />
            {errors.catatan && <span className="text-xs text-red-400 mt-1 block font-medium">{errors.catatan}</span>}
          </label>

          <button
            type="submit"
            disabled={processing}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-semibold transition disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {processing ? 'Mengirim…' : 'Kirim Laporan'}
          </button>
        </form>

        {/* Tabel Riwayat Laporan Petani */}
        <div className="rounded-3xl bg-white border border-emerald-900/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-900/10">
            <h3 className="font-[Sora,ui-sans-serif] font-bold text-lg tracking-tight">Riwayat Laporan Saya</h3>
            <p className="text-xs text-emerald-900/60 mt-0.5">Status laporan yang kamu kirim.</p>
          </div>
          <ul className="divide-y divide-emerald-900/5 max-h-[520px] overflow-y-auto">
            {riwayat.length === 0 && (
              <li className="px-6 py-10 text-center text-sm text-emerald-900/50">Belum ada laporan.</li>
            )}
            {riwayat.map((r) => {
              const nominal = Number(r.biaya || r.total_pendapatan || 0);
              const labelNominal = r.jenis === 'Hasil Panen' ? 'Panen' : 'Biaya';
              const hasilPanenKg = Number(r.hasil_panen || r.jumlah_panen_kg || 0);

              return (
                <li key={r.id} className="px-6 py-4 hover:bg-emerald-50/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-emerald-950">{r.jenis}</div>
                      
                      <div className="text-xs text-emerald-900/70 mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          Blok: {r.blok || '-'}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> {r.tanggal}
                        </span>
                        {r.jenis === 'Hasil Panen' && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              <Scale className="w-3.5 h-3.5 text-amber-700" /> {hasilPanenKg.toLocaleString('id-ID', { maximumFractionDigits: 3 })} kg
                            </span>
                          </>
                        )}
                        {nominal > 0 && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              <Coins className="w-3.5 h-3.5 text-emerald-700" /> {labelNominal}: {rupiah(nominal)}
                            </span>
                          </>
                        )}
                      </div>

                      {r.catatan && <p className="text-sm text-emerald-900/80 mt-2">{r.catatan}</p>}
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}