<?php

use App\Models\User;

/*
 * Every credential post carries a `cf-turnstile-response`.
 *
 * The login and registration forms are CAPTCHA-gated, and the rule is
 * `required|string` — so a post without the field never reaches the credential
 * check at all. These tests were written before Turnstile landed and were
 * failing on validation. That also meant "users can not authenticate with
 * invalid password" was passing for entirely the wrong reason: the request was
 * rejected for a missing token, not for a wrong password.
 *
 * The value is a placeholder rather than a real token because
 * CaptchaService::verify already short-circuits to true under
 * app()->environment('testing'). Nothing is stubbed and nothing is weakened;
 * the tests simply send the field the form sends.
 */
const CAPTCHA = ['cf-turnstile-response' => 'test-token'];

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ] + CAPTCHA);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ] + CAPTCHA);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
