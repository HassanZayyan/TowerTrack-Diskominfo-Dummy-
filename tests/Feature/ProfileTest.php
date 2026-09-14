<?php

use App\Models\User;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile name can be updated but the email address cannot', function () {
    // Changing your own email is deliberately impossible: ProfileController
    // strips it from the validated data, ProfileUpdateRequest has no rule for
    // it, and the form says so ("Alamat email tidak dapat diubah untuk keamanan
    // akun"). This test asserted the opposite, from before that decision, so it
    // was failing against correct behaviour.
    $user = User::factory()->create();
    $originalEmail = $user->email;

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame($originalEmail, $user->email, 'email must be ignored on profile update');
    // The address never changed, so the verification it carried still stands.
    $this->assertNotNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();

    // SOFT delete, not a hard one. User uses the SoftDeletes trait, and the
    // product depends on it: a removed account keeps its reports and feedback
    // attributable for audit, and the admin panel can restore it ("Data user
    // tetap tersimpan di database untuk keperluan audit").
    //
    // `fresh()` cannot check this. It calls newQueryWithoutScopes(), which
    // bypasses SoftDeletingScope and therefore returns the trashed row, so the
    // old `assertNull($user->fresh())` could never have passed.
    $this->assertSoftDeleted($user);
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});
