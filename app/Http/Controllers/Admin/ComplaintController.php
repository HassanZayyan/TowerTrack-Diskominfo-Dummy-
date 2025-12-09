<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Status;
use App\Traits\HasStatusHandling;
use App\Traits\HasAdminResponseHandling;
use App\Traits\HasMessageableRelationships;
use App\Traits\HasStatusUpdateWithResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    use HasStatusHandling, HasAdminResponseHandling, HasMessageableRelationships, HasStatusUpdateWithResponse;

    /**
     * Get configuration for Report responses.
     * 
     * @return array
     */
    protected function getResponseConfig(): array
    {
        return [
            'response_model' => \App\Models\ReportResponse::class,
            'response_foreign_key' => 'report_id',
            'response_image_directory' => 'admin-response-photos',
            'response_video_directory' => 'admin-response-videos',
        ];
    }

    public function index(Request $request)
    {
        $reports = Report::with($this->getReportRelationships())
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/Complaints', [
            'reports' => $reports,
            'statuses' => $this->getStatuses(),
        ]);
    }

    public function show(Report $report)
    {
        $report->load($this->getReportRelationships());

        return Inertia::render('Admin/Reports/Show', [
            'report' => $report
        ]);
    }

    public function respond(Request $request, Report $report)
    {
        $config = $this->getResponseConfig();
        $this->createAdminResponse($request, $report, $config);
        return back();
    }

    public function updateStatus(Request $request, Report $report)
    {
        $validated = $request->validate([
            'status_id' => 'required',
            'message' => 'nullable|string|max:1000',
        ]);

        // Convert slug to id if needed using trait helper method
        $validated['status_id'] = $this->convertStatusSlugToId($validated['status_id']);

        $config = $this->getResponseConfig();
        // Pass pre-validated data to avoid double validation
        $this->updateStatusWithResponse($request, $report, $config, $validated);
        return back();
    }
}


