<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Trait for updating status with optional response creation.
 * Provides DRY method for status updates that may include a response message.
 */
trait HasStatusUpdateWithResponse
{
    /**
     * Update status and optionally create response.
     * 
     * @param Request $request
     * @param mixed $model Report or Feedback model
     * @param array $config Configuration array
     * @param array|null $preValidated Pre-validated data (optional, for cases where validation was done externally)
     * @return void
     */
    protected function updateStatusWithResponse(Request $request, $model, array $config, ?array $preValidated = null)
    {
        // Use pre-validated data if provided, otherwise validate request
        $validated = $preValidated ?? $request->validate([
            'status_id' => 'required',
            'message' => 'nullable|string|max:1000',
        ]);

        try {
            // Update status
            $this->updateModelStatus($model, $validated['status_id'], $config);

            // Create response if message provided
            if (!empty($validated['message'])) {
                $this->createResponseRecord($request, $model, $validated['message'], $config);
            }
        } catch (\Exception $e) {
            Log::error('Error updating status: ' . $e->getMessage(), [
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'error' => $e->getMessage(),
            ]);
            
            // Still create response if message provided
            if (!empty($validated['message'])) {
                try {
                    $this->createResponseRecord($request, $model, $validated['message'], $config);
                } catch (\Exception $responseException) {
                    Log::error('Error creating response after status update failure: ' . $responseException->getMessage());
                }
            }
        }
    }

    /**
     * Convert status slug to status ID if needed.
     * Helper method for handling status slug conversion.
     * 
     * @param mixed $statusInput Status ID or slug
     * @return mixed Status ID
     */
    protected function convertStatusSlugToId($statusInput)
    {
        // If already numeric, assume it's an ID
        if (is_numeric($statusInput)) {
            return $statusInput;
        }

        // Try to find status by slug
        try {
            $statusModel = \App\Models\Status::where('slug', $statusInput)->first();
            return $statusModel ? $statusModel->id : $statusInput;
        } catch (\Exception $e) {
            // If Status model doesn't exist or query fails, return original input
            Log::warning('Failed to convert status slug to ID', [
                'status_input' => $statusInput,
                'error' => $e->getMessage(),
            ]);
            return $statusInput;
        }
    }
}

