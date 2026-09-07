import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Send, MessageSquare } from 'lucide-react';

export default function ManagerMessageBox() {
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || processing) return;

    setProcessing(true);

    router.post(
      '/manager-messages',
      { message: trimmed },
      {
        preserveScroll: true,
        onSuccess: () => {
          setMessage('');
        },
        onFinish: () => {
          setProcessing(false);
        },
      }
    );
  };

  return (
    <section className="bg-white border border-[#e9e5d9] rounded-[16px] p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-[10px] bg-[#e8f5e9] text-[#2f6850] flex items-center justify-center shrink-0">
          <MessageSquare size={17} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#1c2826] m-0">
            Laporan ke Manager PMS
          </h3>
          <p className="text-xs text-[#8c9087] m-0 mt-1">
            Sampaikan pesan atau informasi singkat ke Manager.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          maxLength={2000}
          rows={4}
          placeholder="Tulis pesan/laporan di sini..."
          className="w-full bg-[#fdfcf7] rounded-[10px] border border-[#e9e5d9] p-3 text-xs font-medium text-[#1c2826] outline-none focus:bg-white focus:border-[#2f6850] transition-colors placeholder:text-[#8c9087] resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-[#8c9087]">
            {message.length}/2000
          </span>

          <button
            type="submit"
            disabled={!message.trim() || processing}
            className="h-[38px] px-4 bg-[#2f6850] text-white font-semibold rounded-[10px] text-xs flex items-center gap-2 border-none cursor-pointer hover:bg-[#255340] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {processing ? 'Mengirim...' : 'Kirim ke Manager PMS'}
          </button>
        </div>
      </form>
    </section>
  );
}
