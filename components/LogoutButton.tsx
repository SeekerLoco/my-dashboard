// Header button that shows who is signed in and signs them out; AuthGuard then sends them to /login.
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LogoutButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="hidden sm:inline text-sm text-white/60">{email}</span>
      )}
      <button
        onClick={() => supabase.auth.signOut()}
        className="px-3 py-1.5 rounded-xl text-sm bg-white/10 border border-white/10 hover:bg-white/20 transition"
      >
        Log out
      </button>
    </div>
  );
}
