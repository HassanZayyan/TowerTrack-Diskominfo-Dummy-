<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class GoogleDriveUrl implements Rule
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
        // Allow empty, null, dash, or whitespace-only values
        if (empty($value) || (is_string($value) && trim($value) === '') || (is_string($value) && trim($value) === '-')) {
            return true;
        }

        $url = trim($value);

        // Validate basic URL format
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Check if URL is from Google Drive/Google Docs
        $parsedUrl = parse_url($url);
        
        if (!isset($parsedUrl['host'])) {
            return false;
        }

        // Validate Google Drive domain
        $isGoogleDrive = str_contains($parsedUrl['host'], 'drive.google.com') ||
                         str_contains($parsedUrl['host'], 'docs.google.com');

        if (!$isGoogleDrive) {
            return false;
        }

        // Validate path and extract file ID
        $path = $parsedUrl['path'] ?? '';
        $query = $parsedUrl['query'] ?? '';

        // Common Google Drive URL patterns:
        // 1. File view: https://drive.google.com/file/d/{FILE_ID}/view
        // 2. File open: https://drive.google.com/open?id={FILE_ID}
        // 3. Folder view: https://drive.google.com/drive/folders/{FOLDER_ID}
        // 4. Direct preview: https://drive.google.com/uc?export=view&id={FILE_ID}
        // 5. Google Docs: https://docs.google.com/document/d/{FILE_ID}/edit

        $isValidPattern = false;

        // Pattern 1: /file/d/{FILE_ID}/view
        if (preg_match('#/file/d/([a-zA-Z0-9_-]+)#', $path)) {
            $isValidPattern = true;
        }
        
        // Pattern 2: ?id={FILE_ID}
        if (str_contains($query, 'id=')) {
            $isValidPattern = true;
        }
        
        // Pattern 3: /drive/folders/{FOLDER_ID}
        if (preg_match('#/drive/folders/([a-zA-Z0-9_-]+)#', $path)) {
            $isValidPattern = true;
        }

        // Pattern 4: /uc?export=view&id={FILE_ID}
        if (str_contains($path, '/uc') && str_contains($query, 'export=view')) {
            $isValidPattern = true;
        }

        // Pattern 5: Google Docs/Drawings/Sheets formats
        if (preg_match('#/(document|drawings|presentation|spreadsheets)/d/([a-zA-Z0-9_-]+)#', $path)) {
            $isValidPattern = true;
        }

        return $isValidPattern;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The :attribute must be a valid Google Drive URL. Supported formats: drive.google.com/file/d/{id}/view, drive.google.com/open?id={id}, or drive.google.com/uc?export=view&id={id}';
    }
}