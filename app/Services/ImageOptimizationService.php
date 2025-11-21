<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * DRY Service for image optimization and compression
 * Provides reusable image processing methods
 */
class ImageOptimizationService
{
    /**
     * Maximum image width in pixels
     */
    const MAX_WIDTH = 1920;

    /**
     * Maximum image height in pixels
     */
    const MAX_HEIGHT = 1920;

    /**
     * Default JPEG quality (0-100)
     */
    const DEFAULT_QUALITY = 85;

    /**
     * Maximum file size in MB before compression
     */
    const MAX_SIZE_BEFORE_COMPRESSION = 2; // 2MB

    /**
     * Optimize and store an uploaded image
     * 
     * @param UploadedFile $file Uploaded file
     * @param string $directory Storage directory
     * @param string $disk Storage disk
     * @param array $options Optimization options
     * @return string|false Storage path or false on failure
     */
    public static function optimizeAndStore(
        UploadedFile $file,
        string $directory,
        string $disk = 'public',
        array $options = []
    ): string|false {
        try {
            $maxWidth = $options['max_width'] ?? self::MAX_WIDTH;
            $maxHeight = $options['max_height'] ?? self::MAX_HEIGHT;
            $quality = $options['quality'] ?? self::DEFAULT_QUALITY;
            $compress = $options['compress'] ?? true;

            // Check if file needs compression
            $needsCompression = $compress && (
                $file->getSize() > (self::MAX_SIZE_BEFORE_COMPRESSION * 1024 * 1024) ||
                $file->getMimeType() === 'image/jpeg' ||
                $file->getMimeType() === 'image/png'
            );

            if ($needsCompression && extension_loaded('gd')) {
                return self::compressAndStore($file, $directory, $disk, $maxWidth, $maxHeight, $quality);
            }

            // Store without compression if GD is not available or compression disabled
            return $file->store($directory, $disk);
        } catch (\Exception $e) {
            \Log::error('Image optimization failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
            ]);
            
            // Fallback to regular storage
            return $file->store($directory, $disk);
        }
    }

    /**
     * Compress and store image using GD library
     * 
     * @param UploadedFile $file Uploaded file
     * @param string $directory Storage directory
     * @param string $disk Storage disk
     * @param int $maxWidth Maximum width
     * @param int $maxHeight Maximum height
     * @param int $quality JPEG quality
     * @return string|false Storage path or false on failure
     */
    protected static function compressAndStore(
        UploadedFile $file,
        string $directory,
        string $disk,
        int $maxWidth,
        int $maxHeight,
        int $quality
    ): string|false {
        $mimeType = $file->getMimeType();
        
        // Create image resource from file
        switch ($mimeType) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($file->getRealPath());
                break;
            case 'image/png':
                $image = imagecreatefrompng($file->getRealPath());
                break;
            case 'image/gif':
                $image = imagecreatefromgif($file->getRealPath());
                break;
            default:
                // Unsupported format, store as-is
                return $file->store($directory, $disk);
        }

        if (!$image) {
            return $file->store($directory, $disk);
        }

        // Get original dimensions
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);

        // Calculate new dimensions maintaining aspect ratio
        $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
        $newWidth = (int) ($originalWidth * $ratio);
        $newHeight = (int) ($originalHeight * $ratio);

        // Only resize if needed
        if ($newWidth < $originalWidth || $newHeight < $originalHeight) {
            $resized = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($mimeType === 'image/png') {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
                imagefill($resized, 0, 0, $transparent);
            }
            
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
            imagedestroy($image);
            $image = $resized;
        }

        // Generate storage path
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::random(40) . '.' . $extension;
        $path = $directory . '/' . $filename;

        // Save compressed image
        $tempPath = sys_get_temp_dir() . '/' . $filename;
        
        switch ($mimeType) {
            case 'image/jpeg':
                imagejpeg($image, $tempPath, $quality);
                break;
            case 'image/png':
                // PNG compression level (0-9, where 9 is highest compression)
                imagepng($image, $tempPath, 6);
                break;
            case 'image/gif':
                imagegif($image, $tempPath);
                break;
        }

        imagedestroy($image);

        // Store the compressed image
        $stored = Storage::disk($disk)->putFileAs($directory, new \Illuminate\Http\File($tempPath), $filename);
        
        // Clean up temp file
        @unlink($tempPath);

        return $stored ? $path : false;
    }

    /**
     * Get optimized image URL with size parameters
     * 
     * @param string $path Storage path
     * @param int|null $width Desired width
     * @param int $quality JPEG quality
     * @return string Image URL
     */
    public static function getOptimizedUrl(string $path, ?int $width = null, int $quality = 85): string
    {
        // For now, return regular storage URL
        // In production, you might want to use a CDN or image processing service
        $url = Storage::url($path);
        
        // If width is specified, you could append query params for dynamic resizing
        // This would require a route handler for image resizing
        if ($width) {
            $url .= "?w={$width}&q={$quality}";
        }
        
        return $url;
    }
}


