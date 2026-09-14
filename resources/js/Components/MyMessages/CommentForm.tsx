import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AnimatedButton from '@/Components/AnimatedButton';
import { useGuestFormData } from '@/Hooks/useGuestData';
import FormCard from '@/Components/Forms/FormCard';
import FormHeader from '@/Components/Forms/FormHeader';
import ContactFields from '@/Components/Forms/ContactFields';
import TextareaWithCounter from '@/Components/Forms/TextareaWithCounter';

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
    <FormCard>
      <FormHeader
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        title="Tulis Komentar"
        iconBgColor="orange"
      />

      <form onSubmit={submit} className="space-y-4">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-warning-soft border border-warning-border rounded-lg flex items-center justify-between">
            <span className="text-sm text-warning-strong">
              Membalas ke <strong>{replyingTo}</strong>
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-warning-strong hover:text-warning-strong font-medium transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        )}

        {/* Guest fields - only show if not authenticated */}
        {!isAuthenticated && (
          <ContactFields
            nameField="guest_name"
            emailField="guest_email"
            phoneField="guest_phone"
            nameValue={data.guest_name}
            emailValue={data.guest_email}
            phoneValue={data.guest_phone}
            onNameChange={(value) => setData('guest_name', value)}
            onEmailChange={(value) => setData('guest_email', value)}
            onPhoneChange={(value) => setData('guest_phone', value)}
            nameError={errors.guest_name}
            emailError={errors.guest_email}
            phoneError={errors.guest_phone}
            showBackground={false}
          />
        )}

        {/* Comment message */}
        <TextareaWithCounter
          id="message"
          label="Komentar *"
          value={data.message}
          onChange={(value) => setData('message', value)}
          error={errors.message}
          maxLength={1000}
          rows={4}
          placeholder="Tulis komentar Anda di sini..."
          required
          focusColor="blue"
        />

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
    </FormCard>
  );
}

