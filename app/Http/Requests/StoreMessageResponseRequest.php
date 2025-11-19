<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageResponseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'message' => ['required', 'string', 'max:1000'],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimes:jpeg,png,jpg,mp4,mov,avi,mkv', 'max:102400'],
        ];

        if (!$this->user()) {
            $rules['email'] = ['required', 'email', 'max:255'];
            $rules['phone'] = ['required', 'string', 'max:20'];
        }

        return $rules;
    }
}
