// Shared dashboard card wrapper, dark styled.
import type { ReactNode } from 'react';

type CardProps = {
  className?: string;
  children: ReactNode;
};

export default function Card({ className, children }: CardProps) {
  return (
    <div
      className={`rounded-xl p-5 border bg-slate-900 border-slate-800${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </div>
  );
}
