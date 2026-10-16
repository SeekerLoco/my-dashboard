// Login page: email/password sign-in, then back to the dashboard.
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Signs in with Supabase Auth (email + password)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen text-white flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="panel w-full max-w-sm p-6">
        <h1 className="text-xl font-bold mb-4">Log in</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-white/5 border border-white/10"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-white/5 border border-white/10"
          required
        />

        <button
          type="submit"
          className="w-full py-2 bg-indigo-500/70 hover:bg-indigo-500 rounded"
        >
          Log in
        </button>

        {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
      </form>
    </main>
  );
}
