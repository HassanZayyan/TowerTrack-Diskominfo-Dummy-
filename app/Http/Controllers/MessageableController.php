<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\HasStatusHandling;
use App\Models\PublicComment;

/**
 * Base controller for messageable models (Report and Feedback).
 * Provides shared logic to avoid code duplication.
 */
abstract class MessageableController extends Controller
{
    use HasStatusHandling;
    
    /**
     * Configuration for different messageable types.
     * Override in child controllers.
     */
    abstract protected function getConfig(): array;
    
    /**
     * Validate public access.
     */
    protected function validatePublicAccess($model, string $type = 'Pesan'): void
    {
        if (!$model->is_public) {
            abort(404, "{$type} tidak ditemukan atau tidak publik.");
        }
    }
    
    /**
     * Validate private access.
     * 
     * @return array [email, phone]
     */
    protected function validatePrivateAccess($model, Request $request, string $phoneField): array
    {
        $email = $request->query('email');
        $phone = $request->query('phone');
        
        if ($model->is_public) {
            abort(404, 'Pesan tidak ditemukan atau tidak pribadi.');
        }
        
        if (!$email || !$phone) {
            abort(404, 'Email dan nomor telepon diperlukan untuk mengakses pesan pribadi.');
        }
        
        if ($model->email !== $email || $model->$phoneField !== $phone) {
            abort(403, 'Anda tidak memiliki akses ke pesan ini.');
        }
        
        return [$email, $phone];
    }
    
    /**
     * Load common relationships for public messages.
     * Returns paginated comments separately to avoid redundancy.
     */
    protected function loadPublicRelationships($model, array $config): LengthAwarePaginator
    {
        $relationships = [
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            $config['assets_relation'] => function($q) use ($config) {
                $q->select($config['assets_select']);
            },
            'responses' => function($q) use ($config) {
                $q->select($config['responses_select'])
                  ->with(['user:id,name', $config['response_assets_relation']]);
            }
        ];
        
        $model->load($relationships);
        
        // Load paginated comments separately to avoid redundancy
        $comments = PublicComment::where('commentable_type', get_class($model))
            ->where('commentable_id', $model->id)
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->with(['user:id,name,email', 'replies' => function($replyQ) {
                $replyQ->where('is_approved', true)
                      ->orderBy('created_at', 'asc')
                      ->with(PublicComment::buildNestedRepliesEagerLoad(3));
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return $comments;
    }
    
    /**
     * Load common relationships for private messages.
     */
    protected function loadPrivateRelationships($model, array $config): void
    {
        $relationships = [
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            $config['assets_relation'] => function($q) use ($config) {
                $q->select($config['assets_select']);
            },
            'responses' => function($q) use ($config) {
                $q->select($config['responses_select'])
                  ->with(['user:id,name', $config['response_assets_relation']]);
            }
        ];
        
        $model->load($relationships);
    }
}



