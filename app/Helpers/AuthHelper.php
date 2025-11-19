<?php

/**
 * Authentication Helper Functions
 * 
 * Provides helper functions for checking authentication status.
 * 
 * Note: "guest" is NOT a role in the database, but rather an authentication status
 * for unauthenticated users (!auth()->check()).
 * 
 * These helper functions are automatically loaded via composer.json autoload.
 * They are available globally throughout the application without requiring
 * any import or use statements.
 * 
 * Usage:
 *   if (isGuest()) {
 *       // Handle guest user logic
 *   }
 * 
 *   if (isAuthenticated()) {
 *       // Handle authenticated user logic
 *   }
 */

if (!function_exists('isGuest')) {
    /**
     * Check if current request is from a guest (unauthenticated user).
     * 
     * Guest users are users who have not logged in and do not have a User instance.
     * They can still interact with the system (submit reports/feedback, comment, etc.)
     * but with different validation and access control rules.
     * 
     * This is the recommended way to check for guest users throughout the application.
     * 
     * @return bool True if user is not authenticated (guest), false otherwise
     * 
     * @example
     * if (isGuest()) {
     *     // Require CAPTCHA for guest users
     *     $rules['cf-turnstile-response'] = 'required|string';
     * }
     */
    function isGuest(): bool
    {
        return !auth()->check();
    }
}

if (!function_exists('isAuthenticated')) {
    /**
     * Check if current request is from an authenticated user.
     * 
     * This is the inverse of isGuest() and provides a more readable alternative
     * to auth()->check().
     * 
     * This is the recommended way to check for authenticated users throughout the application.
     * 
     * @return bool True if user is authenticated, false otherwise
     * 
     * @example
     * if (isAuthenticated()) {
     *     // Use authenticated user's email automatically
     *     $email = auth()->user()->email;
     * }
     */
    function isAuthenticated(): bool
    {
        return auth()->check();
    }
}

