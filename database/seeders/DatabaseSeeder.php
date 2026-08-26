<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Urutan seeding penting karena banyak tabel modul
     * memiliki foreign key ke tabel users (recorded_by, author_id, dst).
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,             // 1. Akun 4 role dasar
            CsReportSeeder::class,         // 2. Modul Customer Service
            GreenhouseSeeder::class,       // 3. Modul PJ Greenhouse
            FinanceMarketingSeeder::class, // 4. Modul Akuntansi & Marketing
        ]);
    }
}
