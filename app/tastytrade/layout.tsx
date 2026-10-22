// tastytrade section layout: shared page shell for the hub and the five step pages.
import type { ReactNode } from 'react';

export default function TastytradeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="min-h-screen p-6 text-white">{children}</main>;
}
