import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FirebaseSetupBanner } from '../components/FirebaseSetupBanner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid credentials or login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090711] text-slate-100 flex flex-col justify-between relative overflow-hidden px-4 py-8 sm:py-12">
      {/* Ambient background glow */}
      <div className="ambient-glow-purple -top-20 -left-20" />
      <div className="ambient-glow-gold -bottom-20 -right-20" />

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between relative z-10 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 p-0.5 shadow-md">
            <div className="w-full h-full bg-[#0d0a1a] rounded-[6px] flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">AI DRAMA</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto relative z-10">
        <FirebaseSetupBanner />

        <div className="drama-card p-6 sm:p-8 rounded-2xl border border-purple-900/40 shadow-2xl bg-[#110d22]/90 backdrop-blur-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Log in to your African AI drama production studio.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>

              {error.includes('Firebase Authentication has not been activated') && (
                <div className="pt-2 border-t border-rose-500/30 flex flex-col sm:flex-row gap-2 mt-1">
                  <a
                    href="https://console.firebase.google.com/project/ai-drama-creator/authentication"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    Open Firebase Auth Console →
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-950/30 border border-purple-900/50 text-white placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-950/30 border border-purple-900/50 text-white placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 text-sm transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 gold-gradient-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-5 border-t border-purple-900/40 text-center text-xs text-slate-400">
            <span>Don&apos;t have an account yet? </span>
            <Link to="/signup" className="font-bold text-amber-400 hover:text-amber-300 ml-1">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-purple-300/60 relative z-10 mt-6">
        Encrypted session verification via secure HTTP-only backend cookies.
      </div>
    </div>
  );
};
