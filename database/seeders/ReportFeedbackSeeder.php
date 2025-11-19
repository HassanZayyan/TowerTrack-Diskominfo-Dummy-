<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Tower;
use App\Models\Status;
use Illuminate\Database\Seeder;

class ReportFeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create users with different roles
        $complainantUser = User::firstOrCreate(
            ['email' => 'complainant@example.com'],
            [
                'name' => 'User Complainant',
                'password' => bcrypt('password'),
                'role' => 'complainant',
                'email_verified_at' => now(),
            ]
        );

        // Get statuses
        $pendingStatus = Status::where('slug', 'pending')->first();
        $inProgressStatus = Status::where('slug', 'in_progress')->first();
        $closedStatus = Status::where('slug', 'closed')->first();

        // Get existing towers from database (only towers with valid coordinates)
        $towers = Tower::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->limit(5)
            ->get();

        if ($towers->count() < 2) {
            $this->command->error('❌ Tidak cukup tower dengan koordinat di database!');
            $this->command->error('   Minimal 2 tower dengan koordinat diperlukan.');
            $this->command->error('   Jalankan TowerSeeder terlebih dahulu: php artisan db:seed --class=TowerSeeder');
            return;
        }

        $this->command->info("✓ Menggunakan {$towers->count()} tower dari database");
        
        // Use different towers for variety
        $tower1 = $towers[0];
        $tower2 = $towers->count() > 1 ? $towers[1] : $towers[0];
        $tower3 = $towers->count() > 2 ? $towers[2] : $towers[0];
        $tower4 = $towers->count() > 3 ? $towers[3] : $towers[1];

        // Check if seeder has already been run
        if (Report::where('email', 'guest1@example.com')->exists() || 
            Feedback::where('email', 'feedback1@example.com')->exists()) {
            $this->command->warn('⚠ Seeder sudah pernah dijalankan sebelumnya.');
            $this->command->info('  Untuk menjalankan ulang, hapus data reports dan feedbacks terlebih dahulu.');
            return;
        }

        // ===== REPORTS SEEDER =====
        // Sesuai flow asli: semua report HARUS memiliki koordinat reporter (location_captured_at)
        // karena sistem meminta izin lokasi pengguna saat membuat report
        
        // 1. Report: Status Pending (Terbuka), Role Guest, Public
        Report::create([
            'tower_id' => $tower1->id,
            'user_id' => null, // Guest user
            'email' => 'guest1@example.com',
            'reporter_name' => 'Ahmad Wijaya',
            'reporter_phone' => '081234567890',
            'category' => 'Kerusakan',
            'message' => 'Lampu tower tidak menyala di malam hari, sangat mengganggu keselamatan penerbangan. Mohon segera diperbaiki.',
            'status_id' => $pendingStatus->id,
            // Reporter coordinates (dekat dengan tower, dalam radius 1km sesuai validasi)
            'reporter_latitude' => (float)$tower1->latitude + 0.001, // ~111 meter dari tower
            'reporter_longitude' => (float)$tower1->longitude + 0.001,
            'reporter_accuracy' => 5.5,
            'location_captured_at' => now()->subDays(2),
            'is_public' => true,
            'email_verified_at' => now()->subDays(2), // Guest user verified for seeder data
        ]);

        // 2. Report: Status Closed (Tertutup), Role Complainant, Public
        Report::create([
            'tower_id' => $tower1->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567891',
            'category' => 'Gangguan Sinyal',
            'message' => 'Sejak tower ini diaktifkan, sinyal TV dirumah saya terganggu. Mohon bantuannya untuk mengatasi masalah ini.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$tower1->latitude + 0.002,
            'reporter_longitude' => (float)$tower1->longitude - 0.001,
            'reporter_accuracy' => 3.2,
            'location_captured_at' => now()->subDays(10),
            'is_public' => true,
        ]);

        // 3. Report: Status In Progress, Role Guest, Public
        Report::create([
            'tower_id' => $tower2->id,
            'user_id' => null, // Guest user
            'email' => 'guest2@example.com',
            'reporter_name' => 'Budi Santoso',
            'reporter_phone' => '081234567892',
            'category' => 'Kebisingan',
            'message' => 'Tower mengeluarkan suara bising saat angin kencang, mengganggu kenyamanan warga sekitar. Terutama di malam hari sangat mengganggu.',
            'status_id' => $inProgressStatus->id,
            'reporter_latitude' => (float)$tower2->latitude - 0.001,
            'reporter_longitude' => (float)$tower2->longitude + 0.002,
            'reporter_accuracy' => 8.1,
            'location_captured_at' => now()->subDays(5),
            'is_public' => true,
            'email_verified_at' => now()->subDays(5), // Guest user verified for seeder data
        ]);

        // 4. Report: Status Pending, Role Complainant, Private
        Report::create([
            'tower_id' => $tower3->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567893',
            'category' => 'Kerusakan',
            'message' => 'Kabel tower terlihat kendur dan berisiko putus. Mohon segera dilakukan pengecekan untuk keamanan.',
            'status_id' => $pendingStatus->id,
            'reporter_latitude' => (float)$tower3->latitude + 0.0005,
            'reporter_longitude' => (float)$tower3->longitude - 0.0005,
            'reporter_accuracy' => 6.5,
            'location_captured_at' => now()->subDays(1),
            'is_public' => false,
        ]);

        // 5. Report: Status Closed, Role Guest, Private
        Report::create([
            'tower_id' => $tower4->id,
            'user_id' => null,
            'email' => 'guest3@example.com',
            'reporter_name' => 'Siti Nurhaliza',
            'reporter_phone' => '081234567894',
            'category' => 'Lainnya',
            'message' => 'Apakah tower ini sudah memiliki izin operasional yang lengkap? Saya ingin memastikan keamanan tower untuk lingkungan sekitar.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$tower4->latitude - 0.002,
            'reporter_longitude' => (float)$tower4->longitude + 0.001,
            'reporter_accuracy' => 4.8,
            'location_captured_at' => now()->subDays(8),
            'is_public' => false,
            'email_verified_at' => now()->subDays(8), // Guest user verified for seeder data
        ]);

        // 6. Report: Status In Progress, Role Guest, Public
        Report::create([
            'tower_id' => $tower2->id,
            'user_id' => null,
            'email' => 'guest4@example.com',
            'reporter_name' => 'Eko Prasetyo',
            'reporter_phone' => '081234567895',
            'category' => 'Kerusakan',
            'message' => 'Pagar pembatas tower rusak dan terbuka, anak-anak bisa masuk ke area tower. Sangat berbahaya, mohon segera diperbaiki.',
            'status_id' => $inProgressStatus->id,
            'reporter_latitude' => (float)$tower2->latitude + 0.0015,
            'reporter_longitude' => (float)$tower2->longitude - 0.0015,
            'reporter_accuracy' => 7.2,
            'location_captured_at' => now()->subHours(18),
            'is_public' => true,
            'email_verified_at' => now()->subHours(18), // Guest user verified for seeder data
        ]);

        // ===== FEEDBACKS SEEDER =====
        // Sesuai flow asli: semua feedback HARUS memiliki koordinat reporter (location_captured_at)
        // karena sistem meminta izin lokasi pengguna saat membuat feedback

        // 1. Feedback: Status Pending, Role Guest, Public
        Feedback::create([
            'tower_id' => $tower1->id,
            'user_id' => null, // Guest user
            'email' => 'feedback1@example.com',
            'sender_name' => 'Dewi Lestari',
            'sender_phone' => '082345678901',
            'category' => 'Saran Perbaikan',
            'message' => 'Tolong pasang penanda yang lebih jelas di sekitar tower untuk keselamatan. Sebaiknya juga ditambahkan lampu penerangan di malam hari.',
            'status' => 'pending',
            'reporter_latitude' => (float)$tower1->latitude + 0.0008,
            'reporter_longitude' => (float)$tower1->longitude + 0.0012,
            'reporter_accuracy' => 4.3,
            'location_captured_at' => now()->subDays(3),
            'is_public' => true,
            'email_verified_at' => now()->subDays(3), // Guest user verified for seeder data
        ]);

        // 2. Feedback: Status Closed, Role Complainant, Public
        Feedback::create([
            'tower_id' => $tower2->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678902',
            'category' => 'Kritik Konstruktif',
            'message' => 'Proses pembangunan tower kurang koordinasi dengan warga sekitar. Sebaiknya ada sosialisasi terlebih dahulu sebelum pembangunan dimulai.',
            'status' => 'closed',
            'reporter_latitude' => (float)$tower2->latitude - 0.0012,
            'reporter_longitude' => (float)$tower2->longitude + 0.0008,
            'reporter_accuracy' => 2.8,
            'location_captured_at' => now()->subDays(15),
            'is_public' => true,
        ]);

        // 3. Feedback: Status In Progress, Role Guest, Public
        Feedback::create([
            'tower_id' => $tower3->id,
            'user_id' => null,
            'email' => 'feedback2@example.com',
            'sender_name' => 'Fajar Ramadhan',
            'sender_phone' => '082345678903',
            'category' => 'Apresiasi',
            'message' => 'Terima kasih sudah membangun tower ini, sinyal internet di kampung kami jadi lebih baik. Sangat membantu untuk belajar online.',
            'status' => 'in_progress',
            'reporter_latitude' => (float)$tower3->latitude + 0.0018,
            'reporter_longitude' => (float)$tower3->longitude - 0.0008,
            'reporter_accuracy' => 7.2,
            'location_captured_at' => now()->subDays(7),
            'is_public' => true,
            'email_verified_at' => now()->subDays(7), // Guest user verified for seeder data
        ]);

        // 4. Feedback: Status Responded, Role Complainant, Private
        Feedback::create([
            'tower_id' => $tower4->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678904',
            'category' => 'Usulan Fitur',
            'message' => 'Bagaimana kalau tower ini dilengkapi dengan speaker untuk sistem peringatan dini bencana? Akan sangat bermanfaat untuk masyarakat.',
            'status' => 'responded',
            'reporter_latitude' => (float)$tower4->latitude + 0.0006,
            'reporter_longitude' => (float)$tower4->longitude + 0.0014,
            'reporter_accuracy' => 5.9,
            'location_captured_at' => now()->subDays(4),
            'is_public' => false,
        ]);

        // 5. Feedback: Status Resolved, Role Guest, Public
        Feedback::create([
            'tower_id' => $tower1->id,
            'user_id' => null,
            'email' => 'feedback3@example.com',
            'sender_name' => 'Fitri Handayani',
            'sender_phone' => '082345678905',
            'category' => 'Saran Perbaikan',
            'message' => 'Sebaiknya ada koordinasi dengan warga sebelum melakukan maintenance tower. Kemarin tiba-tiba mati tanpa pemberitahuan.',
            'status' => 'resolved',
            'reporter_latitude' => (float)$tower1->latitude - 0.0009,
            'reporter_longitude' => (float)$tower1->longitude - 0.0011,
            'reporter_accuracy' => 6.1,
            'location_captured_at' => now()->subDays(12),
            'is_public' => true,
            'email_verified_at' => now()->subDays(12), // Guest user verified for seeder data
        ]);

        // 6. Feedback: Status Pending, Role Complainant, Private
        Feedback::create([
            'tower_id' => $tower3->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678906',
            'category' => 'Lainnya',
            'message' => 'Apakah ada rencana untuk meningkatkan kapasitas tower ini? Akhir-akhir ini sinyal sering lambat saat jam sibuk.',
            'status' => 'pending',
            'reporter_latitude' => (float)$tower3->latitude - 0.0016,
            'reporter_longitude' => (float)$tower3->longitude + 0.0007,
            'reporter_accuracy' => 4.7,
            'location_captured_at' => now()->subHours(36),
            'is_public' => false,
        ]);

        // 7. Feedback: Status In Progress, Role Guest, Public
        Feedback::create([
            'tower_id' => $tower2->id,
            'user_id' => null,
            'email' => 'feedback4@example.com',
            'sender_name' => 'Hendra Gunawan',
            'sender_phone' => '082345678907',
            'category' => 'Apresiasi',
            'message' => 'Sangat senang dengan kecepatan internet setelah tower ini aktif. Terima kasih telah meningkatkan infrastruktur telekomunikasi di daerah kami.',
            'status' => 'in_progress',
            'reporter_latitude' => (float)$tower2->latitude + 0.0013,
            'reporter_longitude' => (float)$tower2->longitude - 0.0019,
            'reporter_accuracy' => 5.3,
            'location_captured_at' => now()->subHours(8),
            'is_public' => true,
            'email_verified_at' => now()->subHours(8), // Guest user verified for seeder data
        ]);

        $this->command->info('✓ Reports dan Feedbacks berhasil di-seed!');
        $this->command->info("  - 6 Reports dibuat dari tower yang ada di database");
        $this->command->info("  - 7 Feedbacks dibuat dari tower yang ada di database");
        $this->command->info("  - Semua data memiliki koordinat reporter sesuai flow asli");
        $this->command->info("  - Guest users memiliki email_verified_at agar muncul di frontend");
        $this->command->info("  - Variasi: Status terbuka/tertutup, Guest/Complainant, Public/Private");
    }
}

