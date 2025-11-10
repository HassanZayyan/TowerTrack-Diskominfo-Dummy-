<?php

namespace App\Traits;

trait HasStatusHandling
{
    /**
     * Get statuses with fallback to default statuses if table doesn't exist.
     */
    protected function getStatuses()
    {
        try {
            return \App\Models\Status::all(['id', 'name', 'slug', 'color', 'icon']);
        } catch (\Exception $e) {
            return collect([
                ['id' => 1, 'name' => 'Pending', 'slug' => 'pending', 'color' => 'red', 'icon' => 'clock'],
                ['id' => 2, 'name' => 'In Progress', 'slug' => 'in_progress', 'color' => 'orange', 'icon' => 'refresh'],
                ['id' => 3, 'name' => 'Closed', 'slug' => 'closed', 'color' => 'green', 'icon' => 'check'],
            ]);
        }
    }
}





