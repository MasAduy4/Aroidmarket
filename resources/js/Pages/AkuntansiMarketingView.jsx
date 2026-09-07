import React, { useState, useEffect } from 'react';
import JobdeskInbox from '@/Components/Shared/JobdeskInbox'
import ManagerMessageBox from '@/Components/Shared/ManagerMessageBox'
import { 
  Users, 
  Plus, 
  Save, 
  X, 
  Edit2, 
  Trash2,
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  LogOut,  
  DollarSign,
  CheckSquare,
  Leaf,
  Settings,
  Bell,
  BarChart3,
  Database,
  SendHorizontal,
  Calendar,
  Check,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { router } from '@inertiajs/react';
import ProfileSettingsModal from '@/Components/Shared/ProfileSettingsModal';
import HeaderUserProfile from '@/Components/Shared/HeaderUserProfile';
import { useCurrentUser } from '@/Components/Shared/useCurrentUser';

// =========================
// VALIDATION & FORMATTING
// =========================
const INTEGER_FIELDS = new Set(['quantity']);

const NUMBER_FIELDS = new Set([
  'debit', 'kredit', 'price', 'price_per_unit', 'modal',
  'packing_fee', 'penahanan_usd', 'admin_fee_usd', 'withdrawal_usd',
  'withdrawal_idr', 'shipping_cost', 'exchange_rate', 'total_plant_value',
  'packing_cost', 'domestic_shipping_cost', 'palmstreet_fee', 'revenue_usd',
  'amount', 'nominal', 'subtotal', 'total_price', 'net_usd', 'profit_loss',
]);


const USD_FIELDS = new Set([
  'penahanan_usd', 'admin_fee_usd', 'net_usd',
  'withdrawal_usd', 'revenue_usd',
]);

const PLAIN_NUMBER_FIELDS = new Set(['quantity', 'exchange_rate']);

const AUTO_CALCULATED_FIELDS = new Set([
  'saldo', 'subtotal', 'total', 'total_price', 'net_usd', 'profit_loss',
]);

const BOOLEAN_FIELDS = new Set(['shipped']);

const DATE_FIELDS = new Set([
  'tanggal', 'transaction_date', 'cost_date', 'sale_date',
  'purchase_date', 'ship_date', 'date', 'order_date',
]);

const DATETIME_FIELDS = new Set(['paid_at']);

// Shopify: kolom Total pada sheet adalah nilai order dalam USD yang
// sengaja diperlakukan sebagai teks bebas (mis. $208.20, 208.20 USD, dll).
const SHOPIFY_FREE_TEXT_FIELDS = new Set(['total_usd']);

const SELECT_FIELD_OPTIONS = {
  'Buku Kas': { type: ['in', 'out'] },
  'Belanja Tanaman Order': { status: ['pending', 'received', 'cancelled'] },
  'Orderan Terkirim': { status: ['selamat', 'tidak selamat'] },
};

const HIDDEN_FIELDS_BY_SHEET = {
  'Operasional': new Set(['recorded_by', 'created_at', 'updated_at', 'total']),
};

const SHEET_COLUMNS = {
  'Buku Kas': [
    ['Tanggal', 'Tanggal'],
    ['Deskripsi', 'Deskripsi'],
    ['Akun', 'Akun'],
    ['Debit', 'Debit'],
    ['Kredit', 'Kredit'],
    ['Saldo', 'Saldo'],
  ],
  'Operasional': [
    ['cost_date', 'COST DATE'],
    ['supplier', 'SUPPLIER'],
    ['item_name', 'ITEM NAME'],
    ['category', 'CATEGORY'],
    ['subcategory', 'SUBCATEGORY'],
    ['quantity', 'QUANTITY'],
    ['price', 'PRICE'],
    ['subtotal', 'SUBTOTAL'],
    ['note', 'NOTE'],
  ],
  'Penjualan Lokal': [
    ['__no', 'No'],
    ['sale_date', 'Tgl'],
    ['source', 'Sumber'],
    ['invoice_type', 'Inv'],
    ['customer_name', 'Nama Pembeli'],
    ['quantity', 'Qty'],
    ['item_name', 'Orderan'],
    ['price_per_unit', 'Price'],
    ['total_price', 'Total'],
    ['modal', 'Modal'],
    ['note', 'Keterangan'],
  ],
  'Data Order Shopify': [
    ['order_number', 'Name'],
    ['paid_at', 'Paid at'],
    ['total_usd', 'Total'],
    ['quantity', 'Lineitem quantity'],
    ['item_name', 'Lineitem name'],
    ['customer_name', 'Billing Name'],
    ['payment_method', 'Payment Method'],
    ['tags', 'Tags'],
    ['price_per_unit', 'Harga tanaman'],
    ['total_price', 'total tanaman'],
    ['packing_fee', 'Jasa Packing'],
    ['shipped', 'Terkirim'],
    ['ship_date', 'tanggal kirim'],
  ],
  'Uang $ Aroid Market': [
    ['transaction_date', 'tanggal'],
    ['name', 'Name'],
    ['payment_method', 'payment method'],
    ['total_usd', 'Total'],
    ['penahanan_usd', 'penahanan'],
    ['admin_fee_usd', 'potongan admin'],
    ['net_usd', 'Net'],
    ['withdrawal_usd', 'penarikan'],
    ['withdrawal_idr', 'nilai penarikan (Rp)'],
  ],
  'Belanja Tanaman Order': [
    ['purchase_date', 'Date'],
    ['supplier_name', 'Supplier'],
    ['plant_name', 'Name of Plants'],
    ['quantity', 'Qty'],
    ['price_per_unit', 'Price'],
    ['subtotal', 'Subtotal'],
    ['shipping_cost', 'Shipping cost'],
    ['total_price', 'Total'],
    ['purpose_order_reference', 'No Order'],
    ['status', 'Status'],
    ['note', 'Note'],
  ],
  'Orderan Terkirim': [
    ['ship_date', 'Tanggal kirim'],
    ['order_number', 'No order'],
    ['quantity', 'Jumlah tanaman'],
    ['status', 'Status paket'],
    ['courier', 'Metode KIRIM'],
    ['payment_method', 'Metode payment'],
    ['revenue_usd', 'Pendapatan ($)'],
    ['total_plant_value', 'Total tanaman (Rp)'],
    ['packing_cost', 'Biaya packing'],
    ['domestic_shipping_cost', 'ongkir indo'],
    ['palmstreet_fee', 'Biaya PS'],
    ['profit_loss', 'Laba/Rugi'],
    ['note', 'Note'],
  ],
  'Tanaman Baru': [
    ['purchase_date', 'Date'],
    ['supplier_name', 'Supplier'],
    ['plant_name', 'Name of Plants'],
    ['quantity', 'Qty'],
    ['price_per_unit', 'Price'],
    ['subtotal', 'Subtotal'],
    ['shipping_cost', 'Shipping cost'],
    ['total_price', 'Total'],
    ['note', 'Note'],
  ],
};

const getSheetColumns = (sheetName) => SHEET_COLUMNS[sheetName] ?? [];

const isHiddenField = (sheetName, key) =>
  HIDDEN_FIELDS_BY_SHEET[sheetName]?.has(String(key).toLowerCase()) ?? false;

const normalizeNumeric = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let raw = String(value).trim();
  if (!raw) return null;

  raw = raw.replace(/^\s*(Rp|\$)\s*/i, '').replace(/\s/g, '');

  if (!/^-?[0-9][0-9.,]*$/.test(raw)) return null;

  const hasComma = raw.includes(',');
  const dotCount = (raw.match(/\./g) || []).length;

  if (hasComma && dotCount > 0) {
    if (/^-?\d{1,3}(,\d{3})+\.\d+$/.test(raw)) {
      raw = raw.replace(/,/g, '');
    } else if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(raw)) {
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else {
      return null;
    }
  } else if (hasComma) {
    if (/^-?\d{1,3}(,\d{3})+$/.test(raw)) {
      raw = raw.replace(/,/g, '');
    } else if (/^-?\d+,\d+$/.test(raw)) {
      raw = raw.replace(',', '.');
    } else {
      return null;
    }
  } else if (dotCount > 1) {
    if (!/^-?\d{1,3}(\.\d{3})+$/.test(raw)) return null;
    raw = raw.replace(/\./g, '');
  } else if (dotCount === 1) {
    const [whole, fraction] = raw.split('.');
    if (fraction.length === 3 && whole.replace('-', '').length <= 3) {
      raw = whole + fraction;
    }
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeInteger = (value) => {
  const numeric = normalizeNumeric(value);
  if (numeric === null) return null;
  return Number.isInteger(numeric) ? numeric : null;
};

const formatRibuan = (value) => {
  const numeric = normalizeNumeric(value);
  if (numeric === null) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric);
};

const formatRupiah = (value) => {
  const numeric = normalizeNumeric(value);
  if (numeric === null) return '';
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric)}`;
};

const formatEditableNumber = (value, key) => {
  if (value === null || value === undefined || value === '') return '';
  if (USD_FIELDS.has(key)) {
    const normalized = String(value).replace(/[^0-9.,-]/g, '');
    return normalized;
  }
  if (PLAIN_NUMBER_FIELDS.has(key)) {
    return String(value).replace(/[^0-9]/g, '');
  }
  const numeric = normalizeNumeric(value);
  return numeric === null ? '' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric);
};

const sanitizeTypedNumber = (value, key) => {
  const raw = String(value ?? '');
  if (PLAIN_NUMBER_FIELDS.has(key) || !USD_FIELDS.has(key)) {
    return raw.replace(/[^0-9]/g, '');
  }
  return raw.replace(/[^0-9.,-]/g, '');
};

const formatUsd = (value) => {
  const numeric = normalizeNumeric(value);
  if (numeric === null) return '';
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)}`;
};

const normalizeDate = (value) => {
  if (!value || value === '-') return '';
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const isoDateTime = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoDateTime) return isoDateTime[1];

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', Mei: '05', Jun: '06',
    Jul: '07', Agu: '08', Sep: '09', Okt: '10', Nov: '11', Des: '12',
  };

  const match = raw.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (match && months[match[2]]) {
    return `${match[3]}-${months[match[2]]}-${String(match[1]).padStart(2, '0')}`;
  }

  return '';
};

const normalizeDatetimeLocal = (value) => {
  if (!value || value === '-') return '';
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const prepareBukuKasForm = (row) => {
  const debit = normalizeNumeric(row.Debit);
  const kredit = normalizeNumeric(row.Kredit);

  return {
    ...row,
    Tanggal: normalizeDate(row.Tanggal),
    Deskripsi: row.Deskripsi === '-' ? '' : String(row.Deskripsi ?? ''),
    Akun: row.Akun === '-' ? '' : String(row.Akun ?? ''),
    Debit: debit ?? 0,
    Kredit: kredit ?? 0,
  };
};

const validateSheetForm = (sheetName, data) => {
  const errors = {};

  if (sheetName === 'Buku Kas') {
    if (!normalizeDate(data.Tanggal)) errors.Tanggal = 'Tanggal wajib diisi.';
    if (!String(data.Deskripsi ?? '').trim()) errors.Deskripsi = 'Deskripsi wajib diisi.';
    if (!String(data.Akun ?? '').trim()) errors.Akun = 'Akun wajib diisi.';

    const debit = normalizeNumeric(data.Debit) ?? 0;
    const kredit = normalizeNumeric(data.Kredit) ?? 0;

    if (debit < 0 || kredit < 0) errors.nominal = 'Nominal tidak boleh negatif.';
    if (debit > 0 && kredit > 0) errors.nominal = 'Isi Debit atau Kredit saja, jangan keduanya.';
    if (debit === 0 && kredit === 0) errors.nominal = 'Debit atau Kredit wajib diisi.';

    return errors;
  }

  const rules = {
    'Operasional': {
      requiredStrings: ['supplier', 'item_name', 'category'],
      requiredNumbers: ['quantity', 'price'],
    },
    'Penjualan Lokal': {
      requiredStrings: ['source', 'customer_name', 'item_name'],
      requiredNumbers: ['quantity', 'price_per_unit'],
    },
    'Data Order Shopify': {
      requiredStrings: ['order_number', 'item_name'],
      requiredNumbers: ['quantity', 'price_per_unit'],
    },
    'Uang $ Aroid Market': {
      requiredStrings: [],
      requiredNumbers: [],
    },
    'Belanja Tanaman Order': {
      requiredStrings: ['supplier_name', 'plant_name'],
      requiredNumbers: ['quantity', 'price_per_unit'],
    },
    'Orderan Terkirim': {
      requiredStrings: ['order_number', 'courier', 'payment_method'],
      requiredNumbers: ['quantity', 'revenue_usd', 'exchange_rate', 'total_plant_value'],
    },
    'Tanaman Baru': {
      requiredStrings: ['plant_name', 'supplier_name'],
      requiredNumbers: ['quantity', 'price_per_unit'],
    },
  }[sheetName];

  if (!rules) return errors;

  rules.requiredStrings.forEach((field) => {
    if (!String(data[field] ?? '').trim()) {
      errors[field] = `${field} wajib diisi.`;
    }
  });

  rules.requiredNumbers.forEach((field) => {
    const numeric = INTEGER_FIELDS.has(field)
      ? normalizeInteger(data[field])
      : normalizeNumeric(data[field]);

    if (numeric === null || !Number.isFinite(numeric) || numeric < 0) {
      errors[field] = `${field} wajib berupa angka yang valid.`;
    }
  });

  Object.entries(data).forEach(([field, value]) => {
    const key = field.toLowerCase();

    if (DATE_FIELDS.has(key) && value !== '' && !normalizeDate(value)) {
      errors[field] = `${field} harus berupa tanggal yang valid.`;
    }

    if (DATETIME_FIELDS.has(key) && value !== '' && !normalizeDatetimeLocal(value)) {
      errors[field] = `${field} harus berupa tanggal dan waktu yang valid.`;
    }

    if (!SHOPIFY_FREE_TEXT_FIELDS.has(key) && NUMBER_FIELDS.has(key) && value !== '' && normalizeNumeric(value) === null) {
      errors[field] = `${field} harus berupa angka.`;
    }

    if (BOOLEAN_FIELDS.has(key) && typeof value !== 'boolean') {
      errors[field] = `${field} harus berupa true/false.`;
    }
  });

  const selects = SELECT_FIELD_OPTIONS[sheetName] || {};
  Object.entries(selects).forEach(([field, options]) => {
    if (data[field] !== undefined && !options.includes(String(data[field]))) {
      errors[field] = `${field} tidak memiliki pilihan yang valid.`;
    }
  });

  return errors;
};

const sanitizeSheetPayload = (sheetName, data) => {
  if (sheetName === 'Buku Kas') {
    const debit = normalizeNumeric(data.Debit) ?? 0;
    const kredit = normalizeNumeric(data.Kredit) ?? 0;

    return {
      transaction_date: normalizeDate(data.Tanggal),
      description: String(data.Deskripsi ?? '').trim(),
      category: String(data.Akun ?? '').trim(),
      type: debit > 0 ? 'in' : 'out',
      amount: debit > 0 ? debit : kredit,
    };
  }

  const payload = {};
  const hiddenFields = HIDDEN_FIELDS_BY_SHEET[sheetName] || new Set();

  Object.entries(data || {}).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();

    if (keyLower === 'id') return;
    if (hiddenFields.has(keyLower)) return;
    if (AUTO_CALCULATED_FIELDS.has(keyLower)) return;

    if (SHOPIFY_FREE_TEXT_FIELDS.has(keyLower)) {
      payload[key] = value === null || value === undefined ? '' : String(value).trim();
      return;
    }

    if (DATETIME_FIELDS.has(keyLower)) {
      payload[key] = normalizeDatetimeLocal(value);
      return;
    }

    if (DATE_FIELDS.has(keyLower)) {
      payload[key] = normalizeDate(value);
      return;
    }

    if (INTEGER_FIELDS.has(keyLower)) {
      const numeric = normalizeInteger(value);
      if (numeric !== null) payload[key] = numeric;
      return;
    }

    if (NUMBER_FIELDS.has(keyLower)) {
      const numeric = normalizeNumeric(value);
      if (numeric !== null) payload[key] = numeric;
      return;
    }

    if (BOOLEAN_FIELDS.has(keyLower)) {
      payload[key] = value === true;
      return;
    }

    if (typeof value === 'string') {
      payload[key] = value.trim();
      return;
    }

    payload[key] = value;
  });

  return payload;
};

export default function AkuntansiMarketingView({ 
  jobdesksProps = [], 
  financialProps = {},
  endorseProps = [],
  sheetsProps = {},
  managerMessages = []
}) {
  // Default data mingguan dan bulanan (JANUARI - OKTOBER)
  const defaultWeeklyIncome = [
    { id: 1, minggu: 'Minggu ke-1', nominal: 0 },
    { id: 2, minggu: 'Minggu ke-2', nominal: 0 },
    { id: 3, minggu: 'Minggu ke-3', nominal: 0 },
    { id: 4, minggu: 'Minggu ke-4', nominal: 0 },
    { id: 5, minggu: 'Bulan Jan', nominal: 190256000 },
    { id: 6, minggu: 'Bulan Feb', nominal: 474500000 },
    { id: 7, minggu: 'Bulan Mar', nominal: 163704800 },
    { id: 8, minggu: 'Bulan Apr', nominal: 150208000 },
    { id: 9, minggu: 'Bulan Mei', nominal: 342224000 },
    { id: 10, minggu: 'Bulan Jun', nominal: 357136000 },
    { id: 11, minggu: 'Bulan Jul', nominal: 304680320 },
    { id: 12, minggu: 'Bulan Agu', nominal: 0 },
    { id: 13, minggu: 'Bulan Sep', nominal: 0 },
    { id: 14, minggu: 'Bulan Okt', nominal: 0 },
  ];

  const [weeklyIncome, setWeeklyIncome] = useState(
    financialProps.weeklyIncome && financialProps.weeklyIncome.length > 0
      ? financialProps.weeklyIncome
      : defaultWeeklyIncome
  );

  const [sentStatus, setSentStatus] = useState({});

  // Pengaturan Hub & Profil dibagikan dengan pola yang sama seperti halaman role lain.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [brandTitle, setBrandTitle] = useState('AroidMarket');
  const [brandSubtitle, setBrandSubtitle] = useState('OPERATIONAL HUB');
  const [brandLogo, setBrandLogo] = useState(null);
  const { user, companyLogoUrl } = useCurrentUser();

  const myManagerMessages = Array.isArray(managerMessages)
    ? managerMessages
    : (managerMessages?.data || []);


  // Daftar bulan yang dihitung untuk pendapatan tahunan (Januari s.d. Oktober)
  const allowedMonthsForYearly = [
    'bulan jan', 'bulan feb', 'bulan mar', 'bulan apr', 
    'bulan mei', 'bulan jun', 'bulan jul', 'bulan agu', 
    'bulan sep', 'bulan okt'
  ];

  // Pemisahan data mingguan dan bulanan
  const weeklyData = weeklyIncome.filter(item => !item.minggu?.toLowerCase().startsWith('bulan'));
  const monthlyData = weeklyIncome.filter(item => item.minggu?.toLowerCase().startsWith('bulan'));

  // 1. Kalkulasi Total Pendapatan Bulan Ini (Dari data mingguan)
  const totalPendapatanBulanan = weeklyData.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  // 2. Kalkulasi Total Pendapatan Tahun Ini (Januari s.d. Oktober)
  const totalPendapatanTahunan = monthlyData
    .filter(item => allowedMonthsForYearly.includes(item.minggu?.toLowerCase().trim()))
    .reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  // Fungsi Kirim Laporan ke Manager PMS
  const [isSendingPMS, setIsSendingPMS] = useState(false);
  const handleSendReportToPMS = (label, totalNominal, typeKey) => {
    if (confirm(`Kirim laporan ${label} (${formatRupiah(totalNominal)}) ke Manager PMS?`)) {
      setIsSendingPMS(true);
      router.post('/akuntansi-marketing/send-to-pms', {
        kategori: label,
        total_pendapatan: totalNominal,
      }, {
        preserveScroll: true,
        onFinish: () => setIsSendingPMS(false),
        onSuccess: (page) => {
          setSentStatus(prev => ({ ...prev, [typeKey]: true }));
          setTimeout(() => {
            setSentStatus(prev => ({ ...prev, [typeKey]: false }));
          }, 2500);
          const flashMessage = page.props.flash?.success;
          alert(flashMessage || `Laporan ${label} berhasil dikirim ke Manager PMS!`);
        },
        onError: (errors) => {
          console.error(errors);
          alert('Gagal mengirim laporan ke Manager PMS.');
        }
      });
    }
  };

  // --- FUNGSI HELPER FORMAT INPUT RIBUAN ---
  const formatDisplayNumber = (val) => {
    if (!val) return '';
    const cleanNumber = String(val).replace(/\D/g, '');
    if (!cleanNumber) return '';
    return Number(cleanNumber).toLocaleString('id-ID');
  };

  // --- FORM TAMBAH / UPDATE DATA BULAN ---
  const monthOptions = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
  const [newMonthLabel, setNewMonthLabel] = useState('Sep');
  const [newMonthNominal, setNewMonthNominal] = useState('');
  const [isSavingMonth, setIsSavingMonth] = useState(false);

  const handleSaveMonthlyIncome = (e) => {
    e.preventDefault();
    const numericValue = String(newMonthNominal).replace(/\D/g, '');

    if (numericValue === '' || isNaN(Number(numericValue)) || Number(numericValue) < 0) {
      alert('Masukkan nominal yang valid (angka, minimal 0).');
      return;
    }
    
    setIsSavingMonth(true);
    router.post('/akuntansi-marketing/monthly-income', {
      month: newMonthLabel,
      nominal: Number(numericValue),
    }, {
      preserveScroll: true,
      onFinish: () => setIsSavingMonth(false),
      onSuccess: () => setNewMonthNominal(''),
      onError: (errors) => {
        console.error(errors);
        alert('Gagal menyimpan data bulan. Cek console untuk detail.');
      }
    });
  };

  // --- FORM TAMBAH / UPDATE DATA MINGGU ---
  const weekOptions = ['Minggu ke-1', 'Minggu ke-2', 'Minggu ke-3', 'Minggu ke-4'];
  const [newWeekLabel, setNewWeekLabel] = useState('Minggu ke-1');
  const [newWeekNominal, setNewWeekNominal] = useState('');
  const [isSavingWeek, setIsSavingWeek] = useState(false);

  const handleSaveWeeklyIncome = (e) => {
    e.preventDefault();
    const numericValue = String(newWeekNominal).replace(/\D/g, '');

    if (numericValue === '' || isNaN(Number(numericValue)) || Number(numericValue) < 0) {
      alert('Masukkan nominal yang valid (angka, minimal 0).');
      return;
    }

    setIsSavingWeek(true);
    router.post('/akuntansi-marketing/weekly-income', {
      minggu: newWeekLabel,
      nominal: Number(numericValue),
    }, {
      preserveScroll: true,
      onFinish: () => setIsSavingWeek(false),
      onSuccess: () => setNewWeekNominal(''),
      onError: (errors) => {
        console.error(errors);
        alert('Gagal menyimpan data minggu. Cek console untuk detail.');
      }
    });
  };

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeSheetName, setActiveSheetName] = useState('Buku Kas');

  const defaultJobdesks = [
    { id: 1, text: 'Merekap penjualan palmstreet purge di G-Sheet Purge Calculation', category: 'Akuntansi', completed: false },
    { id: 2, text: 'Mengisi Sheet Orderan Terkirim', category: 'Akuntansi', completed: false },
    { id: 3, text: 'Mengisi Sheet Uang $ Aroid Market', category: 'Akuntansi', completed: false },
  ];

  const defaultEndorseList = [
    { id: 1, name: '@plantmom_bdg', platform: 'Instagram', status: 'Belum' },
    { id: 2, name: '@jungle_addict', platform: 'TikTok', status: 'Dihubungi' },
  ];


  const [sheetsData, setSheetsData] = useState(sheetsProps || {});
  const [jobdesks, setJobdesks] = useState(jobdesksProps.length > 0 ? jobdesksProps : defaultJobdesks);
  const [endorseList, setEndorseList] = useState(endorseProps.length > 0 ? endorseProps : defaultEndorseList);
  
  const [activeTab, setActiveTab] = useState('Semua');
  const [newTaskText, setNewTaskText] = useState('');
  
  const [newEndorseName, setNewEndorseName] = useState('');
  const [newEndorsePlatform, setNewEndorsePlatform] = useState('Instagram');

  const [editingEndorseId, setEditingEndorseId] = useState(null);
  const [endorseEditForm, setEndorseEditForm] = useState({ name: '', platform: 'Instagram' });
  
  const [editingRowId, setEditingRowId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setJobdesks(jobdesksProps);
    setEndorseList(endorseProps);
    if (Object.keys(sheetsProps).length > 0) {
      setSheetsData(sheetsProps);
    }
    if (financialProps.weeklyIncome && financialProps.weeklyIncome.length > 0) {
      setWeeklyIncome(financialProps.weeklyIncome);
    }
  }, [jobdesksProps, endorseProps, sheetsProps, financialProps]);

  // --- JOBDESK ACTIONS ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const categoryAssigned = activeTab === 'Semua' ? 'Akuntansi' : activeTab;
    
    router.post('/akuntansi-marketing/jobdesk', {
      text: newTaskText.trim(),
      category: categoryAssigned
    }, {
      preserveScroll: true,
      onSuccess: () => setNewTaskText('')
    });
  };

  const handleToggleJob = (id) => {
    setJobdesks(jobdesks.map(j => j.id === id ? { ...j, completed: !j.completed } : j));
    router.patch(`/akuntansi-marketing/jobdesk/${id}/toggle`, {}, { preserveScroll: true });
  };

  // --- ENDORSE ACTIONS ---
  const handleAddEndorse = (e) => {
    e.preventDefault();
    if (!newEndorseName.trim()) return;
    
    const tempNewItem = {
      id: Date.now(),
      name: newEndorseName.trim(),
      platform: newEndorsePlatform,
      status: 'Belum'
    };

    setEndorseList([...endorseList, tempNewItem]);
    const savedName = newEndorseName.trim();
    const savedPlatform = newEndorsePlatform;
    setNewEndorseName('');

    router.post('/akuntansi-marketing/endorse', {
      name: savedName,
      platform: savedPlatform
    }, {
      preserveScroll: true,
      onError: () => {
        setEndorseList(endorseList);
        alert('Gagal menambahkan endorse.');
      }
    });
  };

  const handleSaveEndorse = (id) => {
    router.put(`/akuntansi-marketing/endorse/${id}`, endorseEditForm, {
      preserveScroll: true,
      onSuccess: () => setEditingEndorseId(null)
    });
  };

  const handleCycleEndorseStatus = (id) => {
    const item = endorseList.find(i => i.id === id);
    const nextStatus = item.status === 'Belum' ? 'Dihubungi' : item.status === 'Dihubungi' ? 'Deal' : 'Belum';
    
    setEndorseList(endorseList.map(i => i.id === id ? { ...i, status: nextStatus } : i));
    router.patch(`/akuntansi-marketing/endorse/${id}/status`, {}, { preserveScroll: true });
  };

  const handleDeleteEndorse = (id, name) => {
    if (confirm(`Hapus ${name} dari daftar endorse?`)) {
      setEndorseList(endorseList.filter(item => item.id !== id));
      router.delete(`/akuntansi-marketing/endorse/${id}`, { preserveScroll: true });
    }
  };

  // --- SHEET CRUD ACTIONS ---
  const sheetFieldTemplates = {
    'Buku Kas': { Tanggal: '', Deskripsi: '', Akun: '', Debit: 0, Kredit: 0, Saldo: 'Rp 0' },
    'Operasional': { cost_date: '', supplier: '', item_name: '', category: '', subcategory: '', quantity: 1, price: 0, subtotal: 0, note: '' },
    'Penjualan Lokal': { sale_date: '', source: '', invoice_type: '', customer_name: '', quantity: 1, item_name: '', price_per_unit: 0, total_price: 0, modal: 0, note: '' },
    'Data Order Shopify': { order_number: '', paid_at: '', total_usd: 0, customer_name: '', quantity: 1, item_name: '', payment_method: '', tags: '', price_per_unit: 0, total_price: 0, packing_fee: 0, shipped: false, ship_date: '' },
    'Uang $ Aroid Market': { transaction_date: '', name: '', payment_method: '', total_usd: 0, penahanan_usd: 0, admin_fee_usd: 0, net_usd: 0, withdrawal_usd: 0, withdrawal_idr: 0 },
    'Belanja Tanaman Order': { purchase_date: '', supplier_name: '', plant_name: '', quantity: 1, price_per_unit: 0, subtotal: 0, shipping_cost: 0, total_price: 0, purpose_order_reference: '', status: 'pending', note: '' },
    'Orderan Terkirim': { ship_date: '', order_number: '', quantity: 1, status: 'selamat', courier: '', payment_method: '', revenue_usd: 0, exchange_rate: 16000, total_plant_value: 0, packing_cost: 0, domestic_shipping_cost: 0, palmstreet_fee: 0, profit_loss: 0, note: '' },
    'Tanaman Baru': { purchase_date: '', plant_name: '', quantity: 1, price_per_unit: 0, subtotal: 0, shipping_cost: 0, total_price: 0, supplier_name: '', note: '' },
  };

  const handleAddRow = () => {
    const tempId = `new-${Date.now()}`;
    const template = sheetFieldTemplates[activeSheetName] || {};
    const emptyRow = { id: tempId, ...template };

    setSheetsData((prev) => ({
      ...prev,
      [activeSheetName]: [emptyRow, ...(prev[activeSheetName] || [])],
    }));
    setEditingRowId(tempId);
    setFormData(activeSheetName === 'Buku Kas' ? prepareBukuKasForm(emptyRow) : { ...emptyRow });
  };

  const handleDeleteRow = (id) => {
    if (!confirm('Hapus baris data ini?')) return;

    const previousRows = sheetsData[activeSheetName] || [];
    const isTemporaryRow = String(id).startsWith('new-');

    if (isTemporaryRow) {
      setSheetsData((prev) => ({
        ...prev,
        [activeSheetName]: (prev[activeSheetName] || []).filter((row) => row.id !== id),
      }));
      setEditingRowId(null);
      setFormData({});
      return;
    }

    const encodedSheetName = encodeURIComponent(activeSheetName);

    router.delete(`/akuntansi-marketing/sheet/${encodedSheetName}/${id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setSheetsData((prev) => ({
          ...prev,
          [activeSheetName]: (prev[activeSheetName] || []).filter((row) => row.id !== id),
        }));
        setEditingRowId(null);
        setFormData({});
      },
      onError: (errors) => {
        console.error('Gagal menghapus data:', errors);
        setSheetsData((prev) => ({ ...prev, [activeSheetName]: previousRows }));
        alert('Gagal menghapus data. Data dikembalikan.');
      },
    });
  };

  const handleSaveRow = (id) => {
    const errors = validateSheetForm(activeSheetName, formData);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      alert(firstError);
      console.error('Validation gagal:', errors);
      return;
    }

    const encodedSheetName = encodeURIComponent(activeSheetName);
    const payload = sanitizeSheetPayload(activeSheetName, formData);
    const isNewRow = String(id).startsWith('new-');
    const previousRows = sheetsData[activeSheetName] || [];

    if (isNewRow) {
      router.post(`/akuntansi-marketing/sheet/${encodedSheetName}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setEditingRowId(null);
          setFormData({});
        },
        onError: (serverErrors) => {
          console.error('Gagal menambahkan:', serverErrors);
          alert('Gagal menyimpan data. Periksa kembali input.');
        },
      });
      return;
    }

    router.put(`/akuntansi-marketing/sheet/${encodedSheetName}/${id}`, payload, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingRowId(null);
        setFormData({});
      },
      onError: (serverErrors) => {
        console.error('Gagal memperbarui:', serverErrors);
        setSheetsData((prev) => ({ ...prev, [activeSheetName]: previousRows }));
        alert('Gagal memperbarui data. Periksa kembali input.');
      },
    });
  };

  const handleEditRow = (row) => {
    setEditingRowId(row.id);

    if (activeSheetName === 'Buku Kas') {
      setFormData(prepareBukuKasForm(row));
      return;
    }

    const editData = { ...row };

    Object.keys(editData).forEach((key) => {
      const keyLower = key.toLowerCase();

      if (isHiddenField(activeSheetName, key) || keyLower === 'id') {
        delete editData[key];
        return;
      }

      if (SHOPIFY_FREE_TEXT_FIELDS.has(keyLower)) {
        editData[key] = editData[key] == null ? '' : String(editData[key]);
      } else if (DATETIME_FIELDS.has(keyLower)) {
        editData[key] = normalizeDatetimeLocal(editData[key]);
      } else if (DATE_FIELDS.has(keyLower)) {
        editData[key] = normalizeDate(editData[key]);
      } else if (NUMBER_FIELDS.has(keyLower)) {
        editData[key] = normalizeNumeric(editData[key]) ?? '';
      } else if (typeof editData[key] === 'string' && editData[key] === '-') {
        editData[key] = '';
      }
    });

    setFormData(editData);
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      router.post('/logout');
    }
  };

  const filteredJobdesks = jobdesks.filter(j => {
    if (activeTab === 'Semua') return true;
    return j.category.toLowerCase() === activeTab.toLowerCase();
  });

  const completedCount = filteredJobdesks.filter(j => j.completed).length;
  const totalCount = filteredJobdesks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const sheetNamesList = Object.keys(sheetsData);

  return (
    <div className="min-h-screen bg-[#f7f5ed] flex text-[#1c2826] font-sans">
      
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1b4332] text-white flex flex-col justify-between shrink-0 p-[20px] select-none transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center gap-[10px] pb-5 border-b border-white/10 mb-5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-white flex items-center justify-center text-white shrink-0 overflow-hidden">
  {companyLogoUrl ? (
    <img
      src={companyLogoUrl}
      alt="Logo perusahaan"
      className="w-full h-full object-contain"
    />
  ) : (
    <Leaf className="w-[19px] h-[19px] text-[#2f6850]" />
  )}
</div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight m-0 text-white">
                {brandTitle.includes('Market') ? (
                  <>
                    {brandTitle.replace('Market', '')}
                    <span className="text-[#8c9087] font-normal">Market</span>
                  </>
                ) : (
                  brandTitle
                )}
              </h1>
              <p className="text-[9px] tracking-[0.15em] uppercase text-[#8c9087] font-bold m-0">{brandSubtitle}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8c9087] px-2 mb-2">MENU UTAMA</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setActiveMenu('dashboard'); setIsMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] text-left border-none cursor-pointer transition-colors ${
                    activeMenu === 'dashboard'
                      ? 'bg-[#2f6850] text-white font-semibold'
                      : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-normal'
                  }`}
                >
                  <BarChart3 className="w-[16px] h-[16px] shrink-0" />
                  <span className="text-xs">Dashboard Utama</span>
                </button>
                <button
                  onClick={() => { setActiveMenu('sheets'); setIsMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] text-left border-none cursor-pointer transition-colors ${
                    activeMenu === 'sheets'
                      ? 'bg-[#2f6850] text-white font-semibold'
                      : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-normal'
                  }`}
                >
                  <Database className="w-[16px] h-[16px] shrink-0" />
                  <span className="text-xs">Kelola Sheet (CRUD)</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-xs text-white/70 bg-transparent border-none cursor-pointer px-2 hover:text-white transition-colors text-left"
          >
            <Settings className="w-[15px] h-[15px]" /> Pengaturan
          </button>

          <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-[10px] border border-white/5">
            <HeaderUserProfile fallbackUser={user} compact dark />
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

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden border-none cursor-pointer"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar Navigation */}
        <header className="h-[60px] bg-white border-b border-[#e9e5d9] flex items-center justify-between px-4 sm:px-8 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-[9px] border border-[#e9e5d9] bg-white flex items-center justify-center text-[#2f6850] cursor-pointer shrink-0 hover:bg-[#f7f5ed]"
            >
              <Menu className="w-[17px] h-[17px]" />
            </button>

            <div className="flex items-center gap-2 text-[#8c9087] min-w-0">
            <span className="text-[10px] font-bold tracking-wider uppercase">WORKSPACE</span>
            <span>/</span>
            <span className="font-bold text-[#1c2826] text-[11px]">
              {activeMenu === 'dashboard' ? 'DASHBOARD UTAMA' : `CRUD SHEET: ${activeSheetName.toUpperCase()}`}
            </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[#8c9087]">
            <span className="bg-[#f7f5ed] border border-[#e9e5d9] px-3 py-1 rounded-full text-[11px] font-medium text-[#1c2826]">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <button className="relative bg-transparent border-none text-[#8c9087] cursor-pointer hover:text-[#1c2826]">
              <Bell className="w-[18px] h-[18px]" />
            </button>
            <HeaderUserProfile fallbackUser={user} />
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
          
          {activeMenu === 'dashboard' ? (
            /* ================= VIEW: DASHBOARD UTAMA ================= */
            <div className="max-w-[1300px] mx-auto min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#2f6850]">
                  {brandTitle.toUpperCase()}
                </span>
                <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1c2826] tracking-tight m-0 mt-0.5">
                  Akuntansi & Marketing
                </h1>
                <p className="text-xs text-[#8c9087] m-0 mt-0.5">
                  Kelola checklist jobdesk, pantau endorse, dan kirim rekap pendapatan ke Manager PMS.
                </p>
              </div>

              {/* CARD RINGKASAN PENDAPATAN */}
              <div className="flex flex-col gap-5 min-w-0">
                
                {/* CARD 1: PENDAPATAN MINGGUAN (BULAN INI) */}
                <div className="bg-white p-4 sm:p-6 rounded-[16px] border border-[#e9e5d9] shadow-sm min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c9087]">Total Pendapatan Bulan Ini (Mingguan)</span>
                      <div className="text-[26px] font-bold text-[#1c2826] mt-1">
                        {formatRupiah(totalPendapatanBulanan)}
                      </div>
                      <p className="text-[11px] text-[#2f6850] font-semibold mt-0.5 flex items-center gap-1">
                        <TrendingUp size={14} /> Akumulasi otomatis dari daftar minggu berjalan
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#e8f5e9] text-[#2f6850] flex items-center justify-center shrink-0">
                        <DollarSign size={18} />
                      </div>
                      
                      <button
                        onClick={() => handleSendReportToPMS('Total Pendapatan Bulan Ini', totalPendapatanBulanan, 'bulanan')}
                        disabled={isSendingPMS}
                        className={`px-4 py-2.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer border-none ${
                          sentStatus['bulanan'] 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#1b4332] hover:bg-[#2f6850] text-white'
                        }`}
                      >
                        {sentStatus['bulanan'] ? <Check size={14} /> : <SendHorizontal size={14} />} 
                        {sentStatus['bulanan'] ? 'Terkirim ke PMS!' : 'Kirim ke Manager PMS'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#e9e5d9] pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c2826] block mb-3">
                      Rincian Mingguan (Bulan Ini)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {weeklyData.map((item) => (
                        <div key={item.id} className="bg-[#fdfcf7] p-3 rounded-[10px] border border-[#e9e5d9] flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087] block">{item.minggu}</span>
                          <div className="text-xs font-bold text-[#1c2826] bg-white px-2 py-1.5 rounded-[6px] border border-[#e9e5d9]">
                            {formatRupiah(item.nominal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORM TAMBAH / UPDATE DATA MINGGU */}
                  <div className="border-t border-[#e9e5d9] pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c2826] block mb-3">
                      Tambah / Update Data Minggu
                    </span>
                    <form onSubmit={handleSaveWeeklyIncome} className="flex flex-col sm:flex-row gap-[10px] flex-wrap items-stretch sm:items-end">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087]">Minggu</label>
                        <select
                          value={newWeekLabel}
                          onChange={(e) => setNewWeekLabel(e.target.value)}
                          className="text-xs border border-[#e9e5d9] rounded-[8px] px-3 py-2 bg-white"
                        >
                          {weekOptions.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087]">Nominal (Rp)</label>
                        <input
                          type="text"
                          value={newWeekNominal}
                          onChange={(e) => setNewWeekNominal(formatDisplayNumber(e.target.value))}
                          placeholder="Contoh: 9.000.000"
                           className="text-xs border border-[#e9e5d9] rounded-[8px] px-3 py-2 bg-white w-full sm:w-auto sm:min-w-[180px] min-w-0"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingWeek}
                        className="px-4 py-2 bg-[#2f6850] hover:bg-[#255340] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition shadow-sm cursor-pointer border-none"
                      >
                        <Save size={14} /> {isSavingWeek ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* CARD 2: REKAP BULANAN (JANUARI - OKTOBER) */}
                <div className="bg-white p-4 sm:p-6 rounded-[16px] border border-[#e9e5d9] shadow-sm min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c9087]">Total Pendapatan Tahun Ini (Januari - Oktober)</span>
                      <div className="text-[26px] font-bold text-[#1c2826] mt-1">
                        {formatRupiah(totalPendapatanTahunan)}
                      </div>
                      <p className="text-[11px] text-[#2f6850] font-semibold mt-0.5 flex items-center gap-1">
                        <TrendingUp size={14} /> Akumulasi rekap bulanan lengkap hingga Oktober
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#e8f5e9] text-[#2f6850] flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                      </div>

                      <button
                        onClick={() => handleSendReportToPMS('Total Pendapatan Tahun Ini (Jan-Okt)', totalPendapatanTahunan, 'tahunan')}
                        disabled={isSendingPMS}
                        className={`px-4 py-2.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer border-none ${
                          sentStatus['tahunan'] 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#1b4332] hover:bg-[#2f6850] text-white'
                        }`}
                      >
                        {sentStatus['tahunan'] ? <Check size={14} /> : <SendHorizontal size={14} />} 
                        {sentStatus['tahunan'] ? 'Terkirim ke PMS!' : 'Kirim ke Manager PMS'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#e9e5d9] pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c2826] block mb-3">
                      Rekap Bulanan (Januari s.d. Oktober)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {monthlyData.map((item) => (
                        <div key={item.id} className="bg-[#fdfcf7] p-3 rounded-[10px] border border-[#e9e5d9] flex flex-col justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087] block">{item.minggu}</span>
                          <div className="text-xs font-bold text-[#1c2826] bg-white px-2 py-1.5 rounded-[6px] border border-[#e9e5d9]">
                            {formatRupiah(item.nominal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORM TAMBAH / UPDATE DATA BULAN */}
                  <div className="border-t border-[#e9e5d9] pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c2826] block mb-3">
                      Tambah / Update Data Bulan
                    </span>
                    <form onSubmit={handleSaveMonthlyIncome} className="flex flex-col sm:flex-row gap-[10px] flex-wrap items-stretch sm:items-end">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087]">Bulan</label>
                        <select
                          value={newMonthLabel}
                          onChange={(e) => setNewMonthLabel(e.target.value)}
                          className="text-xs border border-[#e9e5d9] rounded-[8px] px-3 py-2 bg-white"
                        >
                          {monthOptions.map((m) => (
                            <option key={m} value={m}>Bulan {m}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8c9087]">Nominal (Rp)</label>
                        <input
                          type="text"
                          value={newMonthNominal}
                          onChange={(e) => setNewMonthNominal(formatDisplayNumber(e.target.value))}
                          placeholder="Contoh: 250.000.000"
                          className="text-xs border border-[#e9e5d9] rounded-[8px] px-3 py-2 bg-white w-full sm:w-auto sm:min-w-[180px] min-w-0"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingMonth}
                        className="px-4 py-2 bg-[#2f6850] hover:bg-[#255340] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition shadow-sm cursor-pointer border-none"
                      >
                        <Save size={14} /> {isSavingMonth ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
              <div className="mb-6">
              <ManagerMessageBox />
              </div>

              {/* Tambahan: riwayat pesan milik akun Akuntansi & Marketing */}
              <div className="mb-6">
                <section className="bg-white rounded-[16px] border border-[#e9e5d9] p-4 sm:p-6 shadow-sm min-w-0">
                  <div className="mb-5">
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8c9087] mb-1">
                      RIWAYAT PESAN
                    </p>
                    <h2 className="text-[18px] font-bold text-[#1c2826] tracking-tight leading-snug m-0">
                      Pesan Saya ke Manager PMS
                    </h2>
                    <p className="text-[11px] text-[#8c9087] m-0 mt-1">
                      Hanya pesan yang dikirim oleh akun Akuntansi & Marketing ini yang ditampilkan.
                    </p>
                  </div>

                  <div className="flex flex-col divide-y divide-[#e9e5d9]">
                    {myManagerMessages.length > 0 ? (
                      myManagerMessages.map((message) => (
                        <div key={message.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2f6850]/10 text-[#2f6850]">
                              Akuntansi & Marketing
                            </span>
                            <span className="text-[11px] text-[#8c9087]">
                              • {message.date || message.created_at || '—'}
                            </span>
                          </div>

                          <p className="text-xs text-[#1c2826] m-0 leading-relaxed whitespace-pre-wrap">
                            {message.content || message.message || ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 text-xs text-[#8c9087]">
                        Belum ada pesan yang dikirim ke Manager PMS.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* 3 KOLOM: CHECKLIST, ENDORSE, PINTASAN SHEET */}
              <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-start">
                
                {/* CHECKLIST JOBDESK */}
                <div style={{ flex: '1 1 360px' }}>
                  <JobdeskInbox />
                </div>

                {/* MANAJEMEN ENDORSE */}
                <div className="bg-white rounded-[16px] border border-[#e9e5d9] p-4 sm:p-6 shadow-sm min-w-0 space-y-6" style={{ flex: '1 1 360px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h2 className="text-[15px] font-bold text-[#1c2826] m-0" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={18} className="text-[#2f6850]" /> Manajemen Endorse
                        </h2>
                        <p className="text-xs text-[#8c9087] m-0 mt-1">
                          Daftar calon influencer & status outreach
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold text-[#2f6850] bg-[#e8f5e9]">
                        {endorseList.length} Calon
                      </span>
                    </div>

                    <div className="w-full bg-[#f7f5ed] h-2 rounded-full overflow-hidden border border-[#e9e5d9]">
                      <div 
                        className="bg-[#2f6850] h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${Math.round((endorseList.filter(e => e.status === 'Deal').length / (endorseList.length || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {endorseList.length === 0 ? (
                      <p className="text-xs text-center text-[#8c9087] py-6">Belum ada calon endorse.</p>
                    ) : (
                      endorseList.map((item) => {
                        const isEditingEndorse = editingEndorseId === item.id;
                        let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        if (item.status === 'Dihubungi') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        if (item.status === 'Deal') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                        let platformIconUrl = 'https://img.magnific.com/premium-vector/modern-badge-logo-instagram-icon_578229-124.jpg?semt=ais_test_b&w=740&q=80';
                        if (item.platform === 'TikTok') {
                          platformIconUrl = 'https://img.magnific.com/premium-vector/tiktok-logo-free-download-tiktok-marker-free-icon-latest-tiktok_999008-1829.jpg?semt=ais_test_b&w=740&q=80';
                        } else if (item.platform === 'YouTube') {
                          platformIconUrl = 'https://img.magnific.com/vektor-premium/logo-youtube-pada-latar-belakang-putih-hosting-video-platform-unggah-video-vlog-konten-digital-media-sosial-aliran-saluran-aktivitas-blogger-tombot-putar-logo-aplikasi-editorial_661108-8054.jpg?semt=ais_hybrid&w=740&q=80';
                        }

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-[12px] border border-[#e9e5d9] hover:border-[#2f6850] transition bg-[#fdfcf7]"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <div className="w-8 h-8 rounded-[8px] bg-white border border-[#e9e5d9] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-xs">
                                <img src={platformIconUrl} alt={item.platform} className="w-full h-full object-contain" />
                              </div>

                              {isEditingEndorse ? (
                                <div className="flex flex-col gap-1.5 flex-1 mr-2">
                                  <input
                                    type="text"
                                    value={endorseEditForm.name}
                                    onChange={(e) => setEndorseEditForm({ ...endorseEditForm, name: e.target.value })}
                                    className="px-2 py-1 bg-white border border-[#2f6850] rounded-[6px] text-xs focus:outline-none"
                                    placeholder="Username..."
                                  />
                                  <select
                                    value={endorseEditForm.platform}
                                    onChange={(e) => setEndorseEditForm({ ...endorseEditForm, platform: e.target.value })}
                                    className="px-2 py-1 bg-white border border-[#2f6850] rounded-[6px] text-[11px] focus:outline-none"
                                  >
                                    <option value="Instagram">Instagram</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="YouTube">YouTube</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1c2826] m-0 truncate">{item.name}</p>
                                  <p className="text-[10px] text-[#8c9087] m-0 mt-0.5">{item.platform}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isEditingEndorse ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEndorse(item.id)}
                                    className="p-1.5 bg-[#2f6850] text-white rounded-[6px] cursor-pointer border-none hover:bg-[#255340]"
                                    title="Simpan"
                                  >
                                    <Save size={13} />
                                  </button>
                                  <button
                                    onClick={() => setEditingEndorseId(null)}
                                    className="p-1.5 bg-gray-200 text-gray-700 rounded-[6px] cursor-pointer border-none hover:bg-gray-300"
                                    title="Batal"
                                  >
                                    <X size={13} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleCycleEndorseStatus(item.id)}
                                    className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold border cursor-pointer transition ${badgeColor}`}
                                    title="Klik untuk mengubah status"
                                  >
                                    {item.status}
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setEditingEndorseId(item.id);
                                      setEndorseEditForm({ name: item.name, platform: item.platform });
                                    }}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-[6px] cursor-pointer border-none hover:bg-blue-100"
                                    title="Edit Influencer"
                                  >
                                    <Edit2 size={13} />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteEndorse(item.id, item.name)}
                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-[6px] cursor-pointer border-none hover:bg-rose-100"
                                    title="Hapus Influencer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleAddEndorse} style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="@username influencer..."
                      value={newEndorseName}
                      onChange={(e) => setNewEndorseName(e.target.value)}
                      className="flex-1 h-[38px] px-3 text-xs bg-[#fdfcf7] border border-[#e9e5d9] rounded-[10px] focus:outline-none focus:border-[#2f6850] transition placeholder:text-[#8c9087]"
                    />
                    <select
                      value={newEndorsePlatform}
                      onChange={(e) => setNewEndorsePlatform(e.target.value)}
                      className="h-[38px] px-2 text-[11px] bg-[#fdfcf7] border border-[#e9e5d9] rounded-[10px] text-[#1c2826] focus:outline-none focus:border-[#2f6850]"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                    <button
                      type="submit"
                      className="h-[38px] px-3 bg-[#2f6850] hover:bg-[#255340] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0 border-none"
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                </div>

                {/* PINTASAN SHEET & TABEL */}
                <div className="bg-white rounded-[16px] border border-[#e9e5d9] p-4 sm:p-6 shadow-sm min-w-0 space-y-4" style={{ flex: '1 1 340px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e5d9', paddingBottom: '14px' }}>
                    <div>
                      <h2 className="text-[15px] font-bold text-[#1c2826] m-0" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} className="text-[#2f6850]" /> Pintasan Sheet & Tabel
                      </h2>
                      <p className="text-xs text-[#8c9087] m-0 mt-1">
                        Pilih tabel untuk melakukan CRUD data.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {sheetNamesList.map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setActiveSheetName(name);
                          setActiveMenu('sheets');
                        }}
                        className="w-full text-left p-3 rounded-[10px] bg-[#fdfcf7] hover:bg-[#e8f5e9] border border-[#e9e5d9] hover:border-[#2f6850] transition flex justify-between items-center cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-[#1c2826]">{name}</span>
                        <span className="text-[10px] bg-[#2f6850] text-white px-2 py-0.5 rounded-full font-bold">
                          {sheetsData[name]?.length || 0} baris
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* ================= VIEW: KELOLA SHEET (CRUD) ================= */
            <div className="max-w-[1300px] mx-auto min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#2f6850]">
                    MANAJEMEN DATABASE SHEET
                  </span>
                  <h1 className="text-[22px] font-bold text-[#1c2826] tracking-tight m-0 mt-0.5">
                    {activeSheetName}
                  </h1>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddRow}
                    className="px-4 py-2 bg-[#2f6850] hover:bg-[#255340] text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition shadow-sm cursor-pointer border-none"
                  >
                    <Plus size={16} /> Tambah Baris Data
                  </button>
                </div>
              </div>

              {/* Selector Tab Sheet */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {sheetNamesList.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setActiveSheetName(name);
                      setEditingRowId(null);
                    }}
                    className={`px-3.5 py-2 rounded-[10px] text-xs font-semibold transition cursor-pointer border ${
                      activeSheetName === name
                        ? 'bg-[#1b4332] text-white border-[#1b4332]'
                        : 'bg-white text-[#1c2826] border-[#e9e5d9] hover:bg-[#e9e5d9]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Table Data */}
              <div className="bg-white rounded-[16px] border border-[#e9e5d9] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-max">
                    <thead>
                      <tr className={activeSheetName === 'Penjualan Lokal'
                        ? 'bg-[#2f6b57] border-b border-[#245443] text-white uppercase text-[10px] tracking-wider'
                        : 'bg-[#f7f5ed] border-b border-[#e9e5d9] text-[#8c9087] uppercase text-[10px] tracking-wider'}
                      >
                        {getSheetColumns(activeSheetName).map(([key, label]) => (
                          <th key={key} className="p-3 font-bold whitespace-nowrap">{label}</th>
                        ))}
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9e5d9]">
                      {(!sheetsData[activeSheetName] || sheetsData[activeSheetName].length === 0) ? (
                        <tr>
                          <td colSpan={getSheetColumns(activeSheetName).length + 1} className="text-center py-8 text-[#8c9087]">
                            Belum ada data pada sheet ini. Silakan klik "Tambah Baris Data".
                          </td>
                        </tr>
                      ) : (
                        sheetsData[activeSheetName].map((row, rowIndex) => {
                          const isEditing = editingRowId === row.id;

                          return (
                            <tr key={row.id} className={activeSheetName === 'Penjualan Lokal'
                              ? `${rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#f5f7f6]'} hover:bg-[#eef5f2] transition`
                              : 'hover:bg-[#fdfcf7] transition'}>
                              {getSheetColumns(activeSheetName).map(([key]) => {
                                const keyLower = key.toLowerCase();

                                if (key === '__no') {
                                  return (
                                    <td key={key} className="p-3 text-[#8c9087] whitespace-nowrap text-center font-mono">
                                      {rowIndex + 1}
                                    </td>
                                  );
                                }

                                if (isEditing) {
                                  if (DATETIME_FIELDS.has(keyLower)) {
                                    return (
                                      <td key={key} className="p-2 min-w-[180px]">
                                        <input
                                          type="datetime-local"
                                          value={normalizeDatetimeLocal(formData[key])}
                                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-[#2f6850] rounded-md focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                                        />
                                      </td>
                                    );
                                  }

                                  if (DATE_FIELDS.has(keyLower)) {
                                    return (
                                      <td key={key} className="p-2">
                                        <input
                                          type="date"
                                          value={normalizeDate(formData[key])}
                                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-[#2f6850] rounded-md focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                                        />
                                      </td>
                                    );
                                  }

                                  if (AUTO_CALCULATED_FIELDS.has(keyLower)) {
                                    let calculatedValue = formData[key] ?? row[key];

                                    // Shopify: total tanaman selalu dihitung dari qty x harga tanaman.
                                    if (activeSheetName === 'Data Order Shopify' && keyLower === 'total_price') {
                                      const qty = normalizeInteger(formData.quantity);
                                      const price = normalizeNumeric(formData.price_per_unit);
                                      calculatedValue = (qty !== null && price !== null) ? qty * price : 0;
                                    }

                                    const calculatedDisplay = USD_FIELDS.has(keyLower)
                                      ? formatUsd(calculatedValue)
                                      : formatRupiah(calculatedValue);

                                    return (
                                      <td key={key} className="p-2 min-w-[120px]">
                                        <input
                                          type="text"
                                          value={calculatedDisplay}
                                          disabled
                                          className="w-full px-3 py-1.5 border border-[#e9e5d9] rounded-md bg-gray-100 text-gray-500 text-xs text-right cursor-not-allowed"
                                        />
                                      </td>
                                    );
                                  }

                                  if (BOOLEAN_FIELDS.has(keyLower)) {
                                    return (
                                      <td key={key} className="p-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={formData[key] === true}
                                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                          className="w-4 h-4 accent-[#2f6850] cursor-pointer"
                                        />
                                      </td>
                                    );
                                  }

                                  if (SELECT_FIELD_OPTIONS[activeSheetName]?.[keyLower]) {
                                    return (
                                      <td key={key} className="p-2 min-w-[150px]">
                                        <select
                                          value={formData[key] ?? ''}
                                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-[#2f6850] rounded-md focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                                        >
                                          {SELECT_FIELD_OPTIONS[activeSheetName][keyLower].map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      </td>
                                    );
                                  }

                                  if (NUMBER_FIELDS.has(keyLower)) {
                                    return (
                                      <td key={key} className="p-2 min-w-[120px]">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder="0"
                                          value={formatEditableNumber(formData[key], keyLower)}
                                          onChange={(e) => {
                                            const clean = sanitizeTypedNumber(e.target.value, keyLower);
                                            setFormData({ ...formData, [key]: clean });
                                          }}
                                          className="w-full px-3 py-1.5 border border-[#2f6850] rounded-md focus:ring-2 focus:ring-emerald-500 text-xs font-mono text-right bg-white"
                                        />
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={key} className="p-2 min-w-[140px]">
                                      <input
                                        type="text"
                                        placeholder={`Isi ${key}...`}
                                        value={formData[key] !== undefined ? formData[key] : ''}
                                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-[#2f6850] rounded-md focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                                      />
                                    </td>
                                  );
                                }

                                let displayValue = row[key];

                                if (BOOLEAN_FIELDS.has(keyLower)) {
                                  displayValue = displayValue ? 'Ya' : 'Tidak';
                                } else if (USD_FIELDS.has(keyLower) && displayValue !== null && displayValue !== '') {
                                  displayValue = formatUsd(displayValue);
                                } else if (PLAIN_NUMBER_FIELDS.has(keyLower) && displayValue !== null && displayValue !== '') {
                                  displayValue = formatRibuan(displayValue);
                                } else if (
                                  (NUMBER_FIELDS.has(keyLower) || AUTO_CALCULATED_FIELDS.has(keyLower))
                                  && displayValue !== null
                                  && displayValue !== ''
                                ) {
                                  displayValue = formatRupiah(displayValue);
                                } else if (DATETIME_FIELDS.has(keyLower) && displayValue) {
                                  const d = new Date(displayValue);
                                  displayValue = Number.isNaN(d.getTime())
                                    ? displayValue
                                    : d.toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      });
                                } else if (DATE_FIELDS.has(keyLower) && displayValue) {
                                  const d = new Date(displayValue);
                                  displayValue = Number.isNaN(d.getTime())
                                    ? displayValue
                                    : d.toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      });
                                }

                                return (
                                  <td key={key} className="p-3 text-[#1c2826] whitespace-nowrap">
                                    <span>{displayValue ?? '-'}</span>
                                  </td>
                                );
                              })}

                              <td className="p-3 text-right whitespace-nowrap">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRow(row.id)}
                                      className="p-1.5 bg-[#2f6850] text-white rounded-[6px] cursor-pointer border-none hover:bg-[#255340]"
                                      title="Simpan"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (String(row.id).startsWith('new-')) {
                                          setSheetsData((prev) => ({
                                            ...prev,
                                            [activeSheetName]: (prev[activeSheetName] || []).filter((item) => item.id !== row.id),
                                          }));
                                        }
                                        setEditingRowId(null);
                                        setFormData({});
                                      }}
                                      className="p-1.5 bg-gray-200 text-gray-700 rounded-[6px] cursor-pointer border-none hover:bg-gray-300"
                                      title="Batal"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditRow(row)}
                                      className="p-1.5 bg-blue-50 text-blue-600 rounded-[6px] cursor-pointer border-none hover:bg-blue-100"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="p-1.5 bg-rose-50 text-rose-600 rounded-[6px] cursor-pointer border-none hover:bg-rose-100"
                                      title="Hapus"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      <ProfileSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fallbackUser={user}
      />

    </div>
  );
}
