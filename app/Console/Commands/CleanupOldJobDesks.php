<?php

namespace App\Console\Commands;

use App\Models\JobDesk;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class CleanupOldJobDesks extends Command
{
    protected $signature = 'jobdesks:cleanup-old';

    protected $description = 'Bersihkan JobDesk di luar rolling 4 minggu terakhir.';

    public function handle(): int
    {
        $now = CarbonImmutable::now('Asia/Jakarta');

        // FIFO 4 minggu: minggu aktif + 3 minggu sebelumnya.
        $cutoff = $now
            ->startOfWeek(CarbonImmutable::MONDAY)
            ->subWeeks(3);

        $deleted = JobDesk::query()
            ->where('created_at', '<', $cutoff)
            ->delete();

        $this->info(
            "Cleanup JobDesk selesai. Cutoff {$cutoff->toDateTimeString()} WIB. "
            . "Dihapus {$deleted} record."
        );

        return self::SUCCESS;
    }
}
