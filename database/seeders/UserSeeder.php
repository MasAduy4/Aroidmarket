<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'manager@aroidmarket.test'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER_PMS,
                'phone' => '081234567801',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'cs@aroidmarket.test'],
            [
                'name' => 'Siti Rahmawati',
                'password' => Hash::make('password'),
                'role' => User::ROLE_CUSTOMER_SERVICE,
                'phone' => '081234567802',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'greenhouse@aroidmarket.test'],
            [
                'name' => 'Agus Wijaya',
                'password' => Hash::make('password'),
                'role' => User::ROLE_PJ_GREENHOUSE,
                'phone' => '081234567803',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'akuntansi@aroidmarket.test'],
            [
                'name' => 'Dewi Lestari',
                'password' => Hash::make('password'),
                'role' => User::ROLE_AKUNTANSI_MARKETING,
                'phone' => '081234567804',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('4 akun role berhasil dibuat. Password default untuk semua akun: "password"');
    }
}
