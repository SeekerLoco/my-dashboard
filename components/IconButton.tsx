// Small square icon button (e.g. refresh, show/hide) with dark/light styling.
import type { ReactNode } from 'react';

type IconButtonProps = {
  dark: boolean;
  onClick?: () => void;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: ReactNode;
};

export default function IconButton({
  dark,
  onClick,
  title,
  type,
  className,
  children,
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-sm ${
        dark
          ? 'bg-slate-700 hover:bg-slate-600'
          : 'bg-slate-200 hover:bg-slate-300'
      }${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
