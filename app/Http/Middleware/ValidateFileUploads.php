<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateFileUploads
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check for file uploads in complaint and feedback forms
        if ($request->hasFile('foto') || $request->hasFile('assets') || $request->hasFile('video')) {
            $files = array_merge(
                $request->file('foto', []),
                $request->file('assets', []),
                $request->file('video', [])
            );
            
            foreach ($files as $file) {
                // Validate file size (max 10MB for images, 100MB for videos)
                $maxSize = str_starts_with($file->getMimeType(), 'video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
                
                if ($file->getSize() > $maxSize) {
                    return back()->withErrors(['file' => 'File terlalu besar. Maksimal ' . ($maxSize / (1024 * 1024)) . 'MB.']);
                }
                
                // Validate MIME type
                $allowedMimes = [
                    'image/jpeg', 'image/png', 'image/jpg', 
                    'video/mp4', 'video/mov', 'video/avi', 'video/mkv'
                ];
                
                if (!in_array($file->getMimeType(), $allowedMimes)) {
                    return back()->withErrors(['file' => 'Format file tidak didukung. Hanya JPEG, PNG, MP4, MOV, AVI, MKV yang diperbolehkan.']);
                }
                
                // Additional security: Check file extension matches MIME type
                $extension = strtolower($file->getClientOriginalExtension());
                $mimeType = $file->getMimeType();
                
                $validExtensions = [
                    'image/jpeg' => ['jpg', 'jpeg'],
                    'image/png' => ['png'],
                    'video/mp4' => ['mp4'],
                    'video/mov' => ['mov'],
                    'video/avi' => ['avi'],
                    'video/mkv' => ['mkv']
                ];
                
                if (isset($validExtensions[$mimeType]) && !in_array($extension, $validExtensions[$mimeType])) {
                    return back()->withErrors(['file' => 'Ekstensi file tidak sesuai dengan tipe file.']);
                }
            }
        }
        
        return $next($request);
    }
}
