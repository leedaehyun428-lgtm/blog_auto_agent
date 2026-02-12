import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  autoCloseMs?: number;
  className?: string;
}

const TYPE_CLASS: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white',
};

export default function Toast({
  message,
  type = 'info',
  onClose,
  autoCloseMs = 3000,
  className = '',
}: ToastProps) {
  useEffect(() => {
    if (!onClose || autoCloseMs <= 0) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [onClose, autoCloseMs]);

  return (
    <div className={`rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${TYPE_CLASS[type]} ${className}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
