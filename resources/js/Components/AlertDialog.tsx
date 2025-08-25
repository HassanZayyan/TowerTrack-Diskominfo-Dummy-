import React from 'react';
import Modal from './Modal';

interface AlertDialogProps {
  show: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  show,
  onClose,
  type,
  title,
  message,
  confirmText = 'OK',
  onConfirm
}) => {
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: (
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'info':
      default:
        return {
          icon: (
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const { icon, bgColor, textColor, buttonColor } = getIconAndColors();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md" closeable={true}>
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className={`rounded-full p-3 ${bgColor}`}>
            {icon}
          </div>
        </div>
        
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>
            {title}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors duration-200 ${buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;