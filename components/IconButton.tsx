// Small square icon button (e.g. refresh, show/hide), dark styled.
import type { ReactNode } from 'react';

type IconButtonProps = {
  onClick?: () => void;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: ReactNode;
};

export default function IconButton({
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
      className={`w-7 h-7 flex items-center justify-center rounded-md text-sm bg-slate-700 hover:bg-slate-600${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
