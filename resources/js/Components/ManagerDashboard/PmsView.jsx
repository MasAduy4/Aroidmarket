import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import ManagerMessageComposer from '@/Components/Notifications/ManagerMessageComposer';

import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Activity, 
  MoreHorizontal,
  Printer,
  Eye,
  X,
  Plus,
  Info,
  Edit3,
  Trash2
} from 'lucide-react';

// HELPER DOKUMEN / RUPIAH FORMATTER
const formatRupiah = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const formatNumberInput = (value) => {
  if (!value && value !== 0) return '';
  const rawValue = value.toString().replace(/\D/g, '');
  return new Intl.NumberFormat('id-ID').format(rawValue);
};

const parseRawNumber = (formattedValue) => {
  if (!formattedValue) return 0;
  return Number(formattedValue.toString().replace(/\D/g, ''));
};

const formatJutaDisplay = (val) => {
  if (val === 0) return '0Jt';
  const isInteger = Number.isInteger(val);
  return isInteger ? `${val}Jt` : `${val.toFixed(2)}Jt`;
};

const formatManagerMessageDate = (value) => {
  if (!value) return '-';

  const raw = String(value).trim();

  // ManagerMessageController sends Laravel's UTC timestamp as:
  // "DD Mon YYYY HH:mm". Treat it as UTC and display it as WIB.
  const match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2})$/);

  if (match) {
    const [, day, monthText, year, hour, minute] = match;
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const month = monthMap[monthText];

    if (month !== undefined) {
      const utcDate = new Date(Date.UTC(
        Number(year),
        month,
        Number(day),
        Number(hour),
        Number(minute)
      ));

      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(utcDate);
    }
  }

  return raw;
};

function MetricCard({ icon: Icon, label, value, trend, tone = 'green', onClick }) {
  return (
    <article 
      className={`metric-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} 
      onClick={onClick}
    >
      <div className={`metric-icon metric-icon-${tone}`}><Icon size={18} /></div>
      <div className="metric-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        {trend && <span className="trend-up">{trend}</span>}
      </div>
      <button className="icon-button subtle" aria-label={`Opsi ${label}`}><MoreHorizontal size={18} /></button>
    </article>
  );
}

function PerformanceChart({ viewMode, financeBreakdown = [], monthlyRevenueData = {} }) {
  const isYearly = viewMode === 'Tahun ini';

  const weeklyData = [0, 0, 0, 0];
  if (Array.isArray(financeBreakdown)) {
    financeBreakdown.forEach((item, index) => {
      if (index < 4) weeklyData[index] = Number(item.nominal || 0) / 1000000;
    });
  } else if (typeof financeBreakdown === 'object' && financeBreakdown !== null) {
    weeklyData[0] = Number(financeBreakdown.minggu_ke_1 || 0) / 1000000;
    weeklyData[1] = Number(financeBreakdown.minggu_ke_2 || 0) / 1000000;
    weeklyData[2] = Number(financeBreakdown.minggu_ke_3 || 0) / 1000000;
    weeklyData[3] = Number(financeBreakdown.minggu_ke_4 || 0) / 1000000;
  }
  const weeklyLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];

  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
  const monthlyData = monthlyLabels.map(m => {
    const rawVal = monthlyRevenueData[m] ?? 0;
    return Number(rawVal) / 1000000;
  });

  const data = isYearly ? monthlyData : weeklyData;
  const labels = isYearly ? monthlyLabels : weeklyLabels;
  const targetValue = isYearly ? 316 : 79; 

  const viewBoxWidth = 650;
  const viewBoxHeight = 240;
  const chartWidth = 560;
  const chartHeight = 150;
  const startX = 60; 
  const startY = 35;
  
  const maxDataVal = Math.max(...data, targetValue);
  const maxVal = Math.ceil((maxDataVal + 30) / 50) * 50 || (isYearly ? 400 : 100);

  const getY = (val) => startY + chartHeight - ((val / maxVal) * chartHeight);
  const stepX = chartWidth / (data.length - 1 || 1);
  const points = data.map((val, i) => `${startX + (i * stepX)},${getY(val)}`).join(' ');

  return (
    <div className="chart-wrap mt-2 space-y-3">
      <style>{`
        @keyframes drawLine {
          0% { stroke-dashoffset: 2000; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animated-line {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: drawLine 1.5s ease-out forwards;
        }
        .animated-dot {
          animation: fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: center;
        }
      `}</style>

      <div className="flex flex-wrap justify-between text-[11px] text-slate-500 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
        <span><strong className="text-slate-700">Target Per Minggu:</strong> Rp 79.000.000</span>
        <span><strong className="text-slate-700">Target Per Bulan:</strong> Rp 316.000.000</span>
        <span><strong className="text-slate-700">Target Per Tahun:</strong> Rp 3.160.000.000</span>
      </div>

      <svg className="weekly-chart w-full h-[260px] overflow-visible" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f6850" stopOpacity=".25" />
            <stop offset="100%" stopColor="#2f6850" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, Math.round(maxVal / 2), targetValue, maxVal].map((val, idx) => {
          const yPos = getY(val);
          const isTarget = val === targetValue;
          return (
            <g key={`${val}-${idx}`}>
              <text x="50" y={yPos + 4} textAnchor="end" fill={isTarget ? "#047857" : "#94a3b8"} fontSize="11" fontWeight={isTarget ? "bold" : "600"}>
                {val}Jt
              </text>
              <line 
                x1={startX} 
                x2={startX + chartWidth} 
                y1={yPos} 
                y2={yPos} 
                stroke={isTarget ? "#10b981" : "#f1f5f9"} 
                strokeDasharray={isTarget ? "5 4" : "none"} 
                strokeWidth={isTarget ? "1.8" : "1"} 
              />
            </g>
          );
        })}

        <path d={`M ${startX},${getY(data[0])} L ${points} L ${startX + chartWidth},${startY + chartHeight} L ${startX},${startY + chartHeight} Z`} fill="url(#chartFill)" />
        <polyline points={points} fill="none" stroke="#2f6850" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animated-line" />

        {data.map((val, index) => {
          const cx = startX + (index * stepX);
          const cy = getY(val);
          const reachedTarget = val >= targetValue;
          const animDelay = `${0.3 + index * 0.08}s`;

          return (
            <g key={index} className="animated-dot" style={{ animationDelay: animDelay }}>
              <circle cx={cx} cy={cy} r="5.5" fill={reachedTarget ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="2.5" className="shadow-sm" />
              <text x={cx} y={cy - 12} textAnchor="middle" fill="#1e293b" fontSize="10.5" fontWeight="bold">
                {formatJutaDisplay(val)}
              </text>
            </g>
          );
        })}

        {labels.map((label, index) => (
          <text key={label} x={startX + (index * stepX)} y={startY + chartHeight + 24} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
            {label}
          </text>
        ))}
      </svg>
      
      <div className="flex items-center justify-center gap-6 text-[11px] font-medium text-slate-600 border-t pt-2 border-slate-100">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Capai Target (&ge; {targetValue}Jt)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Di Bawah Target</span>
      </div>
    </div>
  );
}

export default function ManagerPmsView({ 
  stats, 
  reportsData = [], 
  managerMessages = [],
  jobdesksData = { cs: [], greenhouse: [], akuntansi: [], marketing: [] },
  jobdeskUsers = [],
  jobdeskSummary = {},
  financeBreakdown = [],
  monthlyRevenueData = {},
  endorseCandidates = [],
  endorseProps = []
}) {
  const [selectedDivision, setSelectedDivision] = useState('all');
  const managerMessageReports = (Array.isArray(managerMessages) ? managerMessages : []).map((message) => ({
    id: message.id,
    division: message.division || 'other',
    divisionLabel: message.divisionLabel || 'Lainnya',
    senderName: message.senderName || 'User',
    date: formatManagerMessageDate(message.date),
    title: message.title || `Pesan dari ${message.senderName || 'User'}`,
    content: message.content || message.message || '',
    status: 'Pesan',
    source: 'manager_message',
  }));

  const [detailModalItem, setDetailModalItem] = useState(null);
  const handleDeleteManagerMessage = (id) => {
    if (!window.confirm('Hapus pesan laporan ini?')) return;

    router.delete(`/manager-messages/${id}`, {
      preserveScroll: true,
    });
  };

  const [showAddJobdeskModal, setShowAddJobdeskModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showCrudMonthlyModal, setShowCrudMonthlyModal] = useState(false);
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [chartViewMode, setChartViewMode] = useState('Tahun ini');

  const normalizedCandidates = useMemo(() => {
    const raw = (endorseCandidates && endorseCandidates.length > 0) ? endorseCandidates : endorseProps;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [endorseCandidates, endorseProps]);

  const [editMonth, setEditMonth] = useState('Jan');
  const [displayNominal, setDisplayNominal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newJobdeskTitle, setNewJobdeskTitle] = useState('');
  const [newJobdeskDescription, setNewJobdeskDescription] = useState('');
  const [newJobdeskUserId, setNewJobdeskUserId] = useState('');
  const [newJobdeskTargetDate, setNewJobdeskTargetDate] = useState('');
  const [jobdeskSubmitting, setJobdeskSubmitting] = useState(false);
  const [jobdesks, setJobdesks] = useState(jobdesksData);

  // Filter daftar JobDesk Manager.
  const [jobdeskPeriodFilter, setJobdeskPeriodFilter] = useState('current');
  const [jobdeskDivisionFilter, setJobdeskDivisionFilter] = useState('all');
  const [jobdeskStatusFilter, setJobdeskStatusFilter] = useState('all');
  const [jobdeskRecipientFilter, setJobdeskRecipientFilter] = useState('all');
  const [jobdeskSearch, setJobdeskSearch] = useState('');

  useEffect(() => {
    if (jobdesksData) setJobdesks(jobdesksData);
  }, [jobdesksData]);

  // FIX: Sinkronisasi nominal input saat modal dibuka atau bulan diubah (Mencegah Infinite Loop)
  useEffect(() => {
    if (showCrudMonthlyModal) {
      const currentVal = monthlyRevenueData?.[editMonth] ?? 0;
      setDisplayNominal(formatNumberInput(currentVal));
    }
  }, [editMonth, showCrudMonthlyModal, monthlyRevenueData]);

  const currentJobdeskPeriods = Array.isArray(jobdeskSummary?.periods)
    ? jobdeskSummary.periods
    : [];

  const selectedJobdeskPeriod = jobdeskPeriodFilter === 'current'
    ? currentJobdeskPeriods.find((period) => period.isCurrent)
    : currentJobdeskPeriods.find((period) => period.key === jobdeskPeriodFilter);

  const jobdeskRows = selectedJobdeskPeriod?.jobs ?? Object.values(jobdesks || {}).flat();

  const filteredJobdeskRows = jobdeskRows.filter((job) => {
    const role = job.recipient?.role || '';
    const status = job.status || 'pending';
    const recipientId = String(job.recipient?.id ?? '');
    const query = jobdeskSearch.trim().toLowerCase();

    const matchesDivision =
      jobdeskDivisionFilter === 'all' || role === jobdeskDivisionFilter;

    const matchesStatus =
      jobdeskStatusFilter === 'all' || status === jobdeskStatusFilter;

    const matchesRecipient =
      jobdeskRecipientFilter === 'all' || recipientId === jobdeskRecipientFilter;

    const matchesSearch = !query || [
      job.title,
      job.description,
      job.recipient?.name,
      job.recipient?.role,
    ].some((value) => String(value ?? '').toLowerCase().includes(query));

    return matchesDivision && matchesStatus && matchesRecipient && matchesSearch;
  });

  const jobdeskRecipientOptions = Array.from(
    new Map(
      jobdeskRows
        .filter((job) => job.recipient?.id)
        .map((job) => [String(job.recipient.id), job.recipient])
    ).values()
  );

  const realStats = {
    totalJobdesk: stats?.totalJobdesk || 0,
    finansial: stats?.finansial || 0,
    totalInfluencer: normalizedCandidates.length || stats?.totalInfluencer || 0,
    totalPendapatanToDate: stats?.totalPendapatanToDate || 0,
  };

  const handleNominalChange = (e) => {
    const raw = parseRawNumber(e.target.value);
    setDisplayNominal(formatNumberInput(raw));
  };

  const handleSaveMonthlyRevenue = (e) => {
    e.preventDefault();
    const rawValue = parseRawNumber(displayNominal);

    setIsSubmitting(true);
    
    // SINKRONISASI KE ROUTE POST YANG BENAR DI MANAGER / WEB.PHP
    router.post(
      '/manager/monthly-revenue', 
      {
        month: editMonth,
        amount: rawValue,
        nominal: rawValue
      }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowCrudMonthlyModal(false);
          setIsSubmitting(false);
        },
        onError: () => setIsSubmitting(false)
      }
    );
  };

  const handleAddJobdeskSubmit = (e) => {
    e.preventDefault();

    if (!newJobdeskTitle.trim() || !newJobdeskUserId || !newJobdeskTargetDate) {
      return;
    }

    setJobdeskSubmitting(true);

    router.post(
      '/jobdesks',
      {
        user_id: Number(newJobdeskUserId),
        title: newJobdeskTitle.trim(),
        description: newJobdeskDescription.trim() || null,
        target_date: newJobdeskTargetDate,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNewJobdeskTitle('');
          setNewJobdeskDescription('');
          setNewJobdeskUserId('');
          setNewJobdeskTargetDate('');
          setShowAddJobdeskModal(false);
        },
        onFinish: () => setJobdeskSubmitting(false),
      }
    );
  };

  const combinedReports = [
    ...managerMessageReports,
    ...(Array.isArray(reportsData) ? reportsData : []),
  ];

  const filteredReports = selectedDivision === 'all'
    ? combinedReports
    : combinedReports.filter(r => r.division === selectedDivision);

  return (
    <div className="view-stack">
      <div id="printable-area" className="space-y-6">
        
        {/* HEADER BAR ATAS */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <p className="eyebrow">WORKSPACE / MANAGER PMS</p>
            <h1 className="text-2xl font-bold text-slate-900 m-0">Manager PMS</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddJobdeskModal(true)} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition">
              <Plus size={15} /> Tambah Jobdesk
            </button>
            <button onClick={() => window.print()} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition">
              <Printer size={15} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* METRIC GRID */}
        <section className="metric-grid">
          <MetricCard
            icon={ShoppingBag}
            label="Total Jobdesk"
            value={realStats.totalJobdesk}
            trend="+Lintas Divisi"
          />
          
          <div className="relative group">
            <MetricCard 
              icon={DollarSign} 
              label="Pendapatan Bulan ini" 
              value={formatRupiah(realStats.finansial)} 
              trend="+Live" 
              tone="olive" 
              onClick={() => setShowFinanceModal(true)}
            />
            <div className="absolute top-2 right-2 text-slate-400 group-hover:text-emerald-600 pointer-events-none transition-colors">
               <Info size={14} />
            </div>
          </div>

          <div className="relative group">
            <MetricCard 
              icon={Users} 
              label="Total Influencer" 
              value={realStats.totalInfluencer} 
              trend="User" 
              tone="cream" 
              onClick={() => setShowInfluencerModal(true)}
            />
            <div className="absolute top-2 right-2 text-slate-400 group-hover:text-emerald-600 pointer-events-none transition-colors">
               <Info size={14} />
            </div>
          </div>

          <MetricCard
            icon={Activity}
            label="Total Pendapatan"
            value={formatRupiah(realStats.totalPendapatanToDate)}
            trend="+Jan–Hari Ini"
            tone="dark"
          />
        </section>

        {/* CONTENT GRID UTAMA */}
        <section className="content-grid">
          
          {/* KOLOM KIRI */}
          <div className="space-y-6">
            
            {/* CHART PANEL */}
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">OVERVIEW PERFORMA</p>
                  <h2>Performa Penjualan & Panen</h2>
                  <p className="panel-description">
                    {chartViewMode === 'Tahun ini' 
                      ? 'Berdasarkan pencapaian target 316Jt / Bulan (Januari - Oktober).' 
                      : 'Berdasarkan pencapaian target 79Jt / Minggu (Minggu 1 - Minggu 4).'}
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button 
                    onClick={() => setShowCrudMonthlyModal(true)} 
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Edit3 size={14} /> Kelola Data Bulanan
                  </button>

                  <select 
                    value={chartViewMode}
                    onChange={(e) => setChartViewMode(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-6.5 py-1.5 bg-white font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Tahun ini">Tahun ini</option>
                    <option value="Bulan ini">Bulan ini</option>
                  </select>
                </div>
              </div>
              
              <PerformanceChart 
                key={chartViewMode} 
                viewMode={chartViewMode} 
                financeBreakdown={financeBreakdown} 
                monthlyRevenueData={monthlyRevenueData} 
              />
            </article>

            {/* PUSAT LAPORAN */}
            <article className="panel">
              <div className="panel-heading flex-wrap gap-2">
                <div>
                  <p className="eyebrow">PUSAT LAPORAN</p>
                  <h2>Laporan Masuk Lintas Divisi</h2>
                </div>
                <div className="table-actions no-print">
                  <select 
                    value={selectedDivision} 
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 outline-none"
                  >
                    <option value="all">Semua Divisi</option>
                    <option value="cs">Customer Service</option>
                    <option value="greenhouse">PJ Greenhouse / Petani</option>
                    <option value="akuntansi">Akuntansi & Marketing</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? filteredReports.map((report) => (
                  <div key={report.id} className="p-3.5 hover:bg-slate-50/60 transition flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          report.division === 'cs' ? 'bg-blue-100 text-blue-800' :
                          report.division === 'greenhouse' ? 'bg-emerald-100 text-emerald-800' :
                          report.division === 'akuntansi' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {report.divisionLabel || (report.division === 'cs' ? 'Customer Service' : report.division === 'greenhouse' ? 'PJ Greenhouse' : report.division === 'akuntansi' ? 'Akuntansi & Marketing' : report.division || '-')}
                        </span>
                        <span className="text-xs text-slate-400">• {report.date}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 m-0">{report.title}</h4>
                      <p className="text-xs text-slate-500 m-0">{report.content}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {report.status}
                      </span>

                      <div className="flex items-center gap-1 no-print">
                        <button
                          onClick={() => setDetailModalItem(report)}
                          className="text-slate-400 hover:text-emerald-700 p-1 rounded"
                          title="Lihat pesan"
                        >
                          <Eye size={16} />
                        </button>

                        {report.source === 'manager_message' && (
                          <button
                            onClick={() => handleDeleteManagerMessage(report.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                            title="Hapus pesan"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-xs text-slate-500">Belum ada laporan.</div>
                )}
              </div>
            </article>
          </div>

          {/* KOLOM KANAN */}
          <article className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RINGKASAN</p>
                <h2>Lintas Divisi & Tugas</h2>
              </div>
            </div>
            
            <div className="division-list">
              {[
                {
                  key: 'customer_service',
                  name: 'Customer Service',
                  total: jobdeskSummary?.byDivision?.customer_service?.total ?? (jobdesks.cs || []).length,
                  completed: jobdeskSummary?.byDivision?.customer_service?.completed ?? (jobdesks.cs || []).filter(i => i.completed).length,
                  percentage: (jobdeskSummary?.byDivision?.customer_service?.total ?? (jobdesks.cs || []).length) > 0
                    ? Math.round(((jobdeskSummary?.byDivision?.customer_service?.completed ?? (jobdesks.cs || []).filter(i => i.completed).length) / (jobdeskSummary?.byDivision?.customer_service?.total ?? (jobdesks.cs || []).length)) * 100)
                    : 0,
                },
                {
                  key: 'pj_greenhouse',
                  name: 'PJ Greenhouse',
                  total: jobdeskSummary?.byDivision?.pj_greenhouse?.total ?? (jobdesks.greenhouse || []).length,
                  completed: jobdeskSummary?.byDivision?.pj_greenhouse?.completed ?? (jobdesks.greenhouse || []).filter(i => i.completed).length,
                  percentage: (jobdeskSummary?.byDivision?.pj_greenhouse?.total ?? (jobdesks.greenhouse || []).length) > 0
                    ? Math.round(((jobdeskSummary?.byDivision?.pj_greenhouse?.completed ?? (jobdesks.greenhouse || []).filter(i => i.completed).length) / (jobdeskSummary?.byDivision?.pj_greenhouse?.total ?? (jobdesks.greenhouse || []).length)) * 100)
                    : 0,
                },
                {
                  key: 'akuntansi_marketing',
                  name: 'Akuntansi & Marketing',
                  total: jobdeskSummary?.byDivision?.akuntansi_marketing?.total ?? (jobdesks.akuntansi || []).length,
                  completed: jobdeskSummary?.byDivision?.akuntansi_marketing?.completed ?? (jobdesks.akuntansi || []).filter(i => i.completed).length,
                  percentage: (jobdeskSummary?.byDivision?.akuntansi_marketing?.total ?? (jobdesks.akuntansi || []).length) > 0
                    ? Math.round(((jobdeskSummary?.byDivision?.akuntansi_marketing?.completed ?? (jobdesks.akuntansi || []).filter(i => i.completed).length) / (jobdeskSummary?.byDivision?.akuntansi_marketing?.total ?? (jobdesks.akuntansi || []).length)) * 100)
                    : 0,
                },
              ].map((item) => (
                <div className="division-row" key={item.key}>
                  <div className="division-info">
                    <strong>{item.name}</strong>
                    <span className="flex items-center justify-between gap-3">
                      <span>{item.completed}/{item.total} Jobdesk</span>
                      <strong className="text-xs text-emerald-700">{item.percentage}%</strong>
                    </span>
                    <span className="mt-1.5 block h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

      </div>

      {/* DETAIL JOBDESK MANAGER */}
      <section className="panel mt-6">
        <div className="panel-heading flex-wrap gap-3">
          <div>
            <p className="eyebrow">PEMANTAUAN JOBDESK</p>
            <h2>Daftar Jobdesk Lintas Divisi</h2>
            <p className="panel-description">
              {selectedJobdeskPeriod?.label || 'Minggu ini'} · {filteredJobdeskRows.length} jobdesk ditampilkan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 p-4 border-b border-slate-100 bg-slate-50/60 no-print">
          <select
            value={jobdeskPeriodFilter}
            onChange={(e) => setJobdeskPeriodFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 outline-none"
          >
            <option value="current">Minggu Ini</option>
            {currentJobdeskPeriods.filter((period) => !period.isCurrent).map((period) => (
              <option key={period.key} value={period.key}>{period.label}</option>
            ))}
          </select>

          <select
            value={jobdeskDivisionFilter}
            onChange={(e) => setJobdeskDivisionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 outline-none"
          >
            <option value="all">Semua Divisi</option>
            <option value="customer_service">Customer Service</option>
            <option value="pj_greenhouse">PJ Greenhouse</option>
            <option value="akuntansi_marketing">Akuntansi & Marketing</option>
          </select>

          <select
            value={jobdeskStatusFilter}
            onChange={(e) => setJobdeskStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="completed">Selesai</option>
          </select>

          <select
            value={jobdeskRecipientFilter}
            onChange={(e) => setJobdeskRecipientFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 outline-none"
          >
            <option value="all">Semua Penerima</option>
            {jobdeskRecipientOptions.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.name} — {recipient.role === 'customer_service'
                  ? 'Customer Service'
                  : recipient.role === 'pj_greenhouse'
                    ? 'PJ Greenhouse'
                    : 'Akuntansi & Marketing'}
              </option>
            ))}
          </select>

          <input
            value={jobdeskSearch}
            onChange={(e) => setJobdeskSearch(e.target.value)}
            type="search"
            placeholder="Cari jobdesk / penerima..."
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {filteredJobdeskRows.length > 0 ? (
            filteredJobdeskRows.map((job) => (
              <div
                key={job.id}
                className="p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                      {job.recipient?.role === 'customer_service'
                        ? 'Customer Service'
                        : job.recipient?.role === 'pj_greenhouse'
                          ? 'PJ Greenhouse'
                          : 'Akuntansi & Marketing'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Target {job.target_date || '-'}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-800 mt-1">
                    {job.title || 'Tanpa judul'}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    {job.description || 'Tidak ada catatan tambahan.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] text-slate-400">
                      Penerima: <strong className="text-slate-600">{job.recipient?.name || '-'}</strong>
                    </span>
                    {job.assigned_by?.name && (
                      <span className="text-[10px] text-slate-400">
                        • Diberikan oleh: <strong className="text-slate-600">{job.assigned_by.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  ['completed', 'validated'].includes(job.status)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : job.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {job.status === 'validated'
                    ? 'Divalidasi'
                    : job.status === 'completed'
                      ? 'Selesai'
                      : job.status === 'in_progress'
                        ? 'Dikerjakan'
                        : 'Menunggu'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              Tidak ada jobdesk yang sesuai dengan filter.
            </div>
          )}
        </div>
      </section>

      {/* MODAL INPUT PENDAPATAN BULANAN */}
      {showCrudMonthlyModal && (() => {
        const yearlyTarget = 3160000000;
        const totalAccumulated = Object.values(monthlyRevenueData).reduce((acc, curr) => acc + Number(curr || 0), 0);
        const percentage = Math.min(Math.round((totalAccumulated / yearlyTarget) * 100), 100);
        const isReached = totalAccumulated >= yearlyTarget;
        const diff = Math.abs(yearlyTarget - totalAccumulated);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-800 m-0">KELOLA DATA GRAFIK</p>
                  <h3 className="font-bold text-lg text-slate-800 m-0">Input Pendapatan Bulanan (Jan - Okt)</h3>
                </div>
                <button onClick={() => setShowCrudMonthlyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Pendapatan Tahun Ini</span>
                    <h4 className="text-xl font-extrabold text-emerald-400 m-0">{formatRupiah(totalAccumulated)}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Target Tahunan</span>
                    <span className="text-xs font-bold text-slate-200">{formatRupiah(yearlyTarget)}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className={isReached ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {isReached ? 'Target Tahunan Tercapai!' : `Kekurangan: ${formatRupiah(diff)}`}
                    </span>
                    <span className="text-emerald-400 font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isReached ? 'bg-emerald-400' : 'bg-emerald-500'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {Object.entries(monthlyRevenueData).map(([mName, val]) => (
                  <div key={mName} className={`flex justify-between items-center p-2 rounded text-xs border ${mName === editMonth ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="font-bold text-slate-700">{mName}</span>
                    <span className="text-emerald-700 font-semibold">{formatRupiah(val)}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveMonthlyRevenue} className="space-y-3 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Bulan</label>
                    <select 
                      value={editMonth} 
                      onChange={(e) => setEditMonth(e.target.value)}
                      className="w-full text-xs border rounded-lg p-2.5 bg-white font-medium text-slate-800 outline-none"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rupiah)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                      <input 
                        type="text"
                        placeholder="0"
                        value={displayNominal}
                        onChange={handleNominalChange}
                        className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Nilai Asli: {formatRupiah(parseRawNumber(displayNominal))}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCrudMonthlyModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL FINANCIAL OVERVIEW */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-800 m-0">RINCIAN PENDAPATAN BULAN INI</p>
                <h3 className="font-bold text-xl text-slate-800 m-0">{formatRupiah(realStats.finansial)}</h3>
              </div>
              <button onClick={() => setShowFinanceModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowFinanceModal(false)} className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900">
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL CALON INFLUENCER */}
      {showInfluencerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-800 m-0">MANAJEMEN ENDORSE</p>
                <h3 className="font-bold text-lg text-slate-800 m-0">Daftar Calon Influencer ({normalizedCandidates.length})</h3>
              </div>
              <button onClick={() => setShowInfluencerModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {normalizedCandidates.length > 0 ? (
                normalizedCandidates.map((item, idx) => {
                  const handleOrName = item.social_media_handle || item.name || item.username || `Influencer #${idx+1}`;
                  const platformName = item.platform || 'Instagram';
                  const statusVal = item.status || 'prospecting';

                  return (
                    <div key={item.id || idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div>
                        <p className="font-bold text-xs text-slate-800 m-0">
                          {handleOrName.startsWith('@') ? handleOrName : `@${handleOrName}`}
                        </p>
                        <span className="text-[10px] text-slate-400 capitalize">{platformName}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        ['Deal', 'agreed', 'collaborated', 'Disetujui'].includes(statusVal) ? 'bg-emerald-100 text-emerald-800' :
                        ['Dihubungi', 'contacted', 'negotiating', 'Proses'].includes(statusVal) ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {statusVal}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Belum ada calon influencer yang diinputkan dari Akuntansi & Marketing.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button 
                onClick={() => setShowInfluencerModal(false)} 
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JOBDESK */}
      {showAddJobdeskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-800 m-0">
                  FORM MANAGER PMS
                </p>
                <h3 className="font-bold text-lg text-slate-800 m-0">
                  Kirim Jobdesk
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Buat instruksi dan kirim langsung ke user yang dituju.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddJobdeskModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                disabled={jobdeskSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddJobdeskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Judul Jobdesk
                </label>
                <input
                  type="text"
                  value={newJobdeskTitle}
                  onChange={(e) => setNewJobdeskTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Validasi stok Monstera"
                  maxLength={255}
                  required
                  disabled={jobdeskSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan / Instruksi
                </label>
                <textarea
                  value={newJobdeskDescription}
                  onChange={(e) => setNewJobdeskDescription(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 min-h-[110px] outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tulis instruksi atau keterangan bebas untuk user yang menerima tugas."
                  disabled={jobdeskSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Diberikan Kepada
                  </label>
                  <select
                    value={newJobdeskUserId}
                    onChange={(e) => setNewJobdeskUserId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    disabled={jobdeskSubmitting}
                  >
                    <option value="">Pilih user...</option>
                    {(jobdeskUsers || []).map((userItem) => (
                      <option key={userItem.id} value={userItem.id}>
                        {userItem.name} — {
                          userItem.role === 'customer_service'
                            ? 'Customer Service'
                            : userItem.role === 'pj_greenhouse'
                              ? 'PJ Greenhouse'
                              : 'Akuntansi & Marketing'
                        }
                      </option>
                    ))}
                  </select>

                  {(jobdeskUsers || []).length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Belum ada user aktif yang bisa menerima jobdesk.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Target Tanggal
                  </label>
                  <input
                    type="date"
                    value={newJobdeskTargetDate}
                    onChange={(e) => setNewJobdeskTargetDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    disabled={jobdeskSubmitting}
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-[11px] text-emerald-800 m-0">
                  User penerima hanya akan melihat jobdesk yang ditujukan kepadanya.
                  Manager tetap dapat melihat progress seluruh divisi.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddJobdeskModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={jobdeskSubmitting}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    jobdeskSubmitting ||
                    !newJobdeskTitle.trim() ||
                    !newJobdeskUserId ||
                    !newJobdeskTargetDate
                  }
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {jobdeskSubmitting ? 'Mengirim...' : 'Kirim Jobdesk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL LAPORAN */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
             <div className="flex items-center justify-between border-b pb-3">
               <h3 className="font-bold text-base text-slate-800 m-0">{detailModalItem.title}</h3>
               <button onClick={() => setDetailModalItem(null)} className="text-slate-400 p-1"><X size={18} /></button>
             </div>
             <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-800 min-h-[80px]">
                {detailModalItem.content}
             </div>
          </div>
        </div>
      )}

    </div>
  );
}