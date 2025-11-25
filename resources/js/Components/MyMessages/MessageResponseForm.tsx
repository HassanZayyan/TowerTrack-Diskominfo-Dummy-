import React, { useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AnimatedButton from '@/Components/AnimatedButton';
import { useGuestFormData } from '@/Hooks/useGuestData';
import FormCard from '@/Components/Forms/FormCard';
import FormHeader from '@/Components/Forms/FormHeader';
import ContactFields from '@/Components/Forms/ContactFields';
import TextareaWithCounter from '@/Components/Forms/TextareaWithCounter';
import FileUploadWithProgress from '@/Components/Forms/FileUploadWithProgress';

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

  const { data, setData, post, processing, errors, reset, progress } = useForm<FormDataState>({
    message: '',
    sender_name: guestFormData.name,
    email: guestFormData.email,
    phone: guestFormData.phone,
    attachments: [],
  });
  const fieldErrors = errors as Record<string, string | undefined>;

  const routeName =
    type === 'report' ? 'public.reports.responses.store' : 'public.feedbacks.responses.store';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    post(route(routeName, id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        if (onSuccess) {
          onSuccess();
        }
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
        iconBgColor="indigo"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {requiresContact && (
          <ContactFields
            nameField="response_sender_name"
            emailField="response_email"
            phoneField="response_phone"
            nameValue={data.sender_name}
            emailValue={data.email}
            phoneValue={data.phone}
            onNameChange={(value) => setData('sender_name', value)}
            onEmailChange={(value) => setData('email', value)}
            onPhoneChange={(value) => setData('phone', value)}
            nameError={errors.sender_name}
            emailError={errors.email}
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


