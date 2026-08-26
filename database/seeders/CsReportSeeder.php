<?php

namespace Database\Seeders;

use App\Models\CsReport;
use App\Models\CsReportTimeline;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CsReportSeeder extends Seeder
{
    public function run(): void
    {
        $cs = User::where('role', User::ROLE_CUSTOMER_SERVICE)->first();

        if (! $cs) {
            $this->command->warn('User Customer Service tidak ditemukan. Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $reports = [
            [
                'id' => 'report-1723300001',
                'order_id' => 'ORD-10231',
                'customer' => 'Rina Kusuma',
                'category' => 'cancel',
                'description' => 'Customer meminta pembatalan order karena salah pilih varian tanaman.',
                'status' => CsReport::STATUS_RESOLVED,
                'is_escalation' => false,
                'timelines' => [
                    ['status_snapshot' => 'open', 'note' => 'Report dibuat, menunggu konfirmasi pembatalan ke tim gudang.'],
                    ['status_snapshot' => 'resolved', 'note' => 'Order berhasil dibatalkan, dana dikembalikan ke saldo customer.'],
                ],
            ],
            [
                'id' => 'ESC-20260810-1024',
                'order_id' => 'ORD-10245',
                'customer' => 'Andi Prasetyo',
                'category' => 'refund',
                'description' => 'Tanaman diterima dalam kondisi busuk akar, customer meminta refund penuh. Sudah 2x follow up tanpa respon gudang, dieskalasi ke Manager PMS.',
                'status' => CsReport::STATUS_IN_PROGRESS,
                'is_escalation' => true,
                'created_at' => Carbon::now()->subDays(6),
                'timelines' => [
                    ['status_snapshot' => 'open', 'note' => 'Customer mengirim foto bukti kerusakan.'],
                    ['status_snapshot' => 'in-progress', 'note' => 'Dieskalasi karena tidak ada respon dari tim gudang dalam 2 hari.'],
                ],
            ],
            [
                'id' => 'report-1723300050',
                'order_id' => 'ORD-10250',
                'customer' => 'Maya Anggraini',
                'category' => 'laporan-pengiriman-sukses',
                'description' => 'Paket diterima customer dalam kondisi baik, tanpa kendala.',
                'status' => CsReport::STATUS_RESOLVED,
                'is_escalation' => false,
                'timelines' => [
                    ['status_snapshot' => 'resolved', 'note' => 'Customer konfirmasi paket sudah diterima dengan baik.'],
                ],
            ],
            [
                'id' => 'ESC-20260806-3311',
                'order_id' => 'ORD-10262',
                'customer' => 'Fajar Nugraha',
                'category' => 'rto',
                'description' => 'Paket tertahan di gudang ekspedisi lebih dari 5 hari, berpotensi RTO. SLA penyelesaian sudah lewat.',
                'status' => CsReport::STATUS_OPEN,
                'is_escalation' => true,
                'created_at' => Carbon::now()->subDays(10),
                'timelines' => [
                    ['status_snapshot' => 'open', 'note' => 'Customer komplain paket belum sampai, dieskalasi ke Manager PMS.'],
                ],
            ],
            [
                'id' => 'report-1723300090',
                'order_id' => 'ORD-10270',
                'customer' => 'Lestari Wulandari',
                'category' => 'pencatatan-pesanan',
                'description' => 'Customer meminta packing kayu khusus karena akan dikirim ke luar pulau.',
                'status' => CsReport::STATUS_RESOLVED,
                'is_escalation' => false,
                'timelines' => [
                    ['status_snapshot' => 'resolved', 'note' => 'Packing kayu sudah disiapkan sebelum pengiriman.'],
                ],
            ],
            [
                'id' => 'report-1723300120',
                'order_id' => 'ORD-10281',
                'customer' => 'Yoga Permana',
                'category' => 'resend',
                'description' => 'Tanaman rusak saat pengiriman, customer meminta pengiriman ulang.',
                'status' => CsReport::STATUS_OPEN,
                'is_escalation' => false,
                'timelines' => [
                    ['status_snapshot' => 'open', 'note' => 'Bukti kerusakan diterima, menunggu persetujuan resend dari gudang.'],
                ],
            ],
        ];

        foreach ($reports as $data) {
            $timelines = $data['timelines'];
            unset($data['timelines']);

            $createdAt = $data['created_at'] ?? Carbon::now();
            unset($data['created_at']);

            $slaDeadline = $data['is_escalation'] ? (clone $createdAt)->addDays(3) : null;

            $report = CsReport::updateOrCreate(
                ['id' => $data['id']],
                array_merge($data, [
                    'sla_deadline' => $slaDeadline,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])
            );

            foreach ($timelines as $timeline) {
                CsReportTimeline::updateOrCreate(
                    [
                        'cs_report_id' => $report->id,
                        'status_snapshot' => $timeline['status_snapshot'],
                        'note' => $timeline['note'],
                    ],
                    ['created_by' => $cs->id]
                );
            }
        }

        $this->command->info('Data dummy CS Reports (skema baru) & timeline berhasil dibuat.');
    }
}