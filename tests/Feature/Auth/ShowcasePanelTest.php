<?php

use App\Models\Tower;
use Inertia\Testing\AssertableInertia;

/*
 * The auth panel's model is drawn from a prop, and a prop is easy to lose.
 *
 * Both auth screens render App\Support\TowerShowcase into the right-hand
 * panel. If either controller stops sending it — a refactor, a merge, someone
 * trimming what looks like an unused key on a login page — nothing breaks
 * loudly: the panel keeps its crest, its gradient and its caption, and simply
 * draws a regency with no masts on it. It would be some time before anyone
 * noticed the towers had gone.
 *
 * These are the assertions that would notice.
 */

/**
 * There is no TowerFactory in this project; every test that needs a tower
 * builds one with Tower::create, which is also the only way to satisfy
 * `alamat_menara` — NOT NULL in the schema and therefore required on every row.
 */
function tower(array $attributes = []): Tower
{
    return Tower::create(array_merge([
        'site_id' => 'SITE-UJI',
        'site_name' => 'Menara Uji',
        'alamat_menara' => 'Jl. Uji',
    ], $attributes));
}

test('the login screen sends the tower positions its panel draws', function () {
    tower(['latitude' => -7.13915, 'longitude' => 110.40502, 'tinggi_menara' => 42]);

    $this->get('/login')->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('Auth/Login')
            ->where('showcase.total', 1)
            // [latitude, longitude, height] — the shape RegencyModel destructures.
            // An object here, or a reordered triple, draws the regency inside out.
            ->where('showcase.points', [[-7.13915, 110.40502, 42]])
    );
});

test('the registration screen sends the same payload', function () {
    tower(['latitude' => -7.2, 'longitude' => 110.5, 'tinggi_menara' => 60]);

    $this->get('/register')->assertInertia(
        fn (AssertableInertia $page) => $page
            ->component('Auth/Register')
            ->where('showcase.total', 1)
            ->has('showcase.points', 1)
    );
});

test('a tower with no usable coordinates is counted but not drawn', function () {
    // The register keeps towers that were never surveyed, and the seeder makes
    // a batch of them on purpose. They belong in the total — the office has
    // them on its books — and nowhere near the map, where a 0/0 row would put
    // a mast off the coast of Ghana and stretch the model across the Atlantic.
    tower(['latitude' => null, 'longitude' => null]);
    tower(['latitude' => 0, 'longitude' => 0]);

    $this->get('/login')->assertInertia(
        fn (AssertableInertia $page) => $page
            ->where('showcase.total', 2)
            ->where('showcase.points', [])
    );
});
