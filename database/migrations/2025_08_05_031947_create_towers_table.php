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
            $table->string('site_name');
            $table->decimal('longitude', 15, 8)->nullable();
            $table->decimal('latitude', 15, 8)->nullable();
            $table->float('tinggi_menara')->nullable();
            $table->float('tinggi_bangunan')->nullable();
            $table->integer('jumlah_pengguna')->nullable();
            $table->integer('jumlah_kaki')->nullable();
            $table->text('alamat_menara');
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
