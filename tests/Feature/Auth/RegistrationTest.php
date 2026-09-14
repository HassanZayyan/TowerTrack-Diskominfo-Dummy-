<?php

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    // The form is CAPTCHA-gated: `cf-turnstile-response` is `required|string`,
    // so without it the request never reaches the registration logic.
    // CaptchaService::verify returns true under the testing environment, so the
    // value itself is a placeholder.
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'cf-turnstile-response' => 'test-token',
    ]);

    $this->assertAuthenticated();

    // A new account is signed in but NOT yet trusted: RegisteredUserController
    // sends it to the verification notice, not to the dashboard. The Breeze
    // default this test came from predates the email-verification requirement.
    $response->assertRedirect(route('verification.notice', absolute: false));
});
