<?php

use App\Http\Controllers\Admin\LahanController;
use App\Http\Controllers\AkuntansiMarketingController;
use App\Http\Controllers\CustomerServiceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GreenhouseController;
use App\Http\Controllers\JobDeskController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ManagerPmsController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ManagerMessageController;

/*
|--------------------------------------------------------------------------
| Web Routes — AroidMarket
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Public / Landing
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }

    return match (auth()->user()->role) {
        'manager_pms' => redirect()->route('manager.dashboard'),
        'customer_service' => redirect()->route('customer-service.index'),
        'pj_greenhouse' => redirect()->route('greenhouse.plants.index'),
        'akuntansi_marketing' => redirect()->route('akuntansi.index'),

        default => redirect()->route('login'),
    };
})->name('home');

/*
|--------------------------------------------------------------------------
| Shared Profile
|--------------------------------------------------------------------------
|
| Semua role:
| - melihat user sendiri
| - mengganti nama sendiri
| - mengganti foto profil sendiri
|
| Hanya manager:
| - mengganti foto perusahaan
|
|--------------------------------------------------------------------------
*/
Route::get(
    '/company/logo',
    [ProfileController::class, 'companyLogo']
)->name('company.logo');

Route::middleware(['auth'])->group(function () {

    Route::post(
        '/profile/settings',
        [ProfileController::class, 'updateManagerSettings']
    )->name('profile.settings.update');

    Route::get(
        '/profile/current',
        [ProfileController::class, 'current']
    )->name('profile.current');

    Route::get(
        '/profile/avatar',
        [ProfileController::class, 'avatar']
    )->name('profile.avatar');
});


/*
|--------------------------------------------------------------------------
| MANAGER PMS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:manager_pms'])->group(function () {

    Route::prefix('manager')->name('manager.')->group(function () {

        Route::post(
            '/sheet/{sheetName}',
            [ManagerPmsController::class, 'storeSheetRow']
        )->name('sheet.store');
    
        Route::put(
            '/sheet/{sheetName}/{id}',
            [ManagerPmsController::class, 'updateSheetRow']
        )->name('sheet.update');
    
        Route::delete(
            '/sheet/{sheetName}/{id}',
            [ManagerPmsController::class, 'destroySheetRow']
        )->name('sheet.destroy');
    
        // route manager lainnya yang sudah ada...
    });

    Route::get(
        '/manager-dashboard',
        [ManagerPmsController::class, 'index']
    )->name('manager.dashboard');

    /*
    |--------------------------------------------------------------------------
    | Legacy Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get(
        '/dashboard',
        [DashboardController::class, 'index']
    )->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Manager
    |--------------------------------------------------------------------------
    */
    Route::prefix('manager')->name('manager.')->group(function () {

        Route::get(
            '/',
            [DashboardController::class, 'admin']
        )->name('index');

        Route::get(
            '/pms-dashboard',
            [ManagerPmsController::class, 'index']
        )->name('pms-dashboard');

        /*
        |--------------------------------------------------------------------------
        | Monthly Revenue
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/monthly-revenue',
            [ManagerPmsController::class, 'getMonthlyRevenue']
        )->name('monthly-revenue');

        Route::post(
            '/monthly-revenue',
            [ManagerPmsController::class, 'storeMonthlyRevenue']
        )->name('monthly-revenue.store');

        Route::get(
            '/chart-data',
            [ManagerPmsController::class, 'getChartData']
        )->name('chart-data');

        /*
        |--------------------------------------------------------------------------
        | Endorse Candidates
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/endorse-candidates',
            [ManagerPmsController::class, 'getEndorseCandidates']
        )->name('endorse.list');

        Route::post(
            '/endorse-candidates',
            [ManagerPmsController::class, 'storeEndorseCandidate']
        )->name('endorse.store');

        Route::put(
            '/endorse-candidates/{id}',
            [ManagerPmsController::class, 'updateEndorseCandidate']
        )->name('endorse.update');

        Route::delete(
            '/endorse-candidates/{id}',
            [ManagerPmsController::class, 'destroyEndorseCandidate']
        )->name('endorse.destroy');

        /*
        |--------------------------------------------------------------------------
        | Lahan
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/lahan',
            [LahanController::class, 'index']
        )->name('lahan.index');

        Route::post(
            '/lahan',
            [LahanController::class, 'store']
        )->name('lahan.store');

        Route::put(
            '/lahan/{id}',
            [LahanController::class, 'update']
        )->name('lahan.update');

        Route::delete(
            '/lahan/{id}',
            [LahanController::class, 'destroy']
        )->name('lahan.destroy');

        /*
        |--------------------------------------------------------------------------
        | Poktan
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/poktan',
            fn () => Inertia::render('Admin/Poktan')
        )->name('poktan.index');

        /*
        |--------------------------------------------------------------------------
        | Laporan
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/laporan',
            fn () => Inertia::render('Admin/Laporan')
        )->name('laporan.index');

        Route::post(
            '/monthly-revenue/update',
            [DashboardController::class, 'updateMonthlyRevenue']
        )->name('monthly-revenue.update');
    });
});


/*
|--------------------------------------------------------------------------
| CUSTOMER SERVICE
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:customer_service'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | CS Reports
    |--------------------------------------------------------------------------
    */
    Route::post(
        '/cs-reports',
        [CustomerServiceController::class, 'store']
    )->name('cs-reports.store');

    Route::put(
        '/cs-reports/{id}',
        [CustomerServiceController::class, 'update']
    )->name('cs-reports.update');

    Route::delete(
        '/cs-reports/{id}',
        [CustomerServiceController::class, 'destroy']
    )->name('cs-reports.destroy');

    /*
    |--------------------------------------------------------------------------
    | Customer Service Dashboard
    |--------------------------------------------------------------------------
    */
    Route::prefix('customer-service')
        ->name('customer-service.')
        ->group(function () {

            Route::get(
                '/',
                [CustomerServiceController::class, 'index']
            )->name('index');
        });
});


/*
|--------------------------------------------------------------------------
| PJ GREENHOUSE
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:pj_greenhouse'])->group(function () {

    Route::prefix('pj-greenhouse')
        ->name('greenhouse.')
        ->group(function () {

            Route::get(
                '/',
                [GreenhouseController::class, 'index']
            )->name('plants.index');

            Route::post(
                '/',
                [GreenhouseController::class, 'store']
            )->name('plants.store');

            Route::put(
                '/{plant}',
                [GreenhouseController::class, 'update']
            )->name('plants.update');

            Route::delete(
                '/{plant}',
                [GreenhouseController::class, 'destroy']
            )->name('plants.destroy');

            Route::post(
                '/validate-barcode',
                [GreenhouseController::class, 'validateBarcode']
            )->name('plants.validate-barcode');

            Route::post(
                '/{plant}/sold',
                [GreenhouseController::class, 'markAsSold']
            )->name('plants.sold');
        });
});


/*
|--------------------------------------------------------------------------
| AKUNTANSI & MARKETING
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:akuntansi_marketing'])->group(function () {

    Route::prefix('akuntansi-marketing')
        ->name('akuntansi-marketing.')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | Dashboard
            |--------------------------------------------------------------------------
            */
            Route::get(
                '/',
                [AkuntansiMarketingController::class, 'index']
            )->name('index');

            Route::get(
                '/view',
                [AkuntansiMarketingController::class, 'index']
            )->name('view');

            /*
            |--------------------------------------------------------------------------
            | Pendapatan
            |--------------------------------------------------------------------------
            */
            Route::put(
                '/weekly-income/{id}',
                [AkuntansiMarketingController::class, 'updateWeeklyIncome']
            )->name('weekly.update');

            Route::post(
                '/send-to-pms',
                [AkuntansiMarketingController::class, 'sendToPmsManager']
            )->name('send-to-pms');

            /*
            |--------------------------------------------------------------------------
            | Endorse
            |--------------------------------------------------------------------------
            */
            Route::post(
                '/endorse',
                [AkuntansiMarketingController::class, 'storeEndorse']
            )->name('endorse.store');

            Route::put(
                '/endorse/{id}',
                [AkuntansiMarketingController::class, 'updateEndorse']
            )->name('endorse.update');

            Route::patch(
                '/endorse/{id}/status',
                [AkuntansiMarketingController::class, 'updateEndorseStatus']
            )->name('endorse.status');

            Route::delete(
                '/endorse/{id}',
                [AkuntansiMarketingController::class, 'destroyEndorse']
            )->name('endorse.destroy');

            /*
            |--------------------------------------------------------------------------
            | Dynamic Sheet CRUD
            |--------------------------------------------------------------------------
            */
            Route::post(
                '/sheet/{sheetName}',
                [AkuntansiMarketingController::class, 'storeSheetRow']
            )->name('sheet.store');

            Route::put(
                '/sheet/{sheetName}/{id}',
                [AkuntansiMarketingController::class, 'updateSheetRow']
            )->name('sheet.update');

            Route::delete(
                '/sheet/{sheetName}/{id}',
                [AkuntansiMarketingController::class, 'destroySheetRow']
            )->name('sheet.destroy');

            /*
            |--------------------------------------------------------------------------
            | Omset
            |--------------------------------------------------------------------------
            */
            Route::post(
                '/monthly-income',
                [AkuntansiMarketingController::class, 'storeMonthlyIncome']
            )->name('monthly-income.store');

            Route::post(
                '/weekly-income',
                [AkuntansiMarketingController::class, 'storeWeeklyIncome']
            )->name('weekly-income.store');
        });


    /*
    |--------------------------------------------------------------------------
    | URL utama Akuntansi & Marketing
    |--------------------------------------------------------------------------
    */
    Route::get(
        '/akuntansi-marketing-view',
        [AkuntansiMarketingController::class, 'index']
    )->name('akuntansi.index');
});


/*
|--------------------------------------------------------------------------
| Pesan Laporan ke Manager PMS
|--------------------------------------------------------------------------
|
| User operasional:
| - mengirim pesan bebas ke Manager PMS
|
| Manager PMS:
| - menghapus pesan yang sudah diterima
|
| Pesan ini terpisah dari lifecycle JobDesk dan TIDAK ikut
| mekanisme FIFO / cleanup mingguan JobDesk.
|
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    Route::post(
        '/manager-messages',
        [ManagerMessageController::class, 'store']
    )->name('manager-messages.store');

    Route::delete(
        '/manager-messages/{managerMessage}',
        [ManagerMessageController::class, 'destroy']
    )->name('manager-messages.destroy');
});


/*
|--------------------------------------------------------------------------
| JobDesk — Shared Across Roles
|--------------------------------------------------------------------------
|
| Manager PMS:
| - melihat seluruh JobDesk
| - membuat / mengirim JobDesk
| - memvalidasi JobDesk
| - menghapus JobDesk
|
| User operasional:
| - melihat JobDesk miliknya sendiri
| - menandai JobDesk miliknya sebagai selesai
|
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    Route::get(
        '/jobdesks',
        [JobDeskController::class, 'index']
    )->name('jobdesks.index');

    Route::get(
        '/jobdesks/mine',
        [JobDeskController::class, 'mine']
    )->name('jobdesks.mine');

    Route::post(
        '/jobdesks',
        [JobDeskController::class, 'store']
    )->name('jobdesks.store');

    Route::patch(
        '/jobdesks/{jobDesk}/complete',
        [JobDeskController::class, 'complete']
    )->name('jobdesks.complete');

    Route::patch(
        '/jobdesks/{jobDesk}/validate',
        [JobDeskController::class, 'validateJob']
    )->name('jobdesks.validate');

    Route::delete(
        '/jobdesks/{jobDesk}',
        [JobDeskController::class, 'destroy']
    )->name('jobdesks.destroy');
});


/*
|--------------------------------------------------------------------------
| Admin Legacy Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:manager_pms'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::patch(
            '/laporan/{id}/status',
            [DashboardController::class, 'updateStatus']
        )->name('laporan.status');

        Route::delete(
            '/laporan/{id}',
            [DashboardController::class, 'destroy']
        )->name('laporan.destroy');
    });


/*
|--------------------------------------------------------------------------
| User / Petani Legacy
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:pj_greenhouse'])
    ->prefix('user')
    ->name('user.')
    ->group(function () {

        Route::get(
            '/',
            [DashboardController::class, 'user']
        )->name('index');

        Route::get(
            '/dashboard',
            [DashboardController::class, 'user']
        )->name('dashboard');

        Route::post(
            '/laporan',
            [LaporanController::class, 'store']
        )->name('laporan.store');
    });


/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';