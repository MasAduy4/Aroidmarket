import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout'; // Import Layout Utama
import { 
    ClipboardList, Plus, CheckCircle, ShieldCheck, Trash2, 
    Printer, Calendar, User, FileText, Check, Clock 
} from 'lucide-react';

export default function JobdeskIndex({ jobDesks = [], auth }) {
    // Cek apakah user yang login adalah manager (berdasarkan role/is_manager di database)
    const isManager = auth?.user?.role === 'manager' || auth?.user?.is_manager;

    // State untuk Modal Tambah Jobdesk Mandiri
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form handling menggunakan Inertia useForm
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        target_date: new Date().toISOString().split('T')[0],
        user_id: auth?.user?.id, // Default ke user yang sedang login
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('jobdesks.store'), {
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            },
        });
    };

    const handleComplete = (id) => {
        router.patch(route('jobdesks.complete', id));
    };

    const handleValidate = (id) => {
        router.patch(route('jobdesks.validate', id));
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus jobdesk ini?')) {
            router.delete(route('jobdesks.destroy', id));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout title="Manajemen JobDesk">
            <Head title="Manajemen JobDesk — GreenSpace" />

            {/* Header / Banner Halaman */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-emerald-900/10 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-emerald-950 font-['Sora',sans-serif]">GreenSpace JobDesk</h1>
                            <p className="text-sm text-slate-500">
                                {isManager ? 'Panel Pengawasan & Rekapitulasi Manager PMS' : 'Panel Aktivitas & Rencana Kerja Harian Tim'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {!isManager && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Tambah Jobdesk
                        </button>
                    )}
                    {isManager && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm print:hidden cursor-pointer"
                        >
                            <Printer className="w-4 h-4" /> Cetak Laporan Mingguan
                        </button>
                    )}
                </div>
            </div>

            {/* Konten Utama */}
            <div className="max-w-7xl mx-auto">
                {/* Tabel / Grid Kartu Jobdesk */}
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-900/10 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-semibold text-slate-900 font-['Sora',sans-serif]">
                            {isManager ? 'Rekapitulasi JobDesk Seluruh Tim' : 'Daftar JobDesk Saya'}
                        </h2>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60">
                            Total: {jobDesks.length} Tugas
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 font-semibold">
                                    <th className="p-4">No</th>
                                    {isManager && <th className="p-4">Nama Anggota</th>}
                                    <th className="p-4">Jobdesk</th>
                                    <th className="p-4">Target Tanggal</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center print:hidden">Aksi</th>
                                    <th className="p-4 text-center print:hidden">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {jobDesks.length > 0 ? (
                                    jobDesks.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                                            {isManager && (
                                                <td className="p-4 font-medium text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                                            {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <span>{item.user?.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900">{item.title}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{item.description || '-'}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {item.target_date}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {item.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                                {item.status === 'completed' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                                        <CheckCircle className="w-3 h-3" /> Selesai Dikerjakan
                                                    </span>
                                                )}
                                                {item.status === 'validated' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                        <ShieldCheck className="w-3 h-3" /> Valid (Disetujui)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap print:hidden">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Tombol untuk User: Ubah ke Selesai */}
                                                    {!isManager && item.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleComplete(item.id)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Selesaikan
                                                        </button>
                                                    )}

                                                    {/* Tombol untuk Manager: Validasi */}
                                                    {isManager && item.status === 'completed' && (
                                                        <button
                                                            onClick={() => handleValidate(item.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <ShieldCheck className="w-3.5 h-3.5" /> Validasi
                                                        </button>
                                                    )}

                                                    {/* Tombol Hapus */}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                        title="Hapus Jobdesk"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isManager ? 6 : 5} className="text-center py-12 text-slate-400">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">Belum ada data jobdesk yang tersedia.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Jobdesk (Khusus User) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 font-['Sora',sans-serif]">Tambah Jobdesk Mandiri</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Judul Tugas</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Contoh: Pemupukan Blok A"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Keterangan / Detail</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi singkat aktivitas..."
                                    rows="3"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Tanggal</label>
                                <input
                                    type="date"
                                    value={data.target_date}
                                    onChange={(e) => setData('target_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Simpan Jobdesk
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}