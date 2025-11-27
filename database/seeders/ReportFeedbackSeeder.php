<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Tower;
use App\Models\Status;
use App\Models\ReportResponse;
use App\Models\FeedbackResponse;
use App\Models\PublicComment;
use Illuminate\Database\Seeder;

class ReportFeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create users with different roles
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@kominfo.go.id'],
            [
                'name' => 'Admin Kominfo',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $complainantUser = User::firstOrCreate(
            ['email' => 'complainant@example.com'],
            [
                'name' => 'User Complainant',
                'password' => bcrypt('password'),
                'role' => 'complainant',
                'email_verified_at' => now(),
            ]
        );

        // Get existing tower owner user from TowerOwnerUserSeeder
        $towerOwnerUser = User::where('email', 'ptdayamitratelekomun@towerowner.local')
            ->where('role', 'tower_owner')
            ->first();
        
        if (!$towerOwnerUser) {
            // Fallback: get first tower_owner user if the specific one doesn't exist
            $towerOwnerUser = User::where('role', 'tower_owner')->first();
            
            if (!$towerOwnerUser) {
                $this->command->error('❌ Tower owner user tidak ditemukan!');
                $this->command->error('   Jalankan TowerOwnerUserSeeder terlebih dahulu: php artisan db:seed --class=TowerOwnerUserSeeder');
                return;
            }
            
            $this->command->warn("⚠ User tower owner spesifik tidak ditemukan, menggunakan: {$towerOwnerUser->email}");
        } else {
            $this->command->info("✓ Menggunakan tower owner user: {$towerOwnerUser->email}");
        }

        // Get statuses
        $pendingStatus = Status::where('slug', 'pending')->first();
        $inProgressStatus = Status::where('slug', 'in_progress')->first();
        $closedStatus = Status::where('slug', 'closed')->first();

        // Get existing towers from database
        $towers = Tower::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->limit(6)
            ->get();

        if ($towers->count() < 6) {
            $this->command->error('❌ Tidak cukup tower dengan koordinat di database!');
            $this->command->error('   Minimal 6 tower dengan koordinat diperlukan.');
            $this->command->error('   Jalankan TowerSeeder terlebih dahulu: php artisan db:seed --class=TowerSeeder');
            return;
        }

        $this->command->info("✓ Menggunakan {$towers->count()} tower dari database");

        // Check if seeder has already been run
        if (Report::where('email', 'guest1@example.com')->exists() || 
            Feedback::where('email', 'feedback1@example.com')->exists()) {
            $this->command->warn('⚠ Seeder sudah pernah dijalankan sebelumnya.');
            $this->command->info('  Untuk menjalankan ulang, hapus data reports dan feedbacks terlebih dahulu.');
            return;
        }

        // ===== GUEST REPORTS =====
        
        // 1. Guest Report: Public, Pending (baru dibuat, belum ada response/comment)
        $guestReport1 = Report::create([
            'tower_id' => $towers[0]->id,
            'user_id' => null,
            'email' => 'guest1@example.com',
            'reporter_name' => 'Ahmad Wijaya',
            'reporter_phone' => '081234567890',
            'category' => 'Kerusakan',
            'message' => 'Lampu tower tidak menyala di malam hari, sangat mengganggu keselamatan penerbangan. Mohon segera diperbaiki.',
            'status_id' => $pendingStatus->id,
            'reporter_latitude' => (float)$towers[0]->latitude + 0.001,
            'reporter_longitude' => (float)$towers[0]->longitude + 0.001,
            'reporter_accuracy' => 5.5,
            'location_captured_at' => now()->subDays(1),
            'is_public' => true,
            'email_verified_at' => now()->subDays(1),
        ]);
        // Pending: tidak ada response dan comment

        // 2. Guest Report: Private, Closed (sudah selesai, ada diskusi admin-reporter)
        $guestReport2 = Report::create([
            'tower_id' => $towers[1]->id,
            'user_id' => null,
            'email' => 'guest2@example.com',
            'reporter_name' => 'Budi Santoso',
            'reporter_phone' => '081234567891',
            'category' => 'Kebisingan',
            'message' => 'Tower mengeluarkan suara bising saat angin kencang, mengganggu kenyamanan warga sekitar.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$towers[1]->latitude - 0.001,
            'reporter_longitude' => (float)$towers[1]->longitude + 0.002,
            'reporter_accuracy' => 8.1,
            'location_captured_at' => now()->subDays(10),
            'is_public' => false,
            'email_verified_at' => now()->subDays(10),
        ]);
        // Closed: ada diskusi admin-reporter
        ReportResponse::create([
            'report_id' => $guestReport2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas laporannya. Tim kami akan melakukan pengecekan dan perbaikan pada tower tersebut.',
            'created_at' => now()->subDays(9),
        ]);
        ReportResponse::create([
            'report_id' => $guestReport2->id,
            'user_id' => null,
            'sender_type' => 'guest',
            'sender_name' => 'Budi Santoso',
            'sender_email' => 'guest2@example.com',
            'sender_phone' => '081234567891',
            'message' => 'Baik, terima kasih. Kapan kira-kira akan dilakukan pengecekan?',
            'created_at' => now()->subDays(8),
        ]);
        ReportResponse::create([
            'report_id' => $guestReport2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Pengecekan akan dilakukan dalam 2-3 hari kerja. Kami akan memberikan update setelah pengecekan selesai.',
            'created_at' => now()->subDays(7),
        ]);

        // ===== GUEST FEEDBACKS =====

        // 3. Guest Feedback: Public, In Progress (admin sudah merespons)
        $guestFeedback1 = Feedback::create([
            'tower_id' => $towers[2]->id,
            'user_id' => null,
            'email' => 'feedback1@example.com',
            'sender_name' => 'Dewi Lestari',
            'sender_phone' => '082345678901',
            'category' => 'Saran Perbaikan',
            'message' => 'Tolong pasang penanda yang lebih jelas di sekitar tower untuk keselamatan. Sebaiknya juga ditambahkan lampu penerangan di malam hari.',
            'status' => 'in_progress',
            'reporter_latitude' => (float)$towers[2]->latitude + 0.0008,
            'reporter_longitude' => (float)$towers[2]->longitude + 0.0012,
            'reporter_accuracy' => 4.3,
            'location_captured_at' => now()->subDays(5),
            'is_public' => true,
            'email_verified_at' => now()->subDays(5),
        ]);
        // In Progress: admin sudah merespons
        FeedbackResponse::create([
            'feedback_id' => $guestFeedback1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas sarannya. Kami akan menindaklanjuti dengan memasang penanda dan lampu penerangan yang lebih jelas.',
            'created_at' => now()->subDays(4),
        ]);
        // Ada komentar dari role lain
        PublicComment::create([
            'commentable_type' => Feedback::class,
            'commentable_id' => $guestFeedback1->id,
            'parent_id' => null,
            'user_id' => $complainantUser->id,
            'guest_name' => null,
            'guest_email' => null,
            'guest_phone' => null,
            'message' => 'Setuju sekali dengan saran ini. Lampu penerangan sangat penting untuk keselamatan.',
            'is_approved' => true,
            'created_at' => now()->subDays(3),
        ]);

        // 4. Guest Feedback: Private, Pending (baru dibuat)
        Feedback::create([
            'tower_id' => $towers[3]->id,
            'user_id' => null,
            'email' => 'feedback2@example.com',
            'sender_name' => 'Fajar Ramadhan',
            'sender_phone' => '082345678902',
            'category' => 'Lainnya',
            'message' => 'Apakah tower ini sudah memiliki izin operasional yang lengkap? Saya ingin memastikan keamanan tower untuk lingkungan sekitar.',
            'status' => 'pending',
            'reporter_latitude' => (float)$towers[3]->latitude + 0.0018,
            'reporter_longitude' => (float)$towers[3]->longitude - 0.0008,
            'reporter_accuracy' => 7.2,
            'location_captured_at' => now()->subDays(2),
            'is_public' => false,
            'email_verified_at' => now()->subDays(2),
        ]);
        // Pending: tidak ada response

        // ===== COMPLAINANT REPORTS =====

        // 5. Complainant Report: Public, In Progress (admin sudah merespons, ada komentar)
        $complainantReport1 = Report::create([
            'tower_id' => $towers[4]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567892',
            'category' => 'Gangguan Sinyal',
            'message' => 'Sejak tower ini diaktifkan, sinyal TV dirumah saya terganggu. Mohon bantuannya untuk mengatasi masalah ini.',
            'status_id' => $inProgressStatus->id,
            'reporter_latitude' => (float)$towers[4]->latitude + 0.002,
            'reporter_longitude' => (float)$towers[4]->longitude - 0.001,
            'reporter_accuracy' => 3.2,
            'location_captured_at' => now()->subDays(8),
            'is_public' => true,
        ]);
        // In Progress: admin sudah merespons
        ReportResponse::create([
            'report_id' => $complainantReport1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Kami akan melakukan pengecekan gangguan sinyal TV. Tim teknis akan menghubungi Anda untuk koordinasi.',
            'created_at' => now()->subDays(7),
        ]);
        // Ada komentar dari role lain
        PublicComment::create([
            'commentable_type' => Report::class,
            'commentable_id' => $complainantReport1->id,
            'parent_id' => null,
            'user_id' => $towerOwnerUser->id,
            'guest_name' => null,
            'guest_email' => null,
            'guest_phone' => null,
            'message' => 'Saya juga mengalami masalah serupa. Semoga cepat teratasi.',
            'is_approved' => true,
            'created_at' => now()->subDays(6),
        ]);

        // 6. Complainant Report: Private, Closed (diskusi admin-reporter)
        $complainantReport2 = Report::create([
            'tower_id' => $towers[5]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567893',
            'category' => 'Kerusakan',
            'message' => 'Kabel tower terlihat kendur dan berisiko putus. Mohon segera dilakukan pengecekan untuk keamanan.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$towers[5]->latitude + 0.0005,
            'reporter_longitude' => (float)$towers[5]->longitude - 0.0005,
            'reporter_accuracy' => 6.5,
            'location_captured_at' => now()->subDays(12),
            'is_public' => false,
        ]);
        // Closed: diskusi admin-reporter
        ReportResponse::create([
            'report_id' => $complainantReport2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas laporannya. Tim kami akan segera melakukan pengecekan dan perbaikan kabel yang kendur.',
            'created_at' => now()->subDays(11),
        ]);
        ReportResponse::create([
            'report_id' => $complainantReport2->id,
            'user_id' => $complainantUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $complainantUser->name,
            'sender_email' => $complainantUser->email,
            'sender_phone' => '081234567893',
            'message' => 'Baik, terima kasih. Saya akan menunggu update dari tim.',
            'created_at' => now()->subDays(10),
        ]);
        ReportResponse::create([
            'report_id' => $complainantReport2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Update: Kabel sudah diperbaiki dan diperketat. Tower sudah aman untuk digunakan. Terima kasih atas laporannya.',
            'created_at' => now()->subDays(5),
        ]);

        // ===== COMPLAINANT FEEDBACKS =====

        // 7. Complainant Feedback: Public, Closed (diskusi aktif dengan komentar)
        $complainantFeedback1 = Feedback::create([
            'tower_id' => $towers[0]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678903',
            'category' => 'Kritik Konstruktif',
            'message' => 'Proses pembangunan tower kurang koordinasi dengan warga sekitar. Sebaiknya ada sosialisasi terlebih dahulu sebelum pembangunan dimulai.',
            'status' => 'closed',
            'reporter_latitude' => (float)$towers[0]->latitude - 0.0012,
            'reporter_longitude' => (float)$towers[0]->longitude + 0.0008,
            'reporter_accuracy' => 2.8,
            'location_captured_at' => now()->subDays(15),
            'is_public' => true,
        ]);
        // Closed: diskusi admin-reporter
        FeedbackResponse::create([
            'feedback_id' => $complainantFeedback1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas masukannya. Kami akan memperbaiki proses koordinasi dan sosialisasi untuk pembangunan tower selanjutnya.',
            'created_at' => now()->subDays(14),
        ]);
        FeedbackResponse::create([
            'feedback_id' => $complainantFeedback1->id,
            'user_id' => $complainantUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $complainantUser->name,
            'sender_email' => $complainantUser->email,
            'sender_phone' => '082345678903',
            'message' => 'Terima kasih atas perhatiannya. Saya yakin dengan koordinasi yang lebih baik, proses pembangunan akan lebih lancar.',
            'created_at' => now()->subDays(13),
        ]);
        // Komentar aktif dari berbagai role
        PublicComment::create([
            'commentable_type' => Feedback::class,
            'commentable_id' => $complainantFeedback1->id,
            'parent_id' => null,
            'user_id' => $towerOwnerUser->id,
            'guest_name' => null,
            'guest_email' => null,
            'guest_phone' => null,
            'message' => 'Setuju sekali. Sosialisasi sangat penting untuk menghindari konflik dengan warga.',
            'is_approved' => true,
            'created_at' => now()->subDays(12),
        ]);
        PublicComment::create([
            'commentable_type' => Feedback::class,
            'commentable_id' => $complainantFeedback1->id,
            'parent_id' => null,
            'user_id' => null,
            'guest_name' => 'Warga Setempat',
            'guest_email' => 'warga@example.com',
            'guest_phone' => '081111111111',
            'message' => 'Saya juga merasakan hal yang sama. Semoga ke depannya lebih baik.',
            'is_approved' => true,
            'created_at' => now()->subDays(11),
        ]);

        // 8. Complainant Feedback: Private, In Progress (admin sudah merespons)
        $complainantFeedback2 = Feedback::create([
            'tower_id' => $towers[1]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678904',
            'category' => 'Usulan Fitur',
            'message' => 'Bagaimana kalau tower ini dilengkapi dengan speaker untuk sistem peringatan dini bencana? Akan sangat bermanfaat untuk masyarakat.',
            'status' => 'in_progress',
            'reporter_latitude' => (float)$towers[1]->latitude + 0.0006,
            'reporter_longitude' => (float)$towers[1]->longitude + 0.0014,
            'reporter_accuracy' => 5.9,
            'location_captured_at' => now()->subDays(6),
            'is_public' => false,
        ]);
        // In Progress: admin sudah merespons
        FeedbackResponse::create([
            'feedback_id' => $complainantFeedback2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Usulan yang sangat bagus. Kami akan mempertimbangkan untuk menambahkan fitur speaker peringatan dini bencana pada tower ini.',
            'created_at' => now()->subDays(5),
        ]);

        // ===== TOWER OWNER REPORTS =====

        // 9. Tower Owner Report: Public, Closed (diskusi aktif dengan komentar)
        $towerOwnerReport1 = Report::create([
            'tower_id' => $towers[2]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'reporter_name' => $towerOwnerUser->name,
            'reporter_phone' => '081234567894',
            'category' => 'Lainnya',
            'message' => 'Pagar pembatas tower rusak dan terbuka, anak-anak bisa masuk ke area tower. Sangat berbahaya, mohon segera diperbaiki.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$towers[2]->latitude + 0.0015,
            'reporter_longitude' => (float)$towers[2]->longitude - 0.0015,
            'reporter_accuracy' => 7.2,
            'location_captured_at' => now()->subDays(14),
            'is_public' => true,
        ]);
        // Closed: diskusi admin-reporter
        ReportResponse::create([
            'report_id' => $towerOwnerReport1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas laporannya. Tim kami akan segera memperbaiki pagar pembatas untuk keamanan area tower.',
            'created_at' => now()->subDays(13),
        ]);
        ReportResponse::create([
            'report_id' => $towerOwnerReport1->id,
            'user_id' => $towerOwnerUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $towerOwnerUser->name,
            'sender_email' => $towerOwnerUser->email,
            'sender_phone' => '081234567894',
            'message' => 'Baik, terima kasih. Saya akan menunggu update perbaikan.',
            'created_at' => now()->subDays(12),
        ]);
        ReportResponse::create([
            'report_id' => $towerOwnerReport1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Update: Pagar sudah diperbaiki dan dikunci dengan baik. Area tower sekarang sudah aman. Terima kasih atas laporannya.',
            'created_at' => now()->subDays(8),
        ]);
        // Komentar aktif dari berbagai role
        PublicComment::create([
            'commentable_type' => Report::class,
            'commentable_id' => $towerOwnerReport1->id,
            'parent_id' => null,
            'user_id' => $complainantUser->id,
            'guest_name' => null,
            'guest_email' => null,
            'guest_phone' => null,
            'message' => 'Bagus sekali, keamanan area tower memang sangat penting untuk mencegah anak-anak masuk.',
            'is_approved' => true,
            'created_at' => now()->subDays(11),
        ]);
        PublicComment::create([
            'commentable_type' => Report::class,
            'commentable_id' => $towerOwnerReport1->id,
            'parent_id' => null,
            'user_id' => null,
            'guest_name' => 'Warga Sekitar',
            'guest_email' => 'warga2@example.com',
            'guest_phone' => '081222222222',
            'message' => 'Saya juga khawatir dengan kondisi pagar yang rusak. Terima kasih sudah dilaporkan.',
            'is_approved' => true,
            'created_at' => now()->subDays(10),
        ]);

        // 10. Tower Owner Report: Private, Pending (baru dibuat)
        Report::create([
            'tower_id' => $towers[3]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'reporter_name' => $towerOwnerUser->name,
            'reporter_phone' => '081234567895',
            'category' => 'Kerusakan',
            'message' => 'Ada kabel yang terlihat putus di bagian bawah tower. Perlu segera diperbaiki untuk mencegah gangguan sinyal.',
            'status_id' => $pendingStatus->id,
            'reporter_latitude' => (float)$towers[3]->latitude - 0.0009,
            'reporter_longitude' => (float)$towers[3]->longitude - 0.0011,
            'reporter_accuracy' => 6.1,
            'location_captured_at' => now()->subHours(12),
            'is_public' => false,
        ]);
        // Pending: tidak ada response

        // ===== TOWER OWNER FEEDBACKS =====

        // 11. Tower Owner Feedback: Public, Pending (baru dibuat)
        Feedback::create([
            'tower_id' => $towers[4]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'sender_name' => $towerOwnerUser->name,
            'sender_phone' => '082345678905',
            'category' => 'Apresiasi',
            'message' => 'Terima kasih sudah membangun tower ini, sinyal internet di kampung kami jadi lebih baik. Sangat membantu untuk belajar online.',
            'status' => 'pending',
            'reporter_latitude' => (float)$towers[4]->latitude + 0.0013,
            'reporter_longitude' => (float)$towers[4]->longitude - 0.0019,
            'reporter_accuracy' => 5.3,
            'location_captured_at' => now()->subDays(3),
            'is_public' => true,
        ]);
        // Pending: tidak ada response dan comment

        // 12. Tower Owner Feedback: Private, Closed (diskusi admin-reporter)
        $towerOwnerFeedback2 = Feedback::create([
            'tower_id' => $towers[5]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'sender_name' => $towerOwnerUser->name,
            'sender_phone' => '082345678906',
            'category' => 'Lainnya',
            'message' => 'Apakah ada rencana untuk meningkatkan kapasitas tower ini? Akhir-akhir ini sinyal sering lambat saat jam sibuk.',
            'status' => 'closed',
            'reporter_latitude' => (float)$towers[5]->latitude - 0.0016,
            'reporter_longitude' => (float)$towers[5]->longitude + 0.0007,
            'reporter_accuracy' => 4.7,
            'location_captured_at' => now()->subDays(9),
            'is_public' => false,
        ]);
        // Closed: diskusi admin-reporter
        FeedbackResponse::create([
            'feedback_id' => $towerOwnerFeedback2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Terima kasih atas masukannya. Kami akan mengevaluasi kapasitas tower dan merencanakan upgrade jika diperlukan.',
            'created_at' => now()->subDays(8),
        ]);
        FeedbackResponse::create([
            'feedback_id' => $towerOwnerFeedback2->id,
            'user_id' => $towerOwnerUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $towerOwnerUser->name,
            'sender_email' => $towerOwnerUser->email,
            'sender_phone' => '082345678906',
            'message' => 'Baik, terima kasih. Saya akan menunggu update dari tim.',
            'created_at' => now()->subDays(7),
        ]);
        FeedbackResponse::create([
            'feedback_id' => $towerOwnerFeedback2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Update: Rencana upgrade kapasitas sudah disetujui dan akan dilakukan dalam 2 bulan ke depan. Terima kasih atas masukan Anda.',
            'created_at' => now()->subDays(4),
        ]);

        $this->command->info('✓ Reports dan Feedbacks berhasil di-seed!');
        $this->command->info("  - 6 Reports dibuat (2 Guest, 2 Complainant, 2 Tower Owner)");
        $this->command->info("  - 6 Feedbacks dibuat (2 Guest, 2 Complainant, 2 Tower Owner)");
        $this->command->info("  - Setiap role memiliki 1 public dan 1 private untuk report dan feedback");
        $this->command->info("  - Status pending: tidak ada response/comment");
        $this->command->info("  - Status in_progress: ada response dari admin, ada komentar dari role lain");
        $this->command->info("  - Status closed: diskusi admin-reporter, komentar aktif dari berbagai role");
    }
}