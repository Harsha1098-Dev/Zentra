import React from 'react';

// Design tokens reference:
// Primary Navy: #1E3A8A
// Primary Hover: #1D4ED8
// Primary Soft: #E0E7FF
// App background: #F6F8FB
// Surface: #FFFFFF
// Border: #E2E8F0
// Text: #0F172A
// Secondary Text: #475569
// Muted Text: #64748B

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variants = {
    primary: 'bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] focus:ring-[#1E3A8A]',
    secondary: 'bg-[#E0E7FF] text-[#1E3A8A] hover:bg-indigo-100 focus:ring-[#1E3A8A]',
    outline: 'border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-slate-50 focus:ring-[#1E3A8A]',
    danger: 'bg-[#DC2626] text-white hover:bg-red-700 focus:ring-[#DC2626]',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const styles = {
    success: 'bg-emerald-50 text-[#059669] border-emerald-200',
    warning: 'bg-amber-50 text-[#D97706] border-amber-200',
    danger: 'bg-red-50 text-[#DC2626] border-red-200',
    info: 'bg-blue-50 text-[#2563EB] border-blue-200',
    neutral: 'bg-slate-50 text-[#475569] border-[#E2E8F0]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
