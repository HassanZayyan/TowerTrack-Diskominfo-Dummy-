<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Tower;
use App\Models\FoPoint;
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

        // Get existing FoPoints from database
        $foPoints = FoPoint::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', 0)
            ->where('longitude', '!=', 0)
            ->where('status', 'active')
            ->limit(4)
            ->get();

        if ($foPoints->count() < 4) {
            $this->command->error('❌ Tidak cukup FoPoint dengan koordinat di database!');
            $this->command->error('   Minimal 4 FoPoint dengan koordinat dan status aktif diperlukan.');
            $this->command->error('   Jalankan FoPointsFromCsvSeeder terlebih dahulu: php artisan db:seed --class=FoPointsFromCsvSeeder');
            return;
        }

        $this->command->info("✓ Menggunakan {$towers->count()} tower dari database");
        $this->command->info("✓ Menggunakan {$foPoints->count()} FoPoint dari database");

        // Check if seeder has already been run
        if (Report::where('email', 'siti.nurhaliza@gmail.com')->exists() || 
            Feedback::where('email', 'dewi.lestari98@gmail.com')->exists()) {
            $this->command->warn('⚠ Seeder sudah pernah dijalankan sebelumnya.');
            $this->command->info('  Untuk menjalankan ulang, hapus data reports dan feedbacks terlebih dahulu.');
            return;
        }

        // ===== GUEST REPORTS (SEMUA PUBLIC) =====
        
        // 1. Guest Report (Tower): Public, Pending (baru dibuat, belum ada response/comment)
        $guestReport1 = Report::create([
            'reportable_type' => Tower::class,
            'reportable_id' => $towers[0]->id,
            'user_id' => null,
            'email' => 'siti.nurhaliza@gmail.com',
            'reporter_name' => 'Siti Nurhaliza',
            'reporter_phone' => '081234567890',
            'category' => 'Kerusakan',
            'message' => 'Lampu penerangan tower tidak menyala sejak kemarin malam. Saya khawatir akan mengganggu keselamatan penerbangan di sekitar area ini. Mohon diperbaiki secepatnya.',
            'status_id' => $pendingStatus->id,
            'reporter_latitude' => (float)$towers[0]->latitude + 0.0008,
            'reporter_longitude' => (float)$towers[0]->longitude + 0.0009,
            'reporter_accuracy' => 5.5,
            'location_captured_at' => now()->subHours(6),
            'is_public' => true, // Guest selalu public
            'email_verified_at' => now()->subHours(6),
        ]);
        // Pending: tidak ada response dan comment

        // 2. Guest Report (Fiber Optik): Public, Closed (sudah selesai, ada diskusi admin-reporter)
        $guestReport2 = Report::create([
            'reportable_type' => FoPoint::class,
            'reportable_id' => $foPoints[0]->id,
            'user_id' => null,
            'email' => 'budi.santoso123@gmail.com',
            'reporter_name' => 'Budi Santoso',
            'reporter_phone' => '081345678912',
            'category' => 'Kerusakan',
            'message' => 'Saya menemukan tiang fiber optik di jalan ini mengalami kerusakan. Kabel-kabel yang menggantung terlihat kendur dan beberapa bahkan sudah menyentuh tanah. Kondisi ini cukup berbahaya karena bisa menyebabkan gangguan komunikasi dan juga berpotensi mencelakakan pengguna jalan, terutama pengendara motor. Mohon segera dilakukan perbaikan untuk keamanan dan kelancaran layanan komunikasi.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$foPoints[0]->latitude - 0.0007,
            'reporter_longitude' => (float)$foPoints[0]->longitude + 0.0012,
            'reporter_accuracy' => 8.1,
            'location_captured_at' => now()->subDays(10),
            'is_public' => true, // Guest selalu public
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
            'sender_email' => 'budi.santoso123@gmail.com',
            'sender_phone' => '081345678912',
            'message' => 'Terima kasih atas responsenya. Kapan kira-kira tim akan melakukan pengecekan? Dan apakah ada solusi sementara yang bisa dilakukan?',
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

        // ===== GUEST FEEDBACKS (SEMUA PUBLIC) =====

        // 3. Guest Feedback (Fiber Optik): Public, In Progress (admin sudah merespons)
        $guestFeedback1 = Feedback::create([
            'feedbackable_type' => FoPoint::class,
            'feedbackable_id' => $foPoints[1]->id,
            'user_id' => null,
            'email' => 'dewi.lestari98@gmail.com',
            'sender_name' => 'Dewi Lestari',
            'sender_phone' => '082345678901',
            'category' => 'Kritik Konstruktif',
            'message' => 'Saya tinggal di sekitar tiang fiber optik ini dan ingin memberikan saran. Tolong pasang penanda yang lebih jelas dan terlihat pada tiang, karena banyak pengguna jalan yang tidak menyadari keberadaannya. Selain itu, sebaiknya ditambahkan pelindung atau casing yang lebih kuat untuk kabel-kabel yang terpasang agar lebih aman dari gangguan cuaca atau hewan. Lampu penerangan di sekitar area tiang juga perlu ditambahkan untuk keselamatan pengguna jalan di malam hari.',
            'status_id' => $inProgressStatus->id,
            'sender_latitude' => (float)$foPoints[1]->latitude + 0.0008,
            'sender_longitude' => (float)$foPoints[1]->longitude + 0.0012,
            'sender_accuracy' => 4.3,
            'location_captured_at' => now()->subDays(5),
            'is_public' => true, // Guest selalu public
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
            'message' => 'Terima kasih atas saran dan masukan yang sangat konstruktif. Kami sangat menghargai perhatian Anda terhadap keselamatan warga. Tim kami akan segera menindaklanjuti dengan melakukan survei lokasi dan memasang penanda keselamatan yang lebih jelas serta menambah lampu penerangan yang lebih terang di malam hari.',
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
            'message' => 'Setuju sekali dengan saran ini. Saya juga tinggal di sekitar area tower dan merasakan pentingnya lampu penerangan yang lebih terang untuk keselamatan, terutama saat malam hari. Anak-anak sering bermain di sekitar sini.',
            'is_approved' => true,
            'created_at' => now()->subDays(3),
        ]);

        // 4. Guest Feedback (Tower): Public, Pending (baru dibuat)
        Feedback::create([
            'feedbackable_type' => Tower::class,
            'feedbackable_id' => $towers[2]->id,
            'user_id' => null,
            'email' => 'fajar.ramadhan99@gmail.com',
            'sender_name' => 'Fajar Ramadhan',
            'sender_phone' => '083456789012',
            'category' => 'Apresiasi',
            'message' => 'Saya sangat berterima kasih dengan adanya tower ini di lingkungan kami. Sinyal internet menjadi lebih stabil dan cepat, sangat membantu untuk bekerja dari rumah dan anak-anak belajar online. Semoga tower ini tetap terjaga dengan baik.',
            'status_id' => $pendingStatus->id,
            'sender_latitude' => (float)$towers[2]->latitude + 0.0011,
            'sender_longitude' => (float)$towers[2]->longitude - 0.0006,
            'sender_accuracy' => 7.2,
            'location_captured_at' => now()->subHours(12),
            'is_public' => true, // Guest selalu public
            'email_verified_at' => now()->subHours(12),
        ]);
        // Pending: tidak ada response

        // ===== COMPLAINANT REPORTS =====

        // 5. Complainant Report (Tower): Public, In Progress (admin sudah merespons, ada komentar)
        $complainantReport1 = Report::create([
            'reportable_type' => Tower::class,
            'reportable_id' => $towers[3]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567892',
            'category' => 'Gangguan Sinyal',
            'message' => 'Sejak tower ini mulai beroperasi sekitar 2 minggu lalu, sinyal TV di rumah saya menjadi tidak stabil. Kadang gambar terputus-putus dan suara menjadi tidak jelas. Saya sudah mencoba mengatur ulang antena tapi masih tetap bermasalah. Mohon bantuan untuk mengatasi gangguan ini.',
            'status_id' => $inProgressStatus->id,
            'reporter_latitude' => (float)$towers[3]->latitude + 0.0015,
            'reporter_longitude' => (float)$towers[3]->longitude - 0.0008,
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
            'message' => 'Terima kasih atas laporannya. Kami memahami keluhan Anda mengenai gangguan sinyal TV. Tim teknis kami akan melakukan pengecekan dan koordinasi dengan Anda dalam 2-3 hari kerja. Kami akan menghubungi nomor telepon yang terdaftar untuk mengatur jadwal kunjungan.',
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

        // 6. Complainant Report (Fiber Optik): Private, Closed (diskusi admin-reporter)
        $complainantReport2 = Report::create([
            'reportable_type' => FoPoint::class,
            'reportable_id' => $foPoints[2]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'reporter_name' => $complainantUser->name,
            'reporter_phone' => '081234567893',
            'category' => 'Kerusakan',
            'message' => 'Saya menemukan beberapa kabel fiber optik di tiang ini yang terlihat kendur dan ada yang sudah terputus. Kabel-kabel tersebut menggantung tidak rapi dan beberapa bagian bahkan sudah menyentuh tanah. Kondisi ini cukup mengkhawatirkan karena bisa menyebabkan gangguan komunikasi internet dan juga berpotensi mencelakakan pengguna jalan, terutama saat malam hari. Mohon dilakukan pengecekan dan perbaikan secepatnya untuk menghindari risiko gangguan layanan dan kecelakaan.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$foPoints[2]->latitude + 0.0005,
            'reporter_longitude' => (float)$foPoints[2]->longitude - 0.0005,
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
            'message' => 'Terima kasih atas laporan yang detail ini. Kami sangat menghargai perhatian Anda terhadap keselamatan. Tim teknis kami akan segera melakukan pengecekan menyeluruh terhadap kabel-kabel yang kendur dan melakukan perbaikan yang diperlukan. Kami akan mengutamakan keamanan tower dan lingkungan sekitarnya.',
            'created_at' => now()->subDays(11),
        ]);
        ReportResponse::create([
            'report_id' => $complainantReport2->id,
            'user_id' => $complainantUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $complainantUser->name,
            'sender_email' => $complainantUser->email,
            'sender_phone' => '081234567893',
            'message' => 'Baik, terima kasih atas responsenya. Saya akan menunggu hasil pengecekan dan update perbaikan dari tim. Semoga masalahnya bisa segera ditangani untuk keamanan semua pihak.',
            'created_at' => now()->subDays(10),
        ]);
        ReportResponse::create([
            'report_id' => $complainantReport2->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Update: Pengecekan dan perbaikan telah selesai dilakukan. Semua kabel yang kendur sudah diperbaiki dan diperketat sesuai standar. Tower sudah dinyatakan aman untuk digunakan. Tim juga telah melakukan pengecekan menyeluruh pada struktur tower lainnya. Terima kasih atas laporan dan kerjasamanya.',
            'created_at' => now()->subDays(5),
        ]);

        // ===== COMPLAINANT FEEDBACKS =====

        // 7. Complainant Feedback (Fiber Optik): Public, Closed (diskusi aktif dengan komentar)
        $complainantFeedback1 = Feedback::create([
            'feedbackable_type' => FoPoint::class,
            'feedbackable_id' => $foPoints[3]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678903',
            'category' => 'Kritik Konstruktif',
            'message' => 'Saya ingin memberikan masukan mengenai pemasangan dan pemeliharaan tiang fiber optik di area ini. Menurut saya, proses pemasangan kurang melakukan koordinasi dengan warga sekitar dan dinas terkait. Banyak warga yang baru tahu setelah pemasangan sudah dimulai, sehingga menimbulkan keresahan. Untuk ke depannya, sebaiknya dilakukan sosialisasi terlebih dahulu sebelum pemasangan dimulai agar warga bisa memahami manfaat dan tidak merasa dikagetkan. Selain itu, perlu juga dilakukan pemeliharaan rutin terhadap tiang dan kabel-kabel yang terpasang agar tidak mengganggu aktivitas warga.',
            'status_id' => $closedStatus->id,
            'sender_latitude' => (float)$foPoints[3]->latitude - 0.0012,
            'sender_longitude' => (float)$foPoints[3]->longitude + 0.0008,
            'sender_accuracy' => 2.8,
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
            'message' => 'Terima kasih atas masukan dan kritik konstruktif Anda. Kami sangat menghargai feedback ini dan akan menjadikannya sebagai pembelajaran. Kami akan memperbaiki proses koordinasi dengan warga sekitar dan melakukan sosialisasi lebih awal sebelum pemasangan dimulai untuk pemasangan fiber optik selanjutnya. Kami juga akan membuat mekanisme komunikasi yang lebih baik dengan masyarakat sekitar dan meningkatkan program pemeliharaan rutin untuk menjaga kondisi tiang dan kabel fiber optik.',
            'created_at' => now()->subDays(14),
        ]);
        FeedbackResponse::create([
            'feedback_id' => $complainantFeedback1->id,
            'user_id' => $complainantUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $complainantUser->name,
            'sender_email' => $complainantUser->email,
            'sender_phone' => '082345678903',
            'message' => 'Terima kasih banyak atas respons yang cepat dan perhatiannya. Saya yakin dengan koordinasi dan komunikasi yang lebih baik, proses pemasangan fiber optik selanjutnya akan berjalan lebih lancar dan tidak menimbulkan keresahan di masyarakat. Semoga kolaborasi yang lebih baik ini bisa terwujud.',
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
            'message' => 'Setuju sekali dengan masukan ini. Sebagai pihak yang terlibat dalam infrastruktur komunikasi, kami juga merasakan pentingnya sosialisasi dan komunikasi yang baik dengan warga sekitar sejak awal. Hal ini sangat penting untuk membangun kepercayaan dan menghindari konflik yang tidak perlu di kemudian hari.',
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
            'message' => 'Sebagai warga yang tinggal di sekitar area ini, saya juga merasakan hal yang sama. Awalnya sempat khawatir karena tidak ada informasi sebelumnya tentang pemasangan tiang fiber optik. Semoga ke depannya proses sosialisasi bisa dilakukan lebih baik sehingga warga bisa lebih siap dan memahami manfaat dari infrastruktur komunikasi ini.',
            'is_approved' => true,
            'created_at' => now()->subDays(11),
        ]);

        // 8. Complainant Feedback (Tower): Private, In Progress (admin sudah merespons)
        $complainantFeedback2 = Feedback::create([
            'feedbackable_type' => Tower::class,
            'feedbackable_id' => $towers[4]->id,
            'user_id' => $complainantUser->id,
            'email' => $complainantUser->email,
            'sender_name' => $complainantUser->name,
            'sender_phone' => '082345678904',
            'category' => 'Usulan Fitur',
            'message' => 'Bagaimana kalau tower ini dilengkapi dengan speaker untuk sistem peringatan dini bencana? Akan sangat bermanfaat untuk masyarakat.',
            'status_id' => $inProgressStatus->id,
            'sender_latitude' => (float)$towers[4]->latitude + 0.0006,
            'sender_longitude' => (float)$towers[4]->longitude + 0.0014,
            'sender_accuracy' => 5.9,
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
            'reportable_type' => Tower::class,
            'reportable_id' => $towers[5]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'reporter_name' => $towerOwnerUser->name,
            'reporter_phone' => '081234567894',
            'category' => 'Lainnya',
            'message' => 'Saya sebagai pengelola tower ini ingin melaporkan bahwa pagar pembatas di sekitar tower kami mengalami kerusakan. Beberapa bagian pagar sudah terbuka dan longgar, sehingga anak-anak dari sekitar bisa masuk ke area tower dengan mudah. Ini sangat berbahaya mengingat tower memiliki peralatan listrik dan struktur yang tinggi. Mohon segera dilakukan perbaikan untuk keamanan masyarakat sekitar.',
            'status_id' => $closedStatus->id,
            'reporter_latitude' => (float)$towers[5]->latitude + 0.0015,
            'reporter_longitude' => (float)$towers[5]->longitude - 0.0015,
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
            'message' => 'Terima kasih atas laporan yang sangat penting ini. Kami sangat menghargai perhatian Anda terhadap keselamatan masyarakat. Tim teknis kami akan segera melakukan pengecekan dan memperbaiki pagar pembatas yang rusak. Perbaikan akan dilakukan dalam 3-5 hari kerja dan kami akan memberikan update setelah selesai.',
            'created_at' => now()->subDays(13),
        ]);
        ReportResponse::create([
            'report_id' => $towerOwnerReport1->id,
            'user_id' => $towerOwnerUser->id,
            'sender_type' => 'reporter',
            'sender_name' => $towerOwnerUser->name,
            'sender_email' => $towerOwnerUser->email,
            'sender_phone' => '081234567894',
            'message' => 'Baik, terima kasih atas responsenya. Saya akan menunggu update perbaikan dan akan memantau kondisi pagar hingga selesai diperbaiki. Jika ada perkembangan lebih lanjut, tolong informasikan kepada saya.',
            'created_at' => now()->subDays(12),
        ]);
        ReportResponse::create([
            'report_id' => $towerOwnerReport1->id,
            'user_id' => $adminUser->id,
            'sender_type' => 'staff',
            'sender_name' => $adminUser->name,
            'sender_email' => $adminUser->email,
            'sender_phone' => null,
            'message' => 'Update: Perbaikan pagar telah selesai dilakukan. Semua bagian yang rusak sudah diperbaiki, pagar dikunci dengan baik, dan area tower sekarang sudah aman. Tim juga telah menambahkan tanda peringatan keselamatan di beberapa titik. Terima kasih atas laporan dan kerjasamanya.',
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
            'message' => 'Bagus sekali, saya setuju bahwa keamanan area tower memang sangat penting. Sebagai warga yang tinggal di sekitar, saya juga khawatir dengan anak-anak yang sering bermain di area tersebut. Semoga dengan perbaikan pagar ini, area tower menjadi lebih aman dan terlindungi.',
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
            'message' => 'Sebagai warga yang tinggal di sekitar tower, saya juga sempat khawatir dengan kondisi pagar yang rusak. Sering melihat anak-anak bermain di dekat area tersebut dan itu cukup mengkhawatirkan. Terima kasih sudah melaporkan masalah ini, semoga cepat diperbaiki.',
            'is_approved' => true,
            'created_at' => now()->subDays(10),
        ]);

        // 10. Tower Owner Report: Private, Pending (baru dibuat)
        Report::create([
            'reportable_type' => Tower::class,
            'reportable_id' => $towers[1]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'reporter_name' => $towerOwnerUser->name,
            'reporter_phone' => '081234567895',
            'category' => 'Kerusakan',
            'message' => 'Saya menemukan ada beberapa kabel di bagian bawah tower yang terlihat putus dan terkelupas. Kabel-kabel tersebut terlihat tidak terhubung dengan baik dan ada beberapa yang menggantung. Kondisi ini berpotensi menyebabkan gangguan sinyal dan juga bisa berbahaya jika terkena air hujan. Mohon dilakukan pengecekan dan perbaikan secepatnya.',
            'status_id' => $pendingStatus->id,
            'reporter_latitude' => (float)$towers[1]->latitude - 0.0009,
            'reporter_longitude' => (float)$towers[1]->longitude - 0.0011,
            'reporter_accuracy' => 6.1,
            'location_captured_at' => now()->subHours(12),
            'is_public' => false,
        ]);
        // Pending: tidak ada response

        // ===== TOWER OWNER FEEDBACKS =====

        // 11. Tower Owner Feedback: Public, Pending (baru dibuat)
        Feedback::create([
            'feedbackable_type' => Tower::class,
            'feedbackable_id' => $towers[0]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'sender_name' => $towerOwnerUser->name,
            'sender_phone' => '082345678905',
            'category' => 'Apresiasi',
            'message' => 'Saya ingin mengucapkan terima kasih yang sebesar-besarnya kepada pihak yang membangun dan mengelola tower ini. Sejak tower ini beroperasi, sinyal internet di kampung kami menjadi jauh lebih stabil dan cepat. Ini sangat membantu sekali, terutama untuk anak-anak yang harus belajar online dan untuk orang tua yang bekerja dari rumah. Semoga tower ini tetap terpelihara dengan baik dan terus memberikan manfaat untuk masyarakat.',
            'status_id' => $pendingStatus->id,
            'sender_latitude' => (float)$towers[0]->latitude + 0.0013,
            'sender_longitude' => (float)$towers[0]->longitude - 0.0019,
            'sender_accuracy' => 5.3,
            'location_captured_at' => now()->subDays(3),
            'is_public' => true,
        ]);
        // Pending: tidak ada response dan comment

        // 12. Tower Owner Feedback: Private, Closed (diskusi admin-reporter)
        $towerOwnerFeedback2 = Feedback::create([
            'feedbackable_type' => Tower::class,
            'feedbackable_id' => $towers[5]->id,
            'user_id' => $towerOwnerUser->id,
            'email' => $towerOwnerUser->email,
            'sender_name' => $towerOwnerUser->name,
            'sender_phone' => '082345678906',
            'category' => 'Lainnya',
            'message' => 'Saya ingin bertanya apakah ada rencana untuk meningkatkan kapasitas atau upgrade tower ini? Akhir-akhir ini, terutama pada jam sibuk (pagi dan sore hari), sinyal sering terasa lambat dan kadang tidak stabil. Sepertinya jumlah pengguna yang menggunakan tower ini sudah semakin banyak. Jika memungkinkan, mohon dipertimbangkan untuk upgrade kapasitas agar layanan tetap optimal untuk semua pengguna.',
            'status_id' => $closedStatus->id,
            'sender_latitude' => (float)$towers[5]->latitude - 0.0016,
            'sender_longitude' => (float)$towers[5]->longitude + 0.0007,
            'sender_accuracy' => 4.7,
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
            'message' => 'Terima kasih atas masukan yang sangat berharga ini. Kami memahami keluhan Anda mengenai penurunan kualitas sinyal pada jam sibuk. Tim teknis kami akan melakukan evaluasi kapasitas tower dan menganalisis traffic data untuk menentukan apakah memang diperlukan upgrade. Jika diperlukan, kami akan merencanakan upgrade kapasitas dan memberikan update lebih lanjut.',
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
            'message' => 'Update: Setelah melakukan evaluasi mendalam, kami menginformasikan bahwa rencana upgrade kapasitas tower sudah disetujui dan akan dilakukan dalam 2 bulan ke depan. Upgrade ini akan meningkatkan kapasitas tower dan diharapkan dapat mengatasi masalah sinyal yang lambat pada jam sibuk. Kami akan memberikan update lagi ketika proses upgrade dimulai. Terima kasih atas masukan dan kesabaran Anda.',
            'created_at' => now()->subDays(4),
        ]);

        $this->command->info('✓ Reports dan Feedbacks berhasil di-seed!');
        $this->command->info("  - 6 Reports dibuat (2 Guest, 2 Complainant, 2 Tower Owner)");
        $this->command->info("    * Variasi: 4 Tower, 2 Fiber Optik");
        $this->command->info("  - 6 Feedbacks dibuat (2 Guest, 2 Complainant, 2 Tower Owner)");
        $this->command->info("    * Variasi: 4 Tower, 2 Fiber Optik");
        $this->command->info("  - Semua Guest messages adalah PUBLIC (tidak ada private messages untuk guest)");
        $this->command->info("  - Complainant & Tower Owner memiliki kombinasi public dan private");
        $this->command->info("  - Status pending: baru dibuat, belum ada response");
        $this->command->info("  - Status in_progress: admin sudah merespons, ada interaksi");
        $this->command->info("  - Status closed: sudah selesai dengan diskusi lengkap");
    }
}