import React, { useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AnimatedButton from '@/Components/AnimatedButton';
import { useGuestFormData } from '@/Hooks/useGuestData';
import FormCard from '@/Components/Forms/FormCard';
import FormHeader from '@/Components/Forms/FormHeader';
import ContactFields from '@/Components/Forms/ContactFields';
import TextareaWithCounter from '@/Components/Forms/TextareaWithCounter';
import FileUploadWithProgress from '@/Components/Forms/FileUploadWithProgress';
import InputError from '@/Components/InputError';

type MessageType = 'report' | 'feedback';

interface MessageResponseFormProps {
  type: MessageType;
  id: number;
  canRespond: boolean;
  defaultSenderName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
  heading?: string;
  description?: string;
  onSuccess?: () => void;
  showContactFields?: boolean;
  lockContactFields?: boolean;
}

type FormDataState = {
  message: string;
  sender_name: string;
  email: string;
  phone: string;
  attachments: File[];
};

export default function MessageResponseForm({
  type,
  id,
  canRespond,
  defaultSenderName = '',
  defaultEmail = '',
  defaultPhone = '',
  heading = 'Kirim Balasan',
  description,
  onSuccess,
  showContactFields,
  lockContactFields = false,
}: MessageResponseFormProps) {
  const { auth } = usePage().props as any;
  const isAuthenticated = Boolean(auth?.user);

  if (!canRespond) {
    return null;
  }

  const requiresContact = showContactFields ?? !isAuthenticated;

  // Auto-fill from cookie if available and no default values provided
  const guestFormData = useGuestFormData({
    name: defaultSenderName || undefined,
    email: defaultEmail || undefined,
    phone: defaultPhone || undefined,
  });

  const { data, setData, post, processing, errors, reset, progress, setError } = useForm<FormDataState>({
    message: '',
    sender_name: guestFormData.name,
    email: guestFormData.email,
    phone: guestFormData.phone,
    attachments: [],
  });
  const fieldErrors = errors as Record<string, string | undefined>;
  const [customError, setCustomError] = useState<string | null>(null);

  const routeName =
    type === 'report' ? 'public.reports.responses.store' : 'public.feedbacks.responses.store';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setCustomError(null); // Clear previous error

    post(route(routeName, id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setCustomError(null);
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (errors) => {
        // Handle 403 errors specifically
        if (errors.email || errors.message) {
          // If there's an email error, set it as custom error
          const errorMessage = errors.email || errors.message || 'Terjadi kesalahan saat mengirim balasan.';
          setCustomError(errorMessage);
          setError('email', errorMessage);
        }
      },
      onFinish: () => {
        // This runs after both success and error
      },
    });
  };

  const handleFilesChange = (files: File[]) => {
    setData('attachments', files);
  };

  return (
    <FormCard className="mb-4">
      <FormHeader
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0l-4-4m4 4l-4 4M4 6h16M4 18h16" />
          </svg>
        }
        title={heading}
        description={description}
        iconBgColor="red"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display custom error message for 403 errors */}
        {customError && (
          <div className="rounded-lg bg-destructive-soft border border-destructive-border p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-destructive-strong mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive-strong">{customError}</p>
              </div>
            </div>
          </div>
        )}

        {requiresContact && (
          <ContactFields
            nameField="response_sender_name"
            emailField="response_email"
            phoneField="response_phone"
            nameValue={data.sender_name}
            emailValue={data.email}
            phoneValue={data.phone}
            onNameChange={(value) => {
              setData('sender_name', value);
              setCustomError(null); // Clear error when user types
            }}
            onEmailChange={(value) => {
              setData('email', value);
              setCustomError(null); // Clear error when user types
            }}
            onPhoneChange={(value) => {
              setData('phone', value);
              setCustomError(null); // Clear error when user types
            }}
            nameError={errors.sender_name}
            emailError={customError || errors.email}
            phoneError={errors.phone}
            phoneRequired={true}
            disabled={lockContactFields}
            showBackground={true}
          />
        )}

        <TextareaWithCounter
          id="response_message"
          label="Pesan Balasan"
          value={data.message}
          onChange={(value) => setData('message', value)}
          error={errors.message}
          maxLength={1000}
          rows={4}
          placeholder="Tulis balasan Anda di sini..."
          required
          focusColor="indigo"
        />

        <FileUploadWithProgress
          id="response_attachments"
          label="Lampiran (opsional)"
          files={data.attachments}
          onFilesChange={handleFilesChange}
          progress={progress?.percentage}
          maxSizeMB={100}
          error={errors.attachments}
          fieldError={fieldErrors['attachments.0']}
          colorScheme="indigo"
        />

        <div className="flex justify-end">
          <AnimatedButton
            type="submit"
            variant="primary"
            size="md"
            animation="scale"
            loading={processing}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            {processing ? 'Mengirim...' : 'Kirim Balasan'}
          </AnimatedButton>
        </div>
      </form>
    </FormCard>
  );
}


