<?php

use App\Models\User;
use App\Models\Tower;
use App\Models\Report;
use App\Models\Owner;

test('user can submit complaint', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Tower mengganggu sinyal komunikasi',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('reports', [
        'tower_id' => $tower->id,
        'reporter_name' => 'John Doe',
        'category' => 'interference',
        'is_public' => true,
    ]);
});

test('complaint requires valid tower', function () {
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => 999999,
        'pesan' => 'Test complaint message',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['tower_id']);
});

test('complaint validates phone number format', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => 'invalid-phone',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Test complaint message',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['telepon']);
});

test('complaint validates category', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'invalid_category',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Test complaint message',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['kategori']);
});

test('complaint validates message length', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Short',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['pesan']);
});

test('authenticated complainant user cannot provide email', function () {
    $user = User::factory()->create(['role' => 'complainant']);
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->actingAs($user)->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Test complaint message',
        'email' => 'john@example.com',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['email']);
});

test('anonymous user must provide email', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Test complaint message',
        'is_public' => true,
    ]);
    
    $response->assertSessionHasErrors(['email']);
});

test('complaint validates coordinates', function () {
    $owner = Owner::factory()->create();
    $tower = Tower::factory()->create();
    $tower->owners()->attach($owner->id);
    
    $response = $this->post('/complaint', [
        'nama' => 'John Doe',
        'telepon' => '08123456789',
        'kategori' => 'interference',
        'lokasi_tower' => 'Test Location',
        'tower_id' => $tower->id,
        'pesan' => 'Test complaint message',
        'email' => 'john@example.com',
        'is_public' => true,
        'reporter_latitude' => 91, // Invalid latitude
        'reporter_longitude' => 181, // Invalid longitude
    ]);
    
    $response->assertSessionHasErrors(['reporter_latitude', 'reporter_longitude']);
});
