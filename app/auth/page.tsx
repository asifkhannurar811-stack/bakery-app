'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/'); 
    } else {
      // Signup
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        // اگر ای میل کنفرمیشن آن ہو تو یہ میسج دکھائیں
        alert('Signup successful! A verification code/link has been sent to your email. Please verify and then login.');
        setIsLogin(true); // اب لاگ اِن والے پیج پر لے جائیں
      } else if (data.session) {
        // اگر ای میل کنفرمیشن آف ہو تو سیدھا لاگ اِن کر دیں
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-amber-50/50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-200">
        <h2 className="text-3xl font-extrabold text-stone-800 text-center mb-6">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>
        
        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-900"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-900"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-stone-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-red-600 font-semibold hover:underline cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
