<?php

namespace Database\Seeders;

use App\Models\Plant;
use App\Models\PlantCategory;
use App\Models\PlantStockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class GreenhouseSeeder extends Seeder
{
    public function run(): void
    {
        $pj = User::where('role', User::ROLE_PJ_GREENHOUSE)->first();

        if (! $pj) {
            $this->command->warn('User PJ Greenhouse tidak ditemukan. Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        // ==== 1. Kategori tanaman ====
        $categoriesData = [
            ['name' => 'Aroid', 'slug' => 'aroid', 'description' => 'Keluarga tanaman Araceae seperti Philodendron, Anthurium, Monstera.'],
            ['name' => 'Variegata', 'slug' => 'variegata', 'description' => 'Tanaman dengan corak daun variegasi (putih/kuning pada daun).'],
            ['name' => 'Alocasia', 'slug' => 'alocasia', 'description' => 'Tanaman hias dari genus Alocasia dengan bentuk daun khas menyerupai panah.'],
            ['name' => 'Anthurium', 'slug' => 'anthurium', 'description' => 'Tanaman hias dengan daun tebal dan bentuk unik, banyak diburu kolektor.'],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = PlantCategory::updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }

        // ==== 2. Data tanaman ====
        $plantsData = [
            [
                'barcode' => 'AM-AROID-0001',
                'category' => 'aroid',
                'name' => 'Philodendron Florida Ghost',
                'variegation' => null,
                'status' => Plant::STATUS_AVAILABLE,
                'health_condition' => 'sehat',
                'stock_qty' => 12,
                'unit_price' => 450000,
                'greenhouse_location' => 'Blok A - Rak 1',
                'description' => 'Tanaman remaja, akar kuat, daun mulai membuka sempurna.',
            ],
            [
                'barcode' => 'AM-VARI-0002',
                'category' => 'variegata',
                'name' => 'Monstera Albo Variegata',
                'variegation' => 'White Variegata',
                'status' => Plant::STATUS_AVAILABLE,
                'health_condition' => 'sehat',
                'stock_qty' => 5,
                'unit_price' => 2500000,
                'greenhouse_location' => 'Blok B - Rak 3',
                'description' => 'Variegasi tinggi 40-60%, daun terbuka sempurna.',
            ],
            [
                'barcode' => 'AM-ALOC-0003',
                'category' => 'alocasia',
                'name' => 'Alocasia Frydek',
                'variegation' => null,
                'status' => Plant::STATUS_SOLD,
                'health_condition' => 'sehat',
                'stock_qty' => 0,
                'unit_price' => 275000,
                'greenhouse_location' => 'Blok C - Rak 2',
                'description' => 'Sudah terjual habis pada batch terakhir.',
            ],
            [
                'barcode' => 'AM-ANTH-0004',
                'category' => 'anthurium',
                'name' => 'Anthurium Papillilaminum',
                'variegation' => null,
                'status' => Plant::STATUS_INDUKAN,
                'health_condition' => 'sehat',
                'stock_qty' => 2,
                'unit_price' => null,
                'greenhouse_location' => 'Blok Indukan - Rak 1',
                'description' => 'Dipelihara sebagai indukan untuk pembibitan, tidak dijual.',
            ],
            [
                'barcode' => 'AM-AROID-0005',
                'category' => 'aroid',
                'name' => 'Philodendron Pink Princess',
                'variegation' => 'Pink Variegata',
                'status' => Plant::STATUS_AVAILABLE,
                'health_condition' => 'tidak_sehat',
                'health_note' => 'Beberapa daun menunjukkan gejala bercak coklat, sedang dalam observasi & karantina.',
                'stock_qty' => 8,
                'unit_price' => 650000,
                'greenhouse_location' => 'Blok Karantina',
                'description' => 'Tidak direkomendasikan untuk dijual sampai kondisi membaik.',
            ],
            [
                'barcode' => 'AM-VARI-0006',
                'category' => 'variegata',
                'name' => 'Syngonium Albo Variegata',
                'variegation' => 'White Variegata',
                'status' => Plant::STATUS_AVAILABLE,
                'health_condition' => 'sehat',
                'stock_qty' => 20,
                'unit_price' => 180000,
                'greenhouse_location' => 'Blok A - Rak 4',
                'description' => 'Batch baru hasil stek, pertumbuhan bagus.',
            ],
        ];

        $plants = [];
        foreach ($plantsData as $data) {
            $categorySlug = $data['category'];
            unset($data['category']);

            $plants[$data['barcode']] = Plant::updateOrCreate(
                ['barcode' => $data['barcode']],
                array_merge($data, [
                    'plant_category_id' => $categories[$categorySlug]->id,
                    'pj_greenhouse_id' => $pj->id,
                ])
            );
        }

        // ==== 3. Stock movements (histori masuk/keluar pcs) ====
        $movements = [
            ['barcode' => 'AM-AROID-0001', 'type' => 'in', 'quantity' => 15, 'reason' => 'Panen baru dari batch stek Januari', 'movement_date' => Carbon::now()->subDays(20)],
            ['barcode' => 'AM-AROID-0001', 'type' => 'out', 'quantity' => 3, 'reason' => 'Terjual via Shopify', 'movement_date' => Carbon::now()->subDays(5)],

            ['barcode' => 'AM-VARI-0002', 'type' => 'in', 'quantity' => 6, 'reason' => 'Panen indukan variegata', 'movement_date' => Carbon::now()->subDays(30)],
            ['barcode' => 'AM-VARI-0002', 'type' => 'out', 'quantity' => 1, 'reason' => 'Terjual ke kolektor lokal', 'movement_date' => Carbon::now()->subDays(10)],

            ['barcode' => 'AM-ALOC-0003', 'type' => 'in', 'quantity' => 10, 'reason' => 'Panen batch Alocasia', 'movement_date' => Carbon::now()->subDays(40)],
            ['barcode' => 'AM-ALOC-0003', 'type' => 'out', 'quantity' => 10, 'reason' => 'Habis terjual melalui Palmstreet Purge', 'movement_date' => Carbon::now()->subDays(15)],

            ['barcode' => 'AM-AROID-0005', 'type' => 'in', 'quantity' => 10, 'reason' => 'Panen batch Pink Princess', 'movement_date' => Carbon::now()->subDays(12)],
            ['barcode' => 'AM-AROID-0005', 'type' => 'out', 'quantity' => 2, 'reason' => 'Tanaman dipisahkan ke karantina karena sakit', 'movement_date' => Carbon::now()->subDays(3), 'note' => 'Ditemukan bercak daun saat pengecekan rutin.'],

            ['barcode' => 'AM-VARI-0006', 'type' => 'in', 'quantity' => 20, 'reason' => 'Panen batch stek terbaru', 'movement_date' => Carbon::now()->subDays(2)],
        ];

        foreach ($movements as $m) {
            $barcode = $m['barcode'];
            unset($m['barcode']);

            PlantStockMovement::updateOrCreate(
                [
                    'plant_id' => $plants[$barcode]->id,
                    'type' => $m['type'],
                    'movement_date' => $m['movement_date'],
                    'quantity' => $m['quantity'],
                ],
                array_merge($m, ['recorded_by' => $pj->id])
            );
        }

        $this->command->info('Data dummy kategori, tanaman, dan stock movement berhasil dibuat.');
    }
}
