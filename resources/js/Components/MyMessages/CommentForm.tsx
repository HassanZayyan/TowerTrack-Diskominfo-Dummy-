import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import AnimatedButton from '@/Components/AnimatedButton';
import { useGuestFormData } from '@/Hooks/useGuestData';

interface CommentFormProps {
  type: 'report' | 'feedback';
  id: number;
  parentId?: number | null;
  replyingTo?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CommentForm({ 
  type, 
  id, 
  parentId = null,
  replyingTo = null,
  onSuccess,
  onCancel 
}: CommentFormProps) {
  const { auth } = usePage().props as any;
  const isAuthenticated = !!auth?.user;

  // Auto-fill from cookie if available (only for guest users)
  const guestFormData = useGuestFormData();

  const { data, setData, post, processing, errors, reset } = useForm({
    message: '',
    parent_id: parentId,
    guest_name: guestFormData.name,
    guest_email: guestFormData.email,
    guest_phone: guestFormData.phone,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update parent_id when it changes
  // Include setData in dependencies and handle null properly
  React.useEffect(() => {
    setData('parent_id', parentId ?? null);
  }, [parentId, setData]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const routeName = type === 'report' 
      ? 'public.reports.comments.store' 
      : 'public.feedbacks.comments.store';

    // Ensure parent_id is explicitly set before submit
    // setData already handles this via useEffect, but we ensure it's null if not replying
    if (parentId === null && data.parent_id !== null) {
      setData('parent_id', null);
    }

    post(route(routeName, id), {
      preserveScroll: true,
      onSuccess: () => {
        // Manual reset to have better control
        // Only reset fields that should be cleared, preserve parent_id logic handled by onCancel
        setData('message', '');
        if (!isAuthenticated) {
          setData('guest_name', '');
          setData('guest_email', '');
          setData('guest_phone', '');
        }
        setIsSubmitting(false);
        
        // Reset reply mode after successful submission
        if (onCancel) {
          onCancel();
        }
        
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Tulis Komentar</h3>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Membalas ke <strong>{replyingTo}</strong>
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        )}
        
        {/* Guest fields - only show if not authenticated */}
        {!isAuthenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <InputLabel htmlFor="guest_name" value="Nama *" />
              <TextInput
                id="guest_name"
                type="text"
                value={data.guest_name}
                onChange={(e) => setData('guest_name', e.target.value)}
                className="mt-1 block w-full"
                required={!isAuthenticated}
                placeholder="Masukkan nama Anda"
              />
              <InputError message={errors.guest_name} className="mt-1" />
            </div>

            <div>
              <InputLabel htmlFor="guest_email" value="Email *" />
              <TextInput
                id="guest_email"
                type="email"
                value={data.guest_email}
                onChange={(e) => setData('guest_email', e.target.value)}
                className="mt-1 block w-full"
                required={!isAuthenticated}
                placeholder="contoh@email.com"
              />
              <InputError message={errors.guest_email} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <InputLabel htmlFor="guest_phone" value="No. Telepon (Opsional)" />
              <TextInput
                id="guest_phone"
                type="tel"
                value={data.guest_phone}
                onChange={(e) => setData('guest_phone', e.target.value)}
                className="mt-1 block w-full"
                placeholder="08xx-xxxx-xxxx"
              />
              <InputError message={errors.guest_phone} className="mt-1" />
            </div>
          </div>
        )}

        {/* Comment message */}
        <div>
          <InputLabel htmlFor="message" value="Komentar *" />
          <textarea
            id="message"
            value={data.message}
            onChange={(e) => setData('message', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
            rows={4}
            required
            placeholder="Tulis komentar Anda di sini..."
          />
          <InputError message={errors.message} className="mt-1" />
          <p className="mt-1 text-sm text-gray-500">
            {data.message.length}/1000 karakter
          </p>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3">
          <AnimatedButton
            type="submit"
            variant="primary"
            size="md"
            animation="scale"
            loading={processing || isSubmitting}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          >
            {processing || isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
          </AnimatedButton>
        </div>
      </form>
    </div>
  );
}

