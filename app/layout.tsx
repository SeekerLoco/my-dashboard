// Root layout: page title, fonts, the <html>/<body> wrapper, and the login check for every page.
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import AuthGuard from '@/components/AuthGuard';

// Poppins, applied site-wide through the --font-poppins CSS variable (see globals.css)
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'SeekerLoco Hub',
  description: 'Personal Dashboard for SeekerLoco',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
