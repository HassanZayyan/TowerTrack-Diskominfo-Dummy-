<?php

use App\Models\Tower;
use App\Models\Owner;
use App\Models\User;

test('tower can be created with valid data', function () {
    $owner = Owner::factory()->create();
    
    $towerData = [
        'site_name' => 'Test Tower',
        'site_id' => 'TEST001',
        'latitude' => -6.200000,
        'longitude' => 106.816666,
        'tinggi_menara' => 50.5,
        'tower_type' => 'monopole',
        'site_type' => 'rooftop',
        'alamat_menara' => 'Test Address',
    ];
    
    $tower = Tower::create($towerData);
    
    expect($tower->site_name)->toBe('Test Tower');
    expect($tower->latitude)->toBe(-6.200000);
    expect($tower->longitude)->toBe(106.816666);
});

test('tower can have multiple owners', function () {
    $tower = Tower::factory()->create();
    $owner1 = Owner::factory()->create();
    $owner2 = Owner::factory()->create();
    
    $tower->owners()->attach([$owner1->id, $owner2->id]);
    
    expect($tower->owners)->toHaveCount(2);
    expect($tower->owners->pluck('id')->toArray())->toContain($owner1->id, $owner2->id);
});

test('tower primary owner returns first owner', function () {
    $tower = Tower::factory()->create();
    $owner1 = Owner::factory()->create(['name' => 'First Owner']);
    $owner2 = Owner::factory()->create(['name' => 'Second Owner']);
    
    $tower->owners()->attach([$owner1->id, $owner2->id]);
    
    expect($tower->primaryOwner()->id)->toBe($owner1->id);
});

test('tower can have reports', function () {
    $tower = Tower::factory()->create();
    $user = User::factory()->create();
    
    $report = $tower->reports()->create([
        'user_id' => $user->id,
        'email' => 'test@example.com',
        'reporter_name' => 'Test User',
        'reporter_phone' => '08123456789',
        'category' => 'interference',
        'message' => 'Test complaint message',
        'status_id' => 1,
        'is_public' => true,
    ]);
    
    expect($tower->reports)->toHaveCount(1);
    expect($tower->reports->first()->message)->toBe('Test complaint message');
});

test('tower validates coordinate ranges', function () {
    $towerData = [
        'site_name' => 'Test Tower',
        'latitude' => 91, // Invalid latitude
        'longitude' => 181, // Invalid longitude
    ];
    
    expect(function () use ($towerData) {
        Tower::create($towerData);
    })->toThrow(Exception::class);
});

test('tower can be filtered by coordinates', function () {
    $towerWithCoords = Tower::factory()->create([
        'latitude' => -6.200000,
        'longitude' => 106.816666,
    ]);
    
    $towerWithoutCoords = Tower::factory()->create([
        'latitude' => null,
        'longitude' => null,
    ]);
    
    $towersWithCoords = Tower::whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->where('latitude', '!=', 0)
        ->where('longitude', '!=', 0)
        ->get();
    
    expect($towersWithCoords)->toHaveCount(1);
    expect($towersWithCoords->first()->id)->toBe($towerWithCoords->id);
});

test('tower can be searched by site name', function () {
    $tower1 = Tower::factory()->create(['site_name' => 'Tower Alpha']);
    $tower2 = Tower::factory()->create(['site_name' => 'Tower Beta']);
    
    $searchResults = Tower::where('site_name', 'like', '%Alpha%')->get();
    
    expect($searchResults)->toHaveCount(1);
    expect($searchResults->first()->id)->toBe($tower1->id);
});
