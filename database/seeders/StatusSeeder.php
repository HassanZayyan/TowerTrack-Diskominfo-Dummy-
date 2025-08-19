<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Seeder;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'name' => 'Pending',
                'slug' => 'pending',
                'color' => 'red',
                'icon' => 'clock',
            ],
            [
                'name' => 'In Progress',
                'slug' => 'in_progress',
                'color' => 'orange',
                'icon' => 'refresh',
            ],
            [
                'name' => 'Closed',
                'slug' => 'closed',
                'color' => 'green',
                'icon' => 'check',
            ],
        ];

        foreach ($statuses as $status) {
            Status::updateOrCreate(
                ['slug' => $status['slug']],
                $status
            );
        }
    }
}