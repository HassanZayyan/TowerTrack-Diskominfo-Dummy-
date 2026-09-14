<?php

namespace App\Helpers;

class PhoneHelper
{
    /**
     * Normalize phone number to standard format
     * Converts 08xx to +628xx format (E.164 standard)
     *
     * @param string $phone
     * @return string
     */
    public static function normalize(string $phone): string
    {
        if (empty($phone)) {
            return $phone;
        }

        // Remove all non-digit characters except + at the beginning
        $cleaned = preg_replace('/[^\d+]/', '', trim($phone));
        
        // Remove leading + for processing
        $digitsOnly = ltrim($cleaned, '+');
        
        // Convert 0 prefix to 62 (Indonesian country code)
        if (preg_match('/^0/', $digitsOnly)) {
            $digitsOnly = '62' . substr($digitsOnly, 1);
        }
        
        // Ensure it starts with country code if it's Indonesian number
        if (preg_match('/^62/', $digitsOnly) && !str_starts_with($cleaned, '+')) {
            return '+' . $digitsOnly;
        }
        
        // If already has +, return as is
        if (str_starts_with($cleaned, '+')) {
            return $cleaned;
        }
        
        // For other international numbers, add + if not present
        if (preg_match('/^[1-9]/', $digitsOnly)) {
            return '+' . $digitsOnly;
        }
        
        // Default: return with + prefix
        return '+' . $digitsOnly;
    }
    
    /**
     * Format phone number for display
     *
     * @param string $phone
     * @return string
     */
    public static function formatForDisplay(string $phone): string
    {
        if (empty($phone)) {
            return $phone;
        }

        // Remove + prefix for processing
        $cleaned = ltrim($phone, '+');
        
        // Format Indonesian numbers: +62 8xx xxxx xxxx
        if (str_starts_with($cleaned, '62')) {
            $number = substr($cleaned, 2);
            if (strlen($number) >= 9) {
                // Format: +62 8xx xxxx xxxx
                $formatted = '+62 ' . substr($number, 0, 3);
                if (strlen($number) > 3) {
                    $formatted .= ' ' . substr($number, 3, 4);
                }
                if (strlen($number) > 7) {
                    $formatted .= ' ' . substr($number, 7);
                }
                return $formatted;
            }
        }
        
        // For other formats, return with + prefix if not present
        if (!str_starts_with($phone, '+') && preg_match('/^[1-9]/', $cleaned)) {
            return '+' . $cleaned;
        }
        
        return $phone;
    }
    
    /**
     * Clean phone number (remove formatting, keep only digits and +)
     *
     * @param string $phone
     * @return string
     */
    public static function clean(string $phone): string
    {
        if (empty($phone)) {
            return $phone;
        }

        // Remove all non-digit characters except + at the beginning
        $cleaned = preg_replace('/[^\d+]/', '', trim($phone));
        
        // Ensure + only appears at the beginning
        if (str_contains($cleaned, '+')) {
            $parts = explode('+', $cleaned);
            $cleaned = '+' . implode('', array_filter($parts));
        }
        
        return $cleaned;
    }
}


