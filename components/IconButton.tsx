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
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm bg-white/10 hover:bg-white/20 border border-white/10${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
