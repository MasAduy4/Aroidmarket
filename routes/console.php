<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| JobDesk — rolling 4 weekly periods
|--------------------------------------------------------------------------
*/
Schedule::command('jobdesks:cleanup-old')
    ->weeklyOn(1, '00:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping();
