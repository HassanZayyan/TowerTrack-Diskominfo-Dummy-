<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use App\Helpers\ExcelHelper;

/**
 * Import Controller Trait
 * DRY: Shared methods untuk import controllers
 * 
 * Provides common functionality:
 * - File validation
 * - Preview import
 * - Process import
 * - Error handling
 */
trait ImportControllerTrait
{
    /**
     * Get import class name (must be implemented by using class)
     * 
     * @return string
     */
    abstract protected function getImportClass(): string;

    /**
     * Get template export class name (must be implemented by using class)
     * 
     * @return string
     */
    abstract protected function getTemplateExportClass(): string;

    /**
     * Get required columns for validation (must be implemented by using class)
     * 
     * @return array
     */
    abstract protected function getRequiredColumns(): array;

    /**
     * Get preview validation logic (can be overridden)
     * 
     * @param array $preview
     * @param array $detectedMapping
     * @return array Array of errors
     */
    protected function validatePreviewRows(array $preview, array $detectedMapping): array
    {
        return [];
    }

    /**
     * Build import instance (must be implemented by using class)
     * 
     * @param array $validated
     * @return object
     */
    abstract protected function buildImportInstance(array $validated);

    /**
     * Get success redirect route (must be implemented by using class)
     * 
     * @return string
     */
    abstract protected function getSuccessRedirectRoute(): string;

    /**
     * Get success message (can be overridden)
     * 
     * @param int $successCount
     * @param int $errorCount
     * @return string
     */
    protected function getSuccessMessage(int $successCount, int $errorCount): string
    {
        $message = "Import berhasil: {$successCount} data berhasil diimport";
        if ($errorCount > 0) {
            $message .= ", {$errorCount} data gagal";
        }
        return $message;
    }

    /**
     * Preview import (before actual import)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function previewImport(Request $request): JsonResponse
    {
        $validated = $request->validate(
            ExcelHelper::getFileValidationRules(),
            ExcelHelper::getFileValidationMessages()
        );

        try {
            // Find header row
            $headerResult = ExcelHelper::findHeaderRow($validated['file']);
            $headerRow = $headerResult['cleanedHeaderRow'];
            $headerRowIndex = $headerResult['headerRowIndex'];
            $startIndex = $headerResult['startIndex'];
            
            // Auto-detect mapping
            $importClass = $this->getImportClass();
            $import = new $importClass();
            $detectedMapping = $import->detectColumnMapping($headerRow);
            
            // Build column index mapping
            $columnIndexMapping = ExcelHelper::buildColumnIndexMapping(
                $detectedMapping,
                $headerRow,
                $startIndex
            );
            
            // Validate required columns
            $missingColumns = array_diff($this->getRequiredColumns(), array_keys($detectedMapping));
            
            // Preview data
            $previewData = Excel::toArray(new $importClass(), $validated['file']);
            $preview = array_slice($previewData[0] ?? [], ($headerRowIndex ?? 0) + 1, 10);
            
            // Validate preview rows
            $errors = $this->validatePreviewRows($preview, $detectedMapping);
            
            // Count total rows
            $totalRows = count($previewData[0] ?? []) - ($headerRowIndex ?? 0) - 1;
            $startRowForImport = ($headerRowIndex ?? 0) + 1;
            
            return response()->json([
                'success' => true,
                'detected_mapping' => $detectedMapping,
                'column_index_mapping' => $columnIndexMapping,
                'missing_columns' => array_values($missingColumns),
                'preview' => $preview,
                'errors' => $errors,
                'can_import' => empty($missingColumns) && empty($errors),
                'total_rows' => max(0, $totalRows),
                'start_row_for_import' => $startRowForImport,
            ]);
        } catch (\Exception $e) {
            Log::error('Error previewing import', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membaca file: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process import
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240',
            'mode' => 'required|in:insert,update,upsert',
            'column_mapping' => 'nullable|array',
            'start_row' => 'nullable|integer|min:1',
            'column_index_mapping' => 'nullable|array',
        ]);

        try {
            $import = $this->buildImportInstance($validated);
            
            Excel::import($import, $validated['file']);

            $successCount = $import->getRowCount() - count($import->failures());
            $errorCount = count($import->failures());

            return redirect()
                ->route($this->getSuccessRedirectRoute())
                ->with([
                    'success' => $this->getSuccessMessage($successCount, $errorCount),
                    'import_errors' => $import->failures(),
                    'error_count' => $errorCount,
                ]);
        } catch (\Exception $e) {
            Log::error('Error importing data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['file' => 'Import gagal: ' . $e->getMessage()]);
        }
    }

    /**
     * Download template
     * 
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadTemplate()
    {
        $exportClass = $this->getTemplateExportClass();
        $fileName = 'template_import_' . date('Ymd_His') . '.xlsx';
        
        return Excel::download(new $exportClass(), $fileName);
    }
}

