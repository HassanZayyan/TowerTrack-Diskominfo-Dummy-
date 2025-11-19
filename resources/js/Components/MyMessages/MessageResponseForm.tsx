import React, { useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import AnimatedButton from '@/Components/AnimatedButton';
import { useGuestFormData } from '@/Hooks/useGuestData';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setData('attachments', files);
  };

  const handleRemoveFile = () => {
    setData('attachments', []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0l-4-4m4 4l-4 4M4 6h16M4 18h16" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{heading}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {requiresContact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div>
              <InputLabel htmlFor="response_sender_name" value="Nama" />
              <TextInput
                id="response_sender_name"
                type="text"
                value={data.sender_name}
                onChange={(event) => setData('sender_name', event.target.value)}
                className="mt-1 block w-full"
                placeholder="Masukkan nama Anda"
                required
                disabled={lockContactFields}
              />
              <InputError message={errors.sender_name} className="mt-1" />
            </div>
            <div>
              <InputLabel htmlFor="response_email" value="Email" />
              <TextInput
                id="response_email"
                type="email"
                value={data.email}
                onChange={(event) => setData('email', event.target.value)}
                className="mt-1 block w-full"
                placeholder="contoh@email.com"
                required
                disabled={lockContactFields}
              />
              <InputError message={errors.email} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <InputLabel htmlFor="response_phone" value="Nomor Telepon" />
              <TextInput
                id="response_phone"
                type="tel"
                value={data.phone}
                onChange={(event) => setData('phone', event.target.value)}
                className="mt-1 block w-full"
                placeholder="08xx-xxxx-xxxx"
                required
                disabled={lockContactFields}
              />
              <InputError message={errors.phone} className="mt-1" />
            </div>
          </div>
        )}

        <div>
          <InputLabel htmlFor="response_message" value="Pesan Balasan" />
          <textarea
            id="response_message"
            value={data.message}
            onChange={(event) => setData('message', event.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
            rows={4}
            placeholder="Tulis balasan Anda di sini..."
            required
            maxLength={1000}
          />
          <InputError message={errors.message} className="mt-1" />
          <p className="mt-1 text-sm text-gray-500">{data.message.length}/1000 karakter</p>
        </div>

        <div>
          <InputLabel htmlFor="response_attachments" value="Lampiran (opsional)" />
          <input
            id="response_attachments"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            accept="image/jpeg,image/png,image/jpg,video/mp4,video/mov,video/avi,video/mkv"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format yang didukung: jpg, jpeg, png, mp4, mov, avi, mkv (maks 100MB per file)
          </p>
          <InputError message={errors.attachments} className="mt-1" />
          <InputError message={fieldErrors['attachments.0']} className="mt-1" />

          {data.attachments && data.attachments.length > 0 && (
            <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600">
              <span>{data.attachments.length} file siap diunggah</span>
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-800 font-medium"
                onClick={handleRemoveFile}
              >
                Hapus
              </button>
            </div>
          )}

          {typeof progress?.percentage === 'number' && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          )}
        </div>

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
    </div>
  );
}


