<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Report;
use App\Models\User;
use App\Models\Tower;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing users and towers
        $users = User::take(3)->get();
        $towers = Tower::take(3)->get();

        if ($users->count() === 0 || $towers->count() === 0) {
            $this->command->warn('No users or towers found. Please seed users and towers first.');
            return;
        }

        // Create test reports
        $reports = [
            [
                'user_id' => $users->first()->id,
                'tower_id' => $towers->first()->id ?? null,
                'reporter_phone' => '081234567890',
                'category' => 'Signal Issue',
                'message' => 'Sinyal di area ini sangat lemah, mengganggu aktivitas komunikasi sehari-hari. Mohon dapat segera diperbaiki.',
                'status' => 'pending',
            ],
            [
                'user_id' => $users->skip(1)->first()->id ?? $users->first()->id,
                'tower_id' => $towers->skip(1)->first()->id ?? null,
                'reporter_phone' => '081234567891',
                'category' => 'Tower Maintenance',
                'message' => 'Tower terlihat rusak dan perlu perbaikan. Ada beberapa bagian yang tampak berkarat.',
                'status' => 'in_progress',
            ],
            [
                'user_id' => $users->skip(2)->first()->id ?? $users->first()->id,
                'tower_id' => $towers->skip(2)->first()->id ?? null,
                'reporter_phone' => '081234567892',
                'category' => 'Noise Complaint',
                'message' => 'Suara bising dari peralatan tower mengganggu kenyamanan warga sekitar, terutama pada malam hari.',
                'status' => 'responded',
            ],
        ];

        foreach ($reports as $reportData) {
            Report::create($reportData);
        }

        $this->command->info('3 test reports created successfully!');
    }
}
