import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';

const SHEET_ORDER = [
  'Buku Kas',
  'Operasional',
  'Penjualan Lokal',
  'Data Order Shopify',
  'Uang $ Aroid Market',
  'Belanja Tanaman Order',
  'Orderan Terkirim',
  'Tanaman Baru',
];

// Kolom UI dibuat eksplisit agar mengikuti spreadsheet, bukan mengikuti
// seluruh field database secara otomatis.
const SHEET_CONFIGS = {
  'Buku Kas': [
    { key: 'Tanggal', label: 'Tanggal', type: 'date' },
    { key: 'Deskripsi', label: 'Deskripsi', type: 'text' },
    { key: 'Akun', label: 'Akun', type: 'text' },
    { key: 'Debit', label: 'Debit', type: 'currency-idr' },
    { key: 'Kredit', label: 'Kredit', type: 'currency-idr' },
    { key: 'Saldo', label: 'Saldo', type: 'currency-idr', calculated: true },
  ],
  'Operasional': [
    { key: 'cost_date', label: 'Cost Date', type: 'date' },
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'item_name', label: 'Item Name', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'subcategory', label: 'Subcategory', type: 'text' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'price', label: 'Price', type: 'currency-idr' },
    { key: 'subtotal', label: 'Subtotal', type: 'currency-idr', calculated: true },
    { key: 'note', label: 'Note', type: 'text' },
  ],
  'Penjualan Lokal': [
    { key: 'sale_date', label: 'Tgl', type: 'date' },
    { key: 'source', label: 'Sumber', type: 'text' },
    { key: 'invoice_type', label: 'Inv', type: 'text' },
    { key: 'customer_name', label: 'Nama Pembeli', type: 'text' },
    { key: 'quantity', label: 'Qty', type: 'number' },
    { key: 'item_name', label: 'Orderan', type: 'text' },
    { key: 'price_per_unit', label: 'Price', type: 'currency-idr' },
    { key: 'total_price', label: 'Total', type: 'currency-idr', calculated: true },
    { key: 'note', label: 'Keterangan', type: 'text' },
  ],
  'Data Order Shopify': [
    { key: 'order_number', label: 'Name', type: 'text' },
    { key: 'paid_at', label: 'Paid at', type: 'datetime' },
        { key: 'quantity', label: 'Lineitem Quantity', type: 'number' },
    { key: 'item_name', label: 'Lineitem Name', type: 'text' },
    { key: 'customer_name', label: 'Billing Name', type: 'text' },
    { key: 'payment_method', label: 'Payment Method', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'text' },
    { key: 'price_per_unit', label: 'Harga Tanaman', type: 'currency-idr' },
    { key: 'total_price', label: 'Total Tanaman', type: 'currency-idr', calculated: true },
    { key: 'packing_fee', label: 'Jasa Packing', type: 'currency-idr' },
    { key: 'shipped', label: 'Terkirim', type: 'boolean' },
    { key: 'ship_date', label: 'Tanggal Kirim', type: 'date' },
  ],
  'Uang $ Aroid Market': [
    { key: 'transaction_date', label: 'Tanggal', type: 'date' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'payment_method', label: 'Payment Method', type: 'text' },
    { key: 'total_usd', label: 'Total ($)', type: 'currency-usd' },
    { key: 'penahanan_usd', label: 'Penahanan ($)', type: 'currency-usd' },
    { key: 'admin_fee_usd', label: 'Potongan Admin ($)', type: 'currency-usd' },
    { key: 'net_usd', label: 'Net ($)', type: 'currency-usd', calculated: true },
    { key: 'withdrawal_usd', label: 'Penarikan ($)', type: 'currency-usd' },
    { key: 'withdrawal_idr', label: 'Penarikan (Rp)', type: 'currency-idr', calculated: true },
  ],
  'Belanja Tanaman Order': [
    { key: 'purchase_date', label: 'Tanggal', type: 'date' },
    { key: 'supplier_name', label: 'Supplier', type: 'text' },
    { key: 'purpose_order_reference', label: 'No Order', type: 'text' },
    { key: 'plant_name', label: 'Nama Tanaman', type: 'text' },
    { key: 'quantity', label: 'Qty', type: 'number' },
    { key: 'price_per_unit', label: 'Price', type: 'currency-idr' },
    { key: 'subtotal', label: 'Subtotal', type: 'currency-idr', calculated: true },
  ],
  'Orderan Terkirim': [
    { key: 'order_number', label: 'No Order', type: 'text' },
    { key: 'quantity', label: 'Jumlah Tanaman', type: 'number' },
    { key: 'ship_date', label: 'Tanggal Kirim', type: 'date' },
    { key: 'status', label: 'Status Paket', type: 'text' },
    { key: 'courier', label: 'Metode Kirim', type: 'text' },
    { key: 'payment_method', label: 'Metode Payment', type: 'text' },
    { key: 'revenue_usd', label: 'Pendapatan ($)', type: 'currency-usd' },
    { key: 'total_plant_value', label: 'Total Tanaman', type: 'currency-idr' },
    { key: 'packing_cost', label: 'Biaya Packing', type: 'currency-idr' },
    { key: 'domestic_shipping_cost', label: 'Ongkir Indo', type: 'currency-idr' },
    { key: 'palmstreet_fee', label: 'Biaya PS', type: 'currency-idr' },
    { key: 'profit_loss', label: 'Laba/Rugi', type: 'currency-idr', calculated: true },
  ],
  'Tanaman Baru': [
    { key: 'purchase_date', label: 'Date', type: 'date' },
    { key: 'supplier_name', label: 'Supplier', type: 'text' },
    { key: 'plant_name', label: 'Name of Plants', type: 'text' },
    { key: 'quantity', label: 'Qty', type: 'number' },
    { key: 'price_per_unit', label: 'Price', type: 'currency-idr' },
    { key: 'subtotal', label: 'Subtotal', type: 'currency-idr', calculated: true },
    { key: 'total_price', label: 'Total', type: 'currency-idr', calculated: true },
    { key: 'note', label: 'Note', type: 'text' },
  ],
};

const formatNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : String(value ?? '');
};

const formatCurrency = (value, currency) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '-');
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(n);
};

const formatDateValue = (value, withTime = false) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  ).format(date);
};

const formatUangAroidMarketUsd = (value) => {
  if (value === null || value === undefined || value === '') return '-';

  let raw = String(value).trim();
  if (!raw || raw === '-') return '-';

  raw = raw
    .replace(/^US\$\s*/i, '')
    .replace(/^\$\s*/i, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');

  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) {
    return String(value);
  }

  const [wholeRaw, fractionRaw] = raw.split('.');
  const sign = wholeRaw.startsWith('-') ? '-' : '';
  const whole = (sign ? wholeRaw.slice(1) : wholeRaw)
    .replace(/^0+(?=\d)/, '') || '0';

  const groupedWhole = whole.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  );

  let fraction = '';
  if (fractionRaw !== undefined) {
    // USD pada kedua sheet ditampilkan maksimal 2 digit desimal.
    // Trailing zero dipertahankan secara visual:
    // 900.20 -> 900.20, 900.21 -> 900.21.
    fraction = `.${fractionRaw.padEnd(2, '0').slice(0, 2)}`;
  }

  return `$${sign}${groupedWhole}${fraction}`;
};

const displayValue = (value, config, sheetName = '') => {
  if (value === null || value === undefined || value === '') return '-';

  if (config.type === 'currency-idr') return formatCurrency(value, 'IDR');

  if (config.type === 'currency-usd') {
    // Khusus Uang $ Aroid Market:
    // jangan pernah scale/divide angka. Titik di tabel hanya separator ribuan,
    // sedangkan titik desimal yang memang berasal dari nilai USD tetap dipertahankan.
    if (
      sheetName === 'Uang $ Aroid Market' ||
      sheetName === 'Orderan Terkirim'
    ) {
      return formatUangAroidMarketUsd(value);
    }

    // Pertahankan formatter USD yang sudah ada untuk sheet lain.
    const raw = String(value).trim();

    const cleaned = raw
      .replace(/^Rp\s*/i, '')
      .replace(/^US\$\s*/i, '')
      .replace(/^\$\s*/, '')
      .trim();

    if (cleaned !== '' && /^-?\d+(?:\.\d+)?$/.test(cleaned)) {
      const numeric = Number(cleaned);
      if (Number.isFinite(numeric)) {
        return `$${numeric.toLocaleString('en-US', {
          useGrouping: true,
          maximumFractionDigits: 2,
        })}`;
      }
    }

    return raw;
  }

  if (config.type === 'number') return formatNumber(value);
  if (config.type === 'date') return formatDateValue(value);
  if (config.type === 'datetime') return formatDateValue(value, true);
  if (config.type === 'boolean') {
    return value === true || value === 1 || value === '1' || value === 'true' ? 'Ya' : 'Tidak';
  }

  return String(value);
};

const getSheetConfig = (sheetName) => SHEET_CONFIGS[sheetName] || [];

const getRawNumericString = (value) => {
  if (value === null || value === undefined) return '';

  const text = String(value).trim();
  if (!text || text === '-') return '';

  return text
    .replace(/^Rp\s*/i, '')
    .replace(/^\$\s*/, '')
    .replace(/[^0-9.,-]/g, '');
};

const formatEditableNumber = (value, { decimal = false } = {}) => {
  const raw = getRawNumericString(value);
  if (!raw) return '';

  const normalized = decimal
    ? raw.replace(/,/g, '')
    : raw.replace(/[.,]/g, '');

  if (decimal) {
    const [whole = '', fraction = ''] = normalized.split('.');
    const formattedWhole = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return fraction ? `${formattedWhole || '0'}.${fraction.slice(0, 2)}` : formattedWhole;
  }

  return normalized
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Format angka USD untuk ditampilkan di dalam input (bukan tabel).
// Pemisah ribuan HARUS koma (gaya dolar), titik HANYA untuk desimal.
// Ini sengaja dibuat terpisah dari formatEditableNumber (gaya IDR, titik =
// ribuan) supaya tidak ada ambiguitas titik ribuan vs titik desimal yang
// dulu menyebabkan "9000" terbaca sebagai "9".
const formatUsdEditableNumber = (value) => {
  if (value === null || value === undefined) return '';

  let raw = String(value).trim();
  if (!raw || raw === '-') return '';

  const isNegative = raw.startsWith('-');
  raw = raw
    .replace(/^\$\s*/, '')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');

  if (!raw) return '';

  const dotIndex = raw.indexOf('.');
  const hasDot = dotIndex !== -1;
  const wholeRaw = hasDot ? raw.slice(0, dotIndex) : raw;
  const fraction = hasDot ? raw.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2) : '';

  const whole = wholeRaw.replace(/^0+(?=\d)/, '');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const result = hasDot ? `${groupedWhole || '0'}.${fraction}` : groupedWhole;

  return (isNegative ? '-' : '') + result;
};

export default function FinanceView({ sheets = {} }) {
  // Urutan tab dibuat tetap agar konsisten dengan spreadsheet.
  const sheetKeys = SHEET_ORDER;
  const [activeTab, setActiveTab] = useState(sheetKeys[0]);
  const currentData = Array.isArray(sheets[activeTab]) ? sheets[activeTab] : [];
  const currentConfig = getSheetConfig(activeTab);

  // --- STATE MODAL CRUD ---
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [formData, setFormData] = useState({});

  const editableFields = useMemo(
    () => currentConfig.filter((field) => !field.calculated),
    [currentConfig]
  );

  const getInitialValue = (field, row = null) => {
    if (row) {
      const value = row[field.key] ?? '';

      if (field.type === 'currency-idr') return formatEditableNumber(value);
      if (field.type === 'currency-usd') {
        // Sheet "Uang $ Aroid Market": pakai formatter USD (koma = ribuan,
        // titik = desimal). JANGAN pakai formatEditableNumber(decimal:true)
        // di sini: fungsi itu menyisipkan "." sebagai pemisah ribuan gaya
        // IDR (mis. 9000 -> "9.000"), yang saat disubmit terbaca ulang oleh
        // Number() sebagai desimal (9.000 -> 9). Itulah akar masalah lama
        // 9000 -> $9.
        if (activeTab === 'Uang $ Aroid Market' || activeTab === 'Orderan Terkirim') {
          return formatUsdEditableNumber(value);
        }
        return formatEditableNumber(value, { decimal: true });
      }

      if (field.type === 'datetime' && value) {
        const parsed = new Date(value);

        if (!Number.isNaN(parsed.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
        }
      }

      return value;
    }

    if (field.type === 'date') return new Date().toISOString().split('T')[0];
    if (field.type === 'datetime') return '';
    if (field.type === 'number' || field.type === 'currency-idr' || field.type === 'currency-usd') return '';
    if (field.type === 'boolean') return false;

    return '';
  };

  const handleOpenAdd = () => {
    const initialForm = {};
    editableFields.forEach((field) => {
      initialForm[field.key] = getInitialValue(field);
    });

    setSelectedRowId(null);
    setFormData(initialForm);
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenEdit = (row) => {
    const initialForm = {};
    editableFields.forEach((field) => {
      initialForm[field.key] = getInitialValue(field, row);
    });

    setSelectedRowId(row.id);
    setFormData(initialForm);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    if (field.type === 'currency-idr') {
      setFormData((prev) => ({ ...prev, [field.key]: formatEditableNumber(value) }));
      return;
    }

    if (field.type === 'currency-usd') {
      if (activeTab === 'Uang $ Aroid Market' || activeTab === 'Orderan Terkirim') {
        setFormData((prev) => ({ ...prev, [field.key]: formatUsdEditableNumber(value) }));
      } else {
        setFormData((prev) => ({ ...prev, [field.key]: formatEditableNumber(value, { decimal: true }) }));
      }
      return;
    }

    if (field.type === 'number') {
      const numericOnly = String(value ?? '').replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [field.key]: numericOnly }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field.key]: value }));
  };

  const parseNumericInput = (value, { decimal = false } = {}) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const text = String(value ?? '').trim();

    // Tampilan "-" berarti tidak ada nilai, bukan angka negatif.
    if (!text || text === '-') return 0;

    let cleaned = text
      .replace(/Rp/gi, '')
      .replace(/\s/g, '');

    if (decimal) {
      // Untuk USD: 1,250.50 -> 1250.50
      cleaned = cleaned.replace(/,/g, '');
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
    } else {
      // Untuk Rupiah: 250.000.000 -> 250000000
      cleaned = cleaned.replace(/[.,]/g, '');
      cleaned = cleaned.replace(/[^0-9-]/g, '');
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseIdrInput = (value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const text = String(value ?? '').trim();
    if (!text || text === '-') return 0;

    const cleaned = text
      .replace(/Rp/gi, '')
      .replace(/\s/g, '')
      .replace(/[.,]/g, '')
      .replace(/[^0-9-]/g, '');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let payload = { ...formData };

    if (activeTab === 'Buku Kas') {
      const debit = parseNumericInput(formData.Debit);
      const kredit = parseNumericInput(formData.Kredit);

      if (debit > 0 && kredit > 0) {
        alert('Buku Kas tidak boleh memiliki Debit dan Kredit sekaligus.');
        return;
      }

      const amount = debit > 0 ? debit : kredit;
      const type = debit > 0 ? 'in' : 'out';

      if (amount <= 0) {
        alert('Nominal Debit atau Kredit wajib diisi lebih besar dari 0.');
        return;
      }

      payload = {
        transaction_date: formData.Tanggal ?? '',
        description: formData.Deskripsi ?? '',
        category: formData.Akun ?? '',
        type,
        amount,
        Debit: debit,
        Kredit: kredit,
      };
    } else if (activeTab === 'Operasional') {
      payload = {
        cost_date: formData.cost_date ?? '',
        supplier: formData.supplier ?? '',
        item_name: formData.item_name ?? '',
        category: formData.category ?? '',
        subcategory: formData.subcategory ?? '',
        quantity: parseNumericInput(formData.quantity),
        price: parseIdrInput(formData.price),
        note: formData.note ?? '',
      };

      if (payload.quantity < 1) {
        alert('Quantity wajib diisi minimal 1.');
        return;
      }

      if (payload.price < 0) {
        alert('Price tidak boleh bernilai negatif.');
        return;
      }
    } else if (activeTab === 'Penjualan Lokal') {
      payload = {
        sale_date: formData.sale_date ?? '',
        source: formData.source ?? '',
        invoice_type: formData.invoice_type ?? '',
        customer_name: formData.customer_name ?? '',
        quantity: parseNumericInput(formData.quantity),
        item_name: formData.item_name ?? '',
        price_per_unit: parseIdrInput(formData.price_per_unit),
        note: formData.note ?? '',
      };

      if (!payload.sale_date) {
        alert('Tanggal penjualan wajib diisi.');
        return;
      }

      if (!payload.customer_name.trim()) {
        alert('Nama pembeli wajib diisi.');
        return;
      }

      if (payload.quantity < 1) {
        alert('Quantity wajib diisi minimal 1.');
        return;
      }

      if (payload.price_per_unit < 0) {
        alert('Price tidak boleh bernilai negatif.');
        return;
      }
    } else if (activeTab === 'Data Order Shopify') {
      payload = {
        order_number: formData.order_number ?? '',
        paid_at: formData.paid_at ?? '',
        customer_name: formData.customer_name ?? '',
        quantity: parseNumericInput(formData.quantity),
        item_name: formData.item_name ?? '',
        payment_method: formData.payment_method ?? '',
        tags: formData.tags ?? '',
        price_per_unit: parseIdrInput(formData.price_per_unit),
        packing_fee: parseIdrInput(formData.packing_fee),
        shipped: Boolean(formData.shipped),
        ship_date: formData.ship_date ?? '',
      };

      if (!payload.order_number.trim()) {
        alert('Name / Order Number wajib diisi.');
        return;
      }

      if (payload.quantity < 1) {
        alert('Lineitem Quantity wajib diisi minimal 1.');
        return;
      }

      if (payload.total_usd < 0 || payload.price_per_unit < 0 || payload.packing_fee < 0) {
        alert('Nilai nominal tidak boleh bernilai negatif.');
        return;
      }
    } else if (activeTab === 'Orderan Terkirim') {
      const parseOptionalUsd = (value) => {
        const raw = String(value ?? '').trim();
        if (raw === '') return null;

        const cleaned = raw
          .replace(/^\$\s*/i, '')
          .replace(/\s/g, '')
          .replace(/,/g, '');

        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
      };

      payload = {
        order_number: formData.order_number ?? '',
        quantity: parseNumericInput(formData.quantity),
        ship_date: formData.ship_date ?? '',
        status: formData.status ?? '',
        courier: formData.courier ?? '',
        payment_method: formData.payment_method ?? '',
        revenue_usd: parseOptionalUsd(formData.revenue_usd),
        total_plant_value: parseIdrInput(formData.total_plant_value),
        packing_cost: parseIdrInput(formData.packing_cost),
        domestic_shipping_cost: parseIdrInput(formData.domestic_shipping_cost),
        palmstreet_fee: parseIdrInput(formData.palmstreet_fee),
      };

      if (!payload.order_number.trim()) {
        alert('No Order wajib diisi.');
        return;
      }

      if (payload.quantity < 1) {
        alert('Jumlah Tanaman wajib diisi minimal 1.');
        return;
      }

      if (!payload.ship_date) {
        alert('Tanggal Kirim wajib diisi.');
        return;
      }

      if (!payload.status.trim()) {
        alert('Status Paket wajib diisi.');
        return;
      }

      if (!payload.courier.trim()) {
        alert('Metode Kirim wajib diisi.');
        return;
      }

      if (!payload.payment_method.trim()) {
        alert('Metode Payment wajib diisi.');
        return;
      }

      if (payload.revenue_usd !== null && payload.revenue_usd < 0) {
        alert('Pendapatan ($) tidak boleh bernilai negatif.');
        return;
      }

      if (payload.total_plant_value < 0 || payload.packing_cost < 0 ||
          payload.domestic_shipping_cost < 0 || payload.palmstreet_fee < 0) {
        alert('Nilai biaya tidak boleh bernilai negatif.');
        return;
      }
    } else if (activeTab === 'Uang $ Aroid Market') {
      const parseOptionalUsd = (value) => {
        const raw = String(value ?? '').trim();
        if (raw === '') return null;
        // Buang "$" dan koma pemisah ribuan (dari formatUsdEditableNumber)
        // supaya yang terkirim string angka bersih, mis. "9000" atau "25.50".
        const cleaned = raw.replace(/\$/g, '').replace(/\s/g, '').replace(/,/g, '');
        return cleaned === '' ? null : cleaned;
      };

      const parseOptionalNumber = (value) => {
        const raw = String(value ?? '').trim();
        if (raw === '') return null;
        const normalized = raw.replace(/\$/g, '').replace(/\s/g, '').replace(/,/g, '');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
      };

      payload = {
        transaction_date: formData.transaction_date ?? '',
        name: formData.name ?? '',
        payment_method: formData.payment_method ?? '',
        total_usd: parseOptionalNumber(formData.total_usd),
        penahanan_usd: parseOptionalNumber(formData.penahanan_usd),
        admin_fee_usd: parseOptionalNumber(formData.admin_fee_usd),
        withdrawal_usd: parseOptionalUsd(formData.withdrawal_usd),
      };

      if (!payload.name.trim()) {
        alert('Name wajib diisi.');
        return;
      }

      if (!payload.payment_method.trim()) {
        alert('Payment Method wajib diisi.');
        return;
      }
    }
    const endpoint = `/manager/sheet/${encodeURIComponent(activeTab)}`;

    if (modalMode === 'add') {
      router.post(endpoint, payload, {
        preserveScroll: true,
        onSuccess: () => setShowModal(false),
      });
      return;
    }

    router.put(`${endpoint}/${selectedRowId}`, payload, {
      preserveScroll: true,
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      router.delete(`/manager/sheet/${encodeURIComponent(activeTab)}/${id}`, {
        preserveScroll: true,
      });
    }
  };

  return (
    <div className="view-stack">
      {/* DATA SHEET */}
      <section
        className="table-card"
        style={{
          marginTop: '1.5rem',
          background: '#fff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e9e5d9',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1c2826',
            }}
          >
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
                padding: '7px 12px',
                borderRadius: '7px',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <Plus size={14} /> Tambah Data
            </button>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '1rem',
            scrollbarWidth: 'thin',
          }}
        >
          {sheetKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid #e9e5d9',
                backgroundColor: activeTab === key ? '#1b4332' : '#f7f5ed',
                color: activeTab === key ? '#ffffff' : '#1c2826',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div
          style={{
            overflowX: 'auto',
            borderRadius: '8px',
            border: '1px solid #e9e5d9',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: currentConfig.length > 8 ? '1180px' : '860px',
              borderCollapse: 'collapse',
              fontSize: '0.75rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f7f5ed',
                  borderBottom: '1px solid #e9e5d9',
                  color: '#8c9087',
                  textTransform: 'uppercase',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {currentConfig.map((field) => (
                  <th
                    key={field.key}
                    style={{
                      padding: '10px 12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.label}
                  </th>
                ))}
                <th
                  style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    width: '80px',
                    position: 'sticky',
                    right: 0,
                    backgroundColor: '#f7f5ed',
                  }}
                >
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentConfig.length + 1}
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#8c9087',
                    }}
                  >
                    Belum ada data masuk pada tabel <strong>{activeTab}</strong>.
                  </td>
                </tr>
              ) : (
                currentData.map((row, index) => (
                  <tr
                    key={row.id || index}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    {currentConfig.map((field) => (
                      <td
                        key={field.key}
                        style={{
                          padding: '10px 12px',
                          whiteSpace: 'nowrap',
                          color: '#1c2826',
                          maxWidth: field.type === 'text' ? '360px' : undefined,
                          overflow: field.type === 'text' ? 'hidden' : undefined,
                          textOverflow: field.type === 'text' ? 'ellipsis' : undefined,
                        }}
                        title={field.type === 'text' ? String(row[field.key] ?? '') : undefined}
                      >
                        {displayValue(row[field.key], field, activeTab)}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(row)}
                          title="Edit"
                          style={{
                            background: '#f7f5ed',
                            border: '1px solid #e9e5d9',
                            borderRadius: '5px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#1b4332',
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
                            borderRadius: '5px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#e03131',
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
        <div
          style={{
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
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #e9e5d9',
              maxHeight: '90vh',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                gap: '12px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#1c2826',
                }}
              >
                {modalMode === 'add' ? `Tambah Data (${activeTab})` : `Edit Data (${activeTab})`}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8c9087',
                  flexShrink: 0,
                }}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '62vh',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {editableFields.map((field) => {
                  const isCurrency = field.type === 'currency-idr' || field.type === 'currency-usd';
                  const inputType = field.type === 'date'
                    ? 'date'
                    : field.type === 'datetime'
                      ? 'datetime-local'
                      : isCurrency
                        ? 'text'
                        : field.type === 'number'
                          ? 'number'
                          : field.type === 'boolean'
                            ? 'checkbox'
                            : 'text';

                  if (field.type === 'boolean') {
                    return (
                      <label
                        key={field.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#1c2826',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(formData[field.key])}
                          onChange={(e) => handleFormChange(field, e.target.checked)}
                        />
                        {field.label}
                      </label>
                    );
                  }

                  return (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#1c2826',
                        }}
                      >
                        {field.label}
                      </label>
                      {activeTab === 'Orderan Terkirim' && field.key === 'status' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={(e) => handleFormChange(field, e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '7px',
                            border: '1px solid #e9e5d9',
                            fontSize: '0.8rem',
                            outline: 'none',
                            backgroundColor: '#fbfaf8',
                          }}
                        >
                          <option value="">Pilih Status Paket</option>
                          <option value="selamat">selamat</option>
                          <option value="tidak selamat">tidak selamat</option>
                        </select>
                      ) : (
                        <input
                          type={inputType}
                          inputMode={isCurrency ? 'decimal' : undefined}
                          step={inputType === 'number' ? 'any' : undefined}
                          value={formData[field.key] ?? ''}
                          onChange={(e) => handleFormChange(field, e.target.value)}
                          placeholder={isCurrency ? (field.type === 'currency-usd' ? '0.00' : '0') : `Masukkan ${field.label}`}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '7px',
                            border: '1px solid #e9e5d9',
                            fontSize: '0.8rem',
                            outline: 'none',
                            backgroundColor: '#fbfaf8',
                          }}
                        />
                      )}
                      {isCurrency && (
                        <span style={{ fontSize: '0.68rem', color: '#8c9087' }}>
                          {field.type === 'currency-usd'
                            ? ((activeTab === 'Uang $ Aroid Market' || activeTab === 'Orderan Terkirim')
                              ? 'Masukkan nominal dollar secara manual'
                              : 'Format otomatis, contoh: 1,250.00')
                            : 'Format otomatis, contoh: 250.000.000'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
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
                    cursor: 'pointer',
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
                    cursor: 'pointer',
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