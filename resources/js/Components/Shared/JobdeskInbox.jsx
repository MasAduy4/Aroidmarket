import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Check, ClipboardCheck, Clock3, RefreshCw } from 'lucide-react'

const roleLabel = {
  customer_service: 'Customer Service',
  pj_greenhouse: 'PJ Greenhouse',
  akuntansi_marketing: 'Akuntansi & Marketing',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export default function JobdeskInbox({ className = '', title = 'Checklist Jobdesk' }) {
  const [jobdesks, setJobdesks] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get('/jobdesks/mine')
      setJobdesks(response.data?.data ?? [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Jobdesk belum dapat dimuat.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const completed = useMemo(
    () => jobdesks.filter((job) => ['completed', 'validated'].includes(job.status)).length,
    [jobdesks]
  )

  const total = jobdesks.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const toggleComplete = async (job) => {
    if (updatingId || ['completed', 'validated'].includes(job.status)) {
      return
    }

    setUpdatingId(job.id)
    setError('')

    try {
      await axios.patch(`/jobdesks/${job.id}/complete`)
      await load()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Jobdesk gagal ditandai selesai.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section
      className={`bg-white rounded-[16px] border border-[#e9e5d9] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8c9087] mb-1">
            TUGAS DARI MANAGER PMS
          </p>

          <h2 className="text-[18px] font-bold text-[#1c2826] m-0 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#2f6850]" />
            {title}
          </h2>

          <p className="text-xs text-[#8c9087] m-0 mt-1">
            {completed}/{total} tugas selesai
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold text-[#2f6850] bg-[#e8f5e9]">
            {percentage}%
          </span>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh jobdesk"
            className="w-8 h-8 rounded-[8px] border border-[#e9e5d9] bg-white text-[#2f6850] flex items-center justify-center hover:bg-[#f7f5ed] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 w-full bg-[#f7f5ed] h-2 rounded-full overflow-hidden border border-[#e9e5d9]">
        <div
          className="bg-[#2f6850] h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#8c9087]">
            Memuat jobdesk...
          </div>
        ) : jobdesks.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#e9e5d9] bg-[#fdfcf7] p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-[#c8c9c1] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1c2826] m-0">
              Belum ada jobdesk
            </p>
            <p className="text-[11px] text-[#8c9087] m-0 mt-1">
              Jobdesk dari Manager PMS akan muncul di sini.
            </p>
          </div>
        ) : (
          jobdesks.map((job) => {
            const done = ['completed', 'validated'].includes(job.status)
            const updating = updatingId === job.id

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => toggleComplete(job)}
                disabled={done || updating}
                className={`w-full text-left p-4 rounded-[12px] border transition-colors ${
                  done
                    ? 'border-[#cfe7d6] bg-[#f4faf5]'
                    : 'border-[#e9e5d9] bg-[#fdfcf7] hover:border-[#2f6850] hover:bg-white'
                } disabled:cursor-default`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      done
                        ? 'bg-[#2f6850] border-[#2f6850] text-white'
                        : 'bg-white border-[#cfd3cb] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        done
                          ? 'line-through text-[#8c9087]'
                          : 'text-[#1c2826]'
                      }`}
                    >
                      {job.title}
                    </span>

                    <span className="block text-xs text-[#8c9087] mt-1 whitespace-pre-wrap">
                      {job.description || 'Tidak ada catatan tambahan.'}
                    </span>

                    <span className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#e9e5d9] text-[#8c9087]">
                        <Clock3 className="w-3 h-3" />
                        Target {formatDate(job.target_date)}
                      </span>

                      {job.assigned_by?.name && (
                        <span className="px-2 py-1 rounded-full bg-white border border-[#e9e5d9] text-[#8c9087]">
                          Dari {job.assigned_by.name}
                        </span>
                      )}

                      {job.assigned_by?.role && (
                        <span className="px-2 py-1 rounded-full bg-[#f7f5ed] text-[#2f6850]">
                          {roleLabel[job.assigned_by.role] || job.assigned_by.role}
                        </span>
                      )}
                    </span>
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      done
                        ? 'bg-[#e8f5e9] text-[#2f6850]'
                        : 'bg-[#fff3e0] text-[#d96b27]'
                    }`}
                  >
                    {updating ? 'Menyimpan...' : done ? 'Selesai' : 'Belum selesai'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      <p className="text-[10px] text-[#8c9087] mt-4">
        Klik tugas untuk menandainya selesai. Tugas yang sudah selesai tidak dapat dicentang ulang.
      </p>
    </section>
  )
}
