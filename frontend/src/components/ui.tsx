import React, { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-blood-600 to-blood-700 hover:from-blood-700 hover:to-blood-800 text-white shadow-sm shadow-blood-600/25 focus:ring-blood-600 active:scale-[0.98]',
    secondary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-800 active:scale-[0.98]',
    outline:
      'border border-slate-300/90 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-slate-400 active:scale-[0.98]',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-emerald-600 active:scale-[0.98]',
    danger:
      'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-400 active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
          {required && <span className="ml-1 text-blood-600">*</span>}
        </span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-blood-600" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blood-600 focus:bg-white focus:ring-4 focus:ring-blood-500/10 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
      {...props}
    />
  );
}

export function Status({
  children,
  kind = 'error',
}: {
  children: ReactNode;
  kind?: 'error' | 'success' | 'warning' | 'info';
}) {
  const styles = {
    error: {
      bg: 'bg-rose-50/90 border-rose-200 text-rose-800',
      icon: <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />,
    },
    success: {
      bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />,
    },
    warning: {
      bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
    },
    info: {
      bg: 'bg-blue-50/90 border-blue-200 text-blue-800',
      icon: <Info className="h-4 w-4 shrink-0 text-blue-600" />,
    },
  }[kind];

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm font-medium ${styles.bg}`}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1 leading-snug">{children}</div>
    </div>
  );
}

export function BloodBadge({
  group,
  size = 'md',
  className = '',
}: {
  group: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: 'h-8 px-2 text-xs rounded-lg',
    md: 'h-12 w-12 text-base rounded-xl',
    lg: 'h-16 w-16 text-xl rounded-2xl',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-extrabold tracking-tight bg-gradient-to-br from-blood-600 via-blood-700 to-blood-900 text-white shadow-sm shadow-blood-900/20 select-none ${sizeMap[size]} ${className}`}
    >
      {group}
    </span>
  );
}

export function UrgencyBadge({
  neededBy,
}: {
  neededBy: 'asap' | 'today' | '48h';
}) {
  if (neededBy === 'asap') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
        </span>
        Immediate / ASAP
      </span>
    );
  }

  if (neededBy === 'today') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Needed Today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Within 48 Hours
    </span>
  );
}
