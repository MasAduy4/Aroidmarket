<?php

use App\Http\Controllers\Admin\LahanController;
use App\Http\Controllers\AkuntansiMarketingController;  
use App\Http\Controllers\CustomerServiceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GreenhouseController;
use App\Http\Controllers\JobDeskController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ManagerPmsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — OptimusFarm / Aroid Market
|--------------------------------------------------------------------------
*/

// Public / Landing Direct
Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('manager.dashboard')
        : redirect()->route('login');
})->name('home');

/*
|--------------------------------------------------------------------------
| Guest Routes (Halaman Login)
|--------------------------------------------------------------------------
*/
Route::middleware(['guest'])->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');
});

/*
|--------------------------------------------------------------------------
| Logout Route
|--------------------------------------------------------------------------
*/
Route::post('/logout', function () {
    auth()->logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('login');
})->name('logout');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    Route::get('/manager-dashboard', [ManagerPmsController::class, 'index'])
    ->name('manager.dashboard');

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // ---- CS Reports Routes ----
    Route::post('/cs-reports', [CustomerServiceController::class, 'store'])->name('cs-reports.store');
    Route::put('/cs-reports/{id}', [CustomerServiceController::class, 'update'])->name('cs-reports.update');
    Route::delete('/cs-reports/{id}', [CustomerServiceController::class, 'destroy'])->name('cs-reports.destroy');

    // ---- Customer Service Desk ----
    Route::prefix('customer-service')->name('customer-service.')->group(function () {
        Route::get('/', [CustomerServiceController::class, 'index'])->name('index');
    });

    // ---- PJ Greenhouse Routes ----
    Route::prefix('pj-greenhouse')->name('greenhouse.')->group(function () {
        Route::get('/', [GreenhouseController::class, 'index'])->name('plants.index');
        Route::post('/', [GreenhouseController::class, 'store'])->name('plants.store');
        Route::put('/{plant}', [GreenhouseController::class, 'update'])->name('plants.update');
        Route::delete('/{plant}', [GreenhouseController::class, 'destroy'])->name('plants.destroy');
        Route::post('/validate-barcode', [GreenhouseController::class, 'validateBarcode'])->name('plants.validate-barcode');
        Route::post('/{plant}/sold', [GreenhouseController::class, 'markAsSold'])->name('plants.sold');
    });

    // ---- Akuntansi & Marketing Routes ----
    Route::prefix('akuntansi-marketing')->name('akuntansi-marketing.')->group(function () {
        Route::get('/', [AkuntansiMarketingController::class, 'index'])->name('index');
        Route::get('/view', [AkuntansiMarketingController::class, 'index'])->name('view');
        
        // Pendapatan & Send to Manager PMS
        Route::put('/weekly-income/{id}', [AkuntansiMarketingController::class, 'updateWeeklyIncome'])->name('weekly.update');
        Route::post('/send-to-pms', [AkuntansiMarketingController::class, 'sendToPmsManager'])->name('send-to-pms');

        // Jobdesk CRUD
        Route::post('/jobdesk', [AkuntansiMarketingController::class, 'storeJobdesk'])->name('jobdesk.store');
        Route::post('/jobdesks', [AkuntansiMarketingController::class, 'storeJobdesk'])->name('jobdesks.store');
        Route::patch('/jobdesk/{id}/toggle', [AkuntansiMarketingController::class, 'toggleJobdesk'])->name('jobdesk.toggle');
        Route::delete('/jobdesk/{id}', [AkuntansiMarketingController::class, 'destroyJobdesk'])->name('jobdesk.destroy');

        // Endorse CRUD
        Route::post('/endorse', [AkuntansiMarketingController::class, 'storeEndorse'])->name('endorse.store');
        Route::put('/endorse/{id}', [AkuntansiMarketingController::class, 'updateEndorse'])->name('endorse.update');
        Route::patch('/endorse/{id}/status', [AkuntansiMarketingController::class, 'updateEndorseStatus'])->name('endorse.status');
        Route::delete('/endorse/{id}', [AkuntansiMarketingController::class, 'destroyEndorse'])->name('endorse.destroy');

        // Sheet CRUD Dynamic
        Route::post('/sheet/{sheetName}', [AkuntansiMarketingController::class, 'storeSheetRow'])->name('sheet.store');
        Route::put('/sheet/{sheetName}/{id}', [AkuntansiMarketingController::class, 'updateSheetRow'])->name('sheet.update');
        Route::delete('/sheet/{sheetName}/{id}', [AkuntansiMarketingController::class, 'destroySheetRow'])->name('sheet.destroy');

        // Omset Bulanan (Jan - Okt)
        Route::post('/monthly-income', [AkuntansiMarketingController::class, 'storeMonthlyIncome'])->name('monthly-income.store');
        Route::post('/weekly-income', [AkuntansiMarketingController::class, 'storeWeeklyIncome'])->name('weekly-income.store');
    });

    // Alias route alternatif untuk kecocokan URL
    Route::get('/akuntansi-marketing-view', [AkuntansiMarketingController::class, 'index'])->name('akuntansi.index');

    // ---- JobDesk Routes (Global) ----
    Route::get('/jobdesks', [JobDeskController::class, 'index'])->name('jobdesks.index');
    Route::post('/jobdesks', [JobDeskController::class, 'store'])->name('jobdesks.store');
    Route::patch('/jobdesks/{jobDesk}/complete', [JobDeskController::class, 'complete'])->name('jobdesks.complete');
    Route::patch('/jobdesks/{jobDesk}/validate', [JobDeskController::class, 'validateJob'])->name('jobdesks.validate');
    Route::delete('/jobdesks/{jobDesk}', [JobDeskController::class, 'destroy'])->name('jobdesks.destroy');

    // ---- Manager / Admin ----
    Route::prefix('manager')->name('manager.')->group(function () {
        Route::get('/', [DashboardController::class, 'admin'])->name('index');
        Route::get('/pms-dashboard', [ManagerPmsController::class, 'index'])->name('pms-dashboard');

        // API Endpoint Khusus Manager PMS (Grafik & Popup Net Finansial & Persistensi Influencer)
        Route::get('/monthly-revenue', [ManagerPmsController::class, 'getMonthlyRevenue'])->name('monthly-revenue');
        Route::post('/monthly-revenue', [ManagerPmsController::class, 'storeMonthlyRevenue'])->name('monthly-revenue.store');
        Route::get('/chart-data', [ManagerPmsController::class, 'getChartData'])->name('chart-data');
        Route::get('/endorse-candidates', [ManagerPmsController::class, 'getEndorseCandidates'])->name('endorse.list');
        Route::post('/endorse-candidates', [ManagerPmsController::class, 'storeEndorseCandidate'])->name('endorse.store');
        Route::put('/endorse-candidates/{id}', [ManagerPmsController::class, 'updateEndorseCandidate'])->name('endorse.update');
        Route::delete('/endorse-candidates/{id}', [ManagerPmsController::class, 'destroyEndorseCandidate'])->name('endorse.destroy');

        // Kelola Lahan
        Route::get('/lahan',         [LahanController::class, 'index'])->name('lahan.index');
        Route::post('/lahan',        [LahanController::class, 'store'])->name('lahan.store');
        Route::put('/lahan/{id}',    [LahanController::class, 'update'])->name('lahan.update');
        Route::delete('/lahan/{id}', [LahanController::class, 'destroy'])->name('lahan.destroy');

        Route::get('/poktan',      fn () => Inertia::render('Admin/Poktan'))->name('poktan.index');
        Route::get('/laporan',     fn () => Inertia::render('Admin/Laporan'))->name('laporan.index');

        Route::post('/monthly-revenue/update', [DashboardController::class, 'updateMonthlyRevenue'])->name('monthly-revenue.update');
    });

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::patch('/laporan/{id}/status', [DashboardController::class, 'updateStatus'])->name('laporan.status');
        Route::delete('/laporan/{id}',        [DashboardController::class, 'destroy'])->name('laporan.destroy');
    });

    // ---- User / Petani ----
    Route::prefix('user')->name('user.')->group(function () {
        Route::get('/',           [DashboardController::class, 'user'])->name('index');
        Route::get('/dashboard',  [DashboardController::class, 'user'])->name('dashboard');
        
        Route::post('/laporan',   [LaporanController::class, 'store'])->name('laporan.store');
    });

});

require __DIR__.'/auth.php';