<?php

namespace Database\Seeders;

use App\Models\AroidMarketUsdBalance;
use App\Models\BlogPost;
use App\Models\CashBook;
use App\Models\EndorseCandidate;
use App\Models\LocalSale;
use App\Models\OperationalCost;
use App\Models\PalmstreetPurgeRecap;
use App\Models\Plant;
use App\Models\PlantOrderPurchase;
use App\Models\ProductDescriptionUpdate;
use App\Models\ShopifyOrder;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class FinanceMarketingSeeder extends Seeder
{
    public function run(): void
    {
        $akuntansi = User::where('role', User::ROLE_AKUNTANSI_MARKETING)->first();

        if (! $akuntansi) {
            $this->command->warn('User Akuntansi & Marketing tidak ditemukan. Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        // ==== 1. Buku Kas ====
        $cashBooks = [
            ['transaction_date' => Carbon::now()->subDays(10), 'type' => 'in', 'category' => 'Penjualan Lokal', 'amount' => 1250000, 'description' => 'Penjualan tanaman batch minggu ke-1'],
            ['transaction_date' => Carbon::now()->subDays(9), 'type' => 'out', 'category' => 'Operasional', 'amount' => 350000, 'description' => 'Pembelian pupuk & media tanam'],
            ['transaction_date' => Carbon::now()->subDays(6), 'type' => 'in', 'category' => 'Order Shopify', 'amount' => 4800000, 'description' => 'Pencairan dana Shopify minggu berjalan'],
            ['transaction_date' => Carbon::now()->subDays(3), 'type' => 'out', 'category' => 'Gaji Karyawan', 'amount' => 3500000, 'description' => 'Gaji staf greenhouse periode berjalan'],
            ['transaction_date' => Carbon::now()->subDay(), 'type' => 'in', 'category' => 'Palmstreet Purge', 'amount' => 2100000, 'description' => 'Hasil penjualan live purge akhir pekan'],
        ];
        foreach ($cashBooks as $data) {
            CashBook::updateOrCreate(
                ['transaction_date' => $data['transaction_date'], 'description' => $data['description']],
                array_merge($data, ['recorded_by' => $akuntansi->id])
            );
        }

        // ==== 2. Biaya Operasional ====
        $operationalCosts = [
            ['cost_date' => Carbon::now()->subDays(15), 'cost_name' => 'Listrik Greenhouse', 'category' => 'Utilitas', 'amount' => 750000, 'description' => 'Tagihan listrik bulanan greenhouse.'],
            ['cost_date' => Carbon::now()->subDays(12), 'cost_name' => 'Packaging & Box Kirim', 'category' => 'Logistik', 'amount' => 620000, 'description' => 'Pembelian box dan bubble wrap untuk pengiriman.'],
            ['cost_date' => Carbon::now()->subDays(7), 'cost_name' => 'Pupuk & Nutrisi Tanaman', 'category' => 'Perawatan Tanaman', 'amount' => 480000, 'description' => 'Stok pupuk bulanan.'],
            ['cost_date' => Carbon::now()->subDays(2), 'cost_name' => 'Iklan Media Sosial', 'category' => 'Marketing', 'amount' => 900000, 'description' => 'Boosting iklan Instagram & TikTok Ads.'],
        ];
        foreach ($operationalCosts as $data) {
            OperationalCost::updateOrCreate(
                ['cost_date' => $data['cost_date'], 'cost_name' => $data['cost_name']],
                array_merge($data, ['recorded_by' => $akuntansi->id])
            );
        }

        // ==== 3. Penjualan Lokal ====
        $plantForSale = Plant::where('barcode', 'AM-VARI-0006')->first();
        if ($plantForSale) {
            LocalSale::updateOrCreate(
                ['sale_date' => Carbon::now()->subDays(4), 'customer_name' => 'Toko Tanaman Hijau Asri'],
                [
                    'plant_id' => $plantForSale->id,
                    'quantity' => 3,
                    'price_per_unit' => 180000,
                    'total_price' => 540000,
                    'payment_method' => 'Transfer Bank',
                    'note' => 'Pembelian grosir untuk dijual kembali.',
                    'recorded_by' => $akuntansi->id,
                ]
            );
        }

        // ==== 4. Pembelian Tanaman Order ====
        PlantOrderPurchase::updateOrCreate(
            ['purchase_date' => Carbon::now()->subDays(8), 'plant_name' => 'Philodendron Spiritus Sancti'],
            [
                'supplier_name' => 'Kebun Mitra Bandung',
                'quantity' => 2,
                'price_per_unit' => 3500000,
                'total_price' => 7000000,
                'purpose_order_reference' => 'ORD-10310',
                'status' => 'received',
                'note' => 'Dibeli khusus untuk memenuhi permintaan customer VIP.',
                'recorded_by' => $akuntansi->id,
            ]
        );

        // ==== 5. Data Order Shopify ====
        $shopifyOrders = [
            [
                'shopify_order_id' => 'SHOP-90001',
                'order_date' => Carbon::now()->subDays(6),
                'customer_name' => 'Emily Carter',
                'total_amount' => 89.90,
                'currency' => 'USD',
                'status' => 'fulfilled',
            ],
            [
                'shopify_order_id' => 'SHOP-90002',
                'order_date' => Carbon::now()->subDays(4),
                'customer_name' => 'James Anderson',
                'total_amount' => 145.50,
                'currency' => 'USD',
                'status' => 'paid',
            ],
            [
                'shopify_order_id' => 'SHOP-90003',
                'order_date' => Carbon::now()->subDays(1),
                'customer_name' => 'Sophia Lee',
                'total_amount' => 62.00,
                'currency' => 'USD',
                'status' => 'pending',
            ],
        ];
        foreach ($shopifyOrders as $data) {
            ShopifyOrder::updateOrCreate(
                ['shopify_order_id' => $data['shopify_order_id']],
                array_merge($data, ['recorded_by' => $akuntansi->id])
            );
        }

        // ==== 6. Uang $ Aroid Market ====
        AroidMarketUsdBalance::updateOrCreate(
            ['transaction_date' => Carbon::now()->subDays(5), 'source' => 'Shopify Payout'],
            [
                'type' => 'in',
                'amount_usd' => 297.40,
                'exchange_rate' => 16200,
                'amount_idr' => 297.40 * 16200,
                'note' => 'Pencairan payout Shopify minggu berjalan.',
                'recorded_by' => $akuntansi->id,
            ]
        );

        // ==== 7. Rekap Penjualan Palmstreet Purge ====
        PalmstreetPurgeRecap::updateOrCreate(
            ['event_name' => 'Weekend Purge - Aroid Special', 'period_start' => Carbon::now()->subDays(3), 'period_end' => Carbon::now()->subDay()],
            [
                'total_items_sold' => 27,
                'total_sales' => 5400000,
                'total_fee' => 270000,
                'notes' => 'Penjualan meningkat pada sesi malam, banyak permintaan Philodendron variegata.',
                'recorded_by' => $akuntansi->id,
            ]
        );

        // ==== 8. Update Deskripsi/Nama Produk ====
        if ($plantForSale) {
            ProductDescriptionUpdate::updateOrCreate(
                ['plant_id' => $plantForSale->id, 'platform' => 'shopify'],
                [
                    'old_name' => 'Syngonium Albo',
                    'new_name' => 'Syngonium Albo Variegata Premium',
                    'old_description' => 'Tanaman syngonium dengan variegasi putih.',
                    'new_description' => 'Syngonium Albo Variegata kualitas premium, variegasi tinggi 30-50%, cocok untuk kolektor.',
                    'updated_by' => $akuntansi->id,
                ]
            );
        }

        // ==== 9. Blog Posts ====
        $blogPosts = [
            [
                'title' => 'Tips Merawat Philodendron Variegata untuk Pemula',
                'slug' => 'tips-merawat-philodendron-variegata-untuk-pemula',
                'content' => 'Artikel ini membahas panduan dasar merawat Philodendron variegata, mulai dari kebutuhan cahaya, media tanam, hingga kelembapan ideal.',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(7),
            ],
            [
                'title' => '5 Jenis Aroid Terpopuler di Kalangan Kolektor 2026',
                'slug' => '5-jenis-aroid-terpopuler-di-kalangan-kolektor-2026',
                'content' => 'Rangkuman jenis-jenis Aroid yang paling banyak diburu kolektor tanaman hias tahun ini beserta kisaran harganya.',
                'status' => 'draft',
                'published_at' => null,
            ],
        ];
        foreach ($blogPosts as $data) {
            BlogPost::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['author_id' => $akuntansi->id])
            );
        }

        // ==== 10. Endorse Candidates ====
        $endorseCandidates = [
            [
                'name' => 'Plantlover.id',
                'platform' => 'Instagram',
                'social_media_handle' => '@plantlover.id',
                'followers_count' => 85000,
                'status' => 'contacted',
                'contact_info' => 'plantlover.id@gmail.com',
                'notes' => 'Sudah dikirim DM penawaran kerja sama endorse, menunggu balasan.',
            ],
            [
                'name' => 'Kebun Hijau TV',
                'platform' => 'YouTube',
                'social_media_handle' => '@kebunhijautv',
                'followers_count' => 42000,
                'status' => 'negotiating',
                'contact_info' => 'kebunhijautv@gmail.com',
                'notes' => 'Sedang negosiasi rate untuk video review unboxing tanaman.',
            ],
            [
                'name' => 'Aroid Hunter',
                'platform' => 'TikTok',
                'social_media_handle' => '@aroidhunter',
                'followers_count' => 130000,
                'status' => 'prospecting',
                'contact_info' => null,
                'notes' => 'Kandidat potensial, belum dihubungi.',
            ],
        ];
        foreach ($endorseCandidates as $data) {
            EndorseCandidate::updateOrCreate(
                ['social_media_handle' => $data['social_media_handle']],
                array_merge($data, ['assigned_to' => $akuntansi->id])
            );
        }

        $this->command->info('Data dummy Akuntansi & Marketing berhasil dibuat.');
    }
}
