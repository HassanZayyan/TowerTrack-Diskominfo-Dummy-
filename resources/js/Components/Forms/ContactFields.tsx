import React from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface ContactFieldsProps {
  // Field names (flexible untuk berbagai form)
  nameField: string;
  emailField: string;
  phoneField: string;
  
  // Values
  nameValue: string;
  emailValue: string;
  phoneValue: string;
  
  // Handlers
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  
  // Errors
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  
  // Options
  phoneRequired?: boolean;
  disabled?: boolean;
  showBackground?: boolean;
  className?: string;
}

/**
 * Reusable Contact Fields Component
 * DRY: Eliminates duplication of name, email, and phone input fields across forms
 * 
 * @example
 * ```tsx
 * <ContactFields
 *   nameField="guest_name"
 *   emailField="guest_email"
 *   phoneField="guest_phone"
 *   nameValue={data.guest_name}
 *   emailValue={data.guest_email}
 *   phoneValue={data.guest_phone}
 *   onNameChange={(value) => setData('guest_name', value)}
 *   onEmailChange={(value) => setData('guest_email', value)}
 *   onPhoneChange={(value) => setData('guest_phone', value)}
 *   nameError={errors.guest_name}
 *   emailError={errors.guest_email}
 *   phoneError={errors.guest_phone}
 * />
 * ```
 */
export default function ContactFields({
  nameField,
  emailField,
  phoneField,
  nameValue,
  emailValue,
  phoneValue,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  nameError,
  emailError,
  phoneError,
  phoneRequired = false,
  disabled = false,
  showBackground = true,
  className = '',
}: ContactFieldsProps) {
  const containerClasses = showBackground
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted border border-border rounded-lg p-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div>
        <InputLabel htmlFor={nameField} value="Nama *" />
        <TextInput
          id={nameField}
          type="text"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          className="mt-1 block w-full"
          placeholder="Masukkan nama Anda"
          required
          disabled={disabled}
        />
        <InputError message={nameError} className="mt-1" />
      </div>

      <div>
        <InputLabel htmlFor={emailField} value="Email *" />
        <TextInput
          id={emailField}
          type="email"
          value={emailValue}
          onChange={(e) => onEmailChange(e.target.value)}
          className="mt-1 block w-full"
          placeholder="contoh@email.com"
          required
          disabled={disabled}
        />
        <InputError message={emailError} className="mt-1" />
      </div>

      <div className="sm:col-span-2">
        <InputLabel 
          htmlFor={phoneField} 
          value={phoneRequired ? "No. Telepon *" : "No. Telepon (Opsional)"} 
        />
        <TextInput
          id={phoneField}
          type="tel"
          value={phoneValue}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="mt-1 block w-full"
          placeholder="08xx-xxxx-xxxx"
          required={phoneRequired}
          disabled={disabled}
        />
        <InputError message={phoneError} className="mt-1" />
      </div>
    </div>
  );
}

