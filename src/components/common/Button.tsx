import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-slate-800 text-white hover:bg-slate-900',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  fullWidth = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
