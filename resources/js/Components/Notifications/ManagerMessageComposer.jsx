import { useState } from 'react';
import { Send, UserRound } from 'lucide-react';
import { router } from '@inertiajs/react';

const ROLE_LABELS = {
  customer_service: 'Customer Service',
  pj_greenhouse: 'PJ Greenhouse',
  akuntansi_marketing: 'Akuntansi & Marketing',
};

export default function ManagerMessageComposer({ users = [] }) {
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const operationalUsers = Array.isArray(users)
    ? users.filter((user) =>
        [
          'customer_service',
          'pj_greenhouse',
          'akuntansi_marketing',
        ].includes(user?.role)
      )
    : [];

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!recipientId || !message.trim() || processing) {
      return;
    }

    setProcessing(true);

    router.post(
      '/manager-messages/send',
      {
        recipient_id: Number(recipientId),
        message: message.trim(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setMessage('');
          setRecipientId('');
        },
        onError: (errors) => {
          console.error('Gagal mengirim pesan ke user:', errors);
        },
        onFinish: () => {
          setProcessing(false);
        },
      }
    );
  };

  return (
    <section className="bg-white rounded-[16px] border border-[#e9e5d9] p-4 sm:p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#d96b27] m-0 mb-1">
          KOMUNIKASI INTERNAL
        </p>
        <h2 className="text-[16px] font-bold text-[#1c2826] m-0">
          Kirim Pesan ke Tim
        </h2>
        <p className="text-[11px] text-[#8c9087] m-0 mt-1">
          Pesan akan masuk ke notifikasi user yang dipilih.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8c9087] mb-1.5">
            Penerima
          </label>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c9087]" />
            <select
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              className="w-full h-[40px] appearance-none rounded-[9px] border border-[#e9e5d9] bg-[#fdfcf7] pl-9 pr-3 text-xs text-[#1c2826] outline-none focus:border-[#2f6850]"
              required
            >
              <option value="">Pilih user tujuan...</option>
              {operationalUsers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {ROLE_LABELS[item.role] ?? item.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8c9087] mb-1.5">
            Pesan
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Tulis pesan untuk user..."
            className="w-full resize-y rounded-[9px] border border-[#e9e5d9] bg-[#fdfcf7] px-3 py-2.5 text-xs text-[#1c2826] outline-none placeholder:text-[#aaa59a] focus:border-[#2f6850]"
            required
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-[#aaa59a]">
            {message.length}/2000
          </span>

          <button
            type="submit"
            disabled={
              processing ||
              !recipientId ||
              !message.trim() ||
              operationalUsers.length === 0
            }
            className="h-[38px] px-4 rounded-[9px] border-none bg-[#2f6850] text-white text-xs font-semibold cursor-pointer hover:bg-[#255340] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {processing ? 'Mengirim...' : 'Kirim Pesan'}
          </button>
        </div>
      </form>
    </section>
  );
}
