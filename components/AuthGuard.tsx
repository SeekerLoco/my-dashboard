// Sends signed-out visitors to /login; hides page content until the Supabase session (stored in localStorage) is checked.
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Pages anyone can open without signing in.
const PUBLIC_PATHS = ['/login'];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Reads the current session from Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });
    // Keeps up with sign-in/sign-out (including in other tabs)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPublic && signedIn === false) router.replace('/login');
  }, [isPublic, signedIn, router]);

  if (isPublic) return <>{children}</>;
  // Render nothing until the session is confirmed, so no page content flashes before a redirect
  if (!signedIn) return null;
  return <>{children}</>;
}
