<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('towers', function (Blueprint $table) {
            $table->id();
            $table->string('site_id')->nullable();
            $table->string('site_sap')->nullable();
            $table->string('site_name')->nullable();
            $table->decimal('longitude', 15, 8)->nullable();
            $table->decimal('latitude', 15, 8)->nullable();
            $table->float('tinggi_menara')->nullable();
            $table->float('tinggi_bangunan')->nullable();
            $table->integer('jumlah_pengguna')->nullable();
            $table->integer('jumlah_kaki')->nullable();
            $table->text('alamat_menara');

            /*
             * The district a tower stands in.
             *
             * The table had nothing administrative besides free-text
             * `alamat_menara`, so "how many districts are covered" — the one
             * geographic figure a resident recognises about their own regency —
             * could not be answered by any query. The landing page needs it, and
             * so does any future per-district filter or choropleth.
             *
             * Nullable on purpose: a tower whose coordinates were never recorded
             * has no district either, and the seeder deliberately creates a batch
             * of those to keep the "Belum Terdata" paths exercised.
             *
             * Values come from App\Support\KecamatanSemarang, which is also where
             * the assignment rule and its limits are written down.
             */
            $table->string('kecamatan')->nullable();

            $table->string('tower_type')->nullable();
            $table->string('site_type')->nullable();
            $table->string('no_ijin')->nullable();
            $table->date('tanggal_ijin')->nullable();
            $table->date('berlaku_hingga')->nullable();
            $table->string('jenis_ijin')->nullable();
            $table->string('status_ijin')->nullable();
            $table->string('prs')->nullable();
            $table->string('prs_id')->nullable();
            $table->timestamps();

            /*
             * INDEXES — the columns the public pages actually filter on.
             *
             * Three queries on the two busiest public routes would otherwise
             * scan the whole table on every request:
             *
             *   kecamatan    LandingController counts distinct districts.
             *   status_ijin  LandingController counts active permits, and
             *                TowerController repeats the same count for its
             *                stats row.
             *   lat + lng    both the landing map and /data-tower select only
             *                towers with usable coordinates, using the same
             *                four-part guard (NOT NULL and != 0 on each).
             *
             * At a few hundred seeded rows a full scan is free and none of this
             * is measurable. It stops being free somewhere in the low thousands,
             * which is the size a regency-wide register reaches once real permit
             * data is imported — and by then these queries sit in the hot path
             * of the two pages a resident actually opens.
             *
             * (latitude, longitude) is composite rather than two separate
             * indexes because the filter always names both, so one index can
             * serve the whole predicate.
             */
            $table->index('kecamatan');
            $table->index('status_ijin');
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('towers');
    }
};
