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
        // Define default statuses with appropriate colors and icons
        $statuses = [
            [
                'name' => 'Pending',
                'slug' => 'pending',
                'description' => 'Pengaduan sedang menunggu tindak lanjut',
                'color' => '#FCD34D', // Yellow
                'icon' => 'clock',
                'is_default' => true,
            ],
            [
                'name' => 'In Progress',
                'slug' => 'in_progress',
                'description' => 'Pengaduan sedang dalam proses penanganan',
                'color' => '#60A5FA', // Blue
                'icon' => 'refresh',
                'is_default' => false,
            ],
            [
                'name' => 'Responded',
                'slug' => 'responded',
                'description' => 'Pengaduan telah ditanggapi oleh admin',
                'color' => '#34D399', // Green
                'icon' => 'chat',
                'is_default' => false,
            ],
            [
                'name' => 'Resolved',
                'slug' => 'resolved',
                'description' => 'Pengaduan telah diselesaikan',
                'color' => '#10B981', // Emerald
                'icon' => 'check-circle',
                'is_default' => false,
            ],
            [
                'name' => 'Closed',
                'slug' => 'closed',
                'description' => 'Pengaduan telah ditutup',
                'color' => '#6B7280', // Gray
                'icon' => 'lock-closed',
                'is_default' => false,
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
