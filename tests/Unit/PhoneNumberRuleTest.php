<?php

use App\Rules\PhoneNumber;

test('validates indonesian phone numbers with 0 prefix', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '081234567890'))->toBeTrue(); // 0 + 11 digits = 12 total
    expect($rule->passes('phone', '0812345678'))->toBeTrue(); // 0 + 9 digits = 10 total
    expect($rule->passes('phone', '0812345678901'))->toBeTrue(); // 0 + 12 digits = 13 total (max)
});

test('validates indonesian phone numbers with 62 prefix', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '6281234567890'))->toBeTrue();
    expect($rule->passes('phone', '62812345678'))->toBeTrue();
    expect($rule->passes('phone', '628123456789012'))->toBeTrue();
});

test('validates indonesian phone numbers with +62 prefix', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '+6281234567890'))->toBeTrue();
    expect($rule->passes('phone', '+62812345678'))->toBeTrue();
    expect($rule->passes('phone', '+628123456789012'))->toBeTrue();
});

test('validates international phone numbers', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '+1234567890'))->toBeTrue();
    expect($rule->passes('phone', '+441234567890'))->toBeTrue();
    expect($rule->passes('phone', '1234567890'))->toBeTrue();
});

test('rejects phone numbers that are too short', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '12345'))->toBeFalse();
    expect($rule->passes('phone', '08123'))->toBeFalse();
    expect($rule->passes('phone', '0812345'))->toBeFalse();
});

test('rejects phone numbers that are too long', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', '081234567890123456'))->toBeFalse();
    expect($rule->passes('phone', '6281234567890123456'))->toBeFalse();
});

test('rejects phone numbers with invalid characters', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', 'abc123'))->toBeFalse();
    expect($rule->passes('phone', '08-123-456'))->toBeFalse();
    expect($rule->passes('phone', '08 123 456'))->toBeFalse();
});

test('rejects empty phone numbers', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', ''))->toBeFalse();
    expect($rule->passes('phone', '   '))->toBeFalse();
});

test('rejects non-string values', function () {
    $rule = new PhoneNumber();
    
    expect($rule->passes('phone', null))->toBeFalse();
    expect($rule->passes('phone', 1234567890))->toBeFalse();
    expect($rule->passes('phone', []))->toBeFalse();
});

test('returns appropriate error message', function () {
    $rule = new PhoneNumber();
    
    $message = $rule->message();
    
    expect($message)->toBeString();
    expect($message)->toContain('Format nomor telepon tidak valid');
    expect($message)->toContain('08xx');
    expect($message)->toContain('628xx');
    expect($message)->toContain('+628xx');
});

