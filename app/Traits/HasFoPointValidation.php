<?php

namespace App\Traits;

use App\Rules\GoogleDriveUrl;

/**
 * Trait untuk validation rules FO Point yang reusable
 * DRY: Menghilangkan duplikasi validation rules antara FoController dan FoManagementController
 */
trait HasFoPointValidation
{
    /**
     * Get validation rules for FO point
     * DRY: Reusable validation rules untuk create dan update
     * 
     * @param bool $includeProviders Include provider validation rules
     * @param bool $includeRouteId Include route_id validation (for create)
     * @param bool $includeImages Include image validation rules
     * @return array Validation rules
     */
    protected function getFoPointValidationRules(
        bool $includeProviders = false,
        bool $includeRouteId = false,
        bool $includeImages = true
    ): array {
        $rules = [
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'area' => 'required|in:ungaran',
            'type' => 'required|in:pole,junction,hub,endpoint',
            'status' => 'required|in:active,inactive,maintenance',
            'route_name' => 'required|string|max:255',
            'sequence_number' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
        ];

        // Add side_of_road validation (optional for public API, required for admin)
        $rules['side_of_road'] = 'nullable|in:left,right,unknown';

        // Add image validation if needed
        if ($includeImages) {
            $rules['isp_image'] = ['nullable', 'string', 'max:2048', new GoogleDriveUrl];
            $rules['pole_image'] = ['nullable', 'string', 'max:2048', new GoogleDriveUrl];
            $rules['junction_box_image'] = ['nullable', 'string', 'max:2048', new GoogleDriveUrl];
        }

        // Add route_id validation for create operations
        if ($includeRouteId) {
            $rules['route_id'] = 'required|exists:fo_routes,id';
        }

        // Add provider validation if needed
        if ($includeProviders) {
            $rules['providers'] = 'nullable|array';
            $rules['providers.*'] = 'integer|exists:fo_providers,id';
        }

        return $rules;
    }

    /**
     * Get validation rules for FO route
     * DRY: Reusable validation rules untuk create dan update route
     * 
     * @param bool $includePathCoordinates Include path_coordinates validation (for create)
     * @return array Validation rules
     */
    protected function getFoRouteValidationRules(bool $includePathCoordinates = false): array
    {
        $rules = [
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,maintenance',
            'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
        ];

        // Add path_coordinates validation for create operations
        if ($includePathCoordinates) {
            $rules['path_coordinates'] = 'required|array|min:2';
            $rules['path_coordinates.*.lat'] = 'required|numeric|between:-90,90';
            $rules['path_coordinates.*.lng'] = 'required|numeric|between:-180,180';
        }

        return $rules;
    }
}


