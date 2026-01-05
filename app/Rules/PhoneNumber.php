<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class PhoneNumber implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (empty($value) || !is_string($value)) {
            return false;
        }

        // Remove all non-digit characters except + at the beginning
        $cleaned = preg_replace('/[^\d+]/', '', trim($value));
        
        // Remove leading + for validation
        $digitsOnly = ltrim($cleaned, '+');
        
        // Check minimum length (at least 8 digits for local numbers)
        if (strlen($digitsOnly) < 8) {
            return false;
        }
        
        // Check maximum length (15 digits for international numbers per E.164 standard)
        if (strlen($digitsOnly) > 15) {
            return false;
        }
        
        // Validate Indonesian phone number format
        // Format: 08xx, 628xx, +628xx
        // Indonesian mobile numbers: 08xx (10-12 digits), 628xx (11-13 digits)
        if (preg_match('/^(\+?62|0)[0-9]{9,12}$/', $digitsOnly)) {
            return true;
        }
        
        // Validate international format (with country code)
        // Format: +[country code][number] or just digits
        // Country code: 1-3 digits, number: 4-12 digits
        if (preg_match('/^\+?[1-9]\d{7,14}$/', $cleaned)) {
            return true;
        }
        
        return false;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'Format nomor telepon tidak valid. Gunakan format: 08xx, 628xx, atau +628xx untuk nomor Indonesia, atau format internasional.';
    }
}

