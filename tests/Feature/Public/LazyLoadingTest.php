<?php

use App\Models\FoRoute;
use App\Models\Owner;
use App\Models\Tower;
use Illuminate\Database\Eloquent\Model;

/**
 * N+1 guard for the public pages.
 *
 * `preventLazyLoading` makes Eloquent throw the moment a relation is read
 * without having been eager-loaded. That turns the classic N+1 — a page that
 * quietly fires one query per row and only hurts once the table is big — into a
 * hard failure here, where it is cheap to fix.
 *
 * These three routes are the ones that render lists built from relations:
 * /data-tower reads every tower's owners, / aggregates the same for the landing
 * map, and /data-fo walks routes and their points.
 */
beforeEach(function () {
    Model::preventLazyLoading();

    $owner = Owner::create(['name' => 'PT Uji Menara', 'alamat' => 'Jl. Uji']);

    foreach (range(1, 5) as $i) {
        $tower = Tower::create([
            'site_id' => "SITE{$i}",
            'site_name' => "Tower {$i}",
            'latitude' => -7.14 - $i * 0.01,
            'longitude' => 110.40 + $i * 0.01,
            'tinggi_menara' => 40 + $i,
            'alamat_menara' => "Jl. Uji {$i}",
            'kecamatan' => 'Ungaran Barat',
            'status_ijin' => 'Aktif',
        ]);
        $tower->owners()->attach($owner->id);
    }

    FoRoute::create([
        'name' => 'Jalur Uji',
        'area' => 'ungaran',
        'status' => 'active',
        'total_distance' => 1.2,
        'total_points' => 3,
        // NOT NULL in the schema.
        'path_coordinates' => [[-7.14, 110.40], [-7.15, 110.41]],
    ]);
});

afterEach(function () {
    Model::preventLazyLoading(false);
});

test('the landing page loads without a lazy-loaded relation', function () {
    $this->get('/')->assertOk();
});

test('the tower page loads without a lazy-loaded relation', function () {
    $this->get('/data-tower')->assertOk();
});

test('the fibre page loads without a lazy-loaded relation', function () {
    $this->get('/data-fo?area=ungaran')->assertOk();
});

test('a route created without a colour does not come out stock Tailwind blue', function () {
    // Guards a one-word change inside a large create-table migration: the
    // `fo_routes.color` default used to be #3B82F6, the one hue map-palette.ts
    // rules out for the map. The fixture above creates a route without naming a
    // colour, so this asserts what the column default actually hands it.
    $route = FoRoute::where('name', 'Jalur Uji')->firstOrFail();

    expect($route->color)->toBe('#982700');
});

test('towers carry the district column the landing page counts', function () {
    // The column lives in create_towers_table now rather than in a follow-up
    // migration, so a fresh install has to produce it.
    expect(Tower::whereNotNull('kecamatan')->distinct()->count('kecamatan'))->toBeGreaterThan(0);
});
