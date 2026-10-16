// Shared dashboard card wrapper with dark/light styling.
import type { ReactNode } from 'react';

type CardProps = {
  dark: boolean;
  className?: string;
  children: ReactNode;
};

export default function Card({ dark, className, children }: CardProps) {
  return (
    <div
      className={`rounded-xl p-5 border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </div>
  );
}
