import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, ArrowLeft, Loader2, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FirebaseSetupBanner } from '../components/FirebaseSetupBanner';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, firebaseConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form client validations
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(fullName, email, password, confirmPassword);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Failed to create your account.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.');
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
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Start building cinematic African AI drama videos today.
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

              {error.includes('Firestore Database has not been created') && (
                <div className="pt-2 border-t border-rose-500/30 flex flex-col sm:flex-row gap-2 mt-1">
                  <a
                    href="https://console.firebase.google.com/project/ai-drama-creator/firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    Create Firestore Database →
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chinedu Okafor"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-950/30 border border-purple-900/50 text-white placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 text-sm transition-all"
                />
              </div>
            </div>

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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-5 border-t border-purple-900/40 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-amber-400 hover:text-amber-300 ml-1">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-purple-300/60 relative z-10 mt-6">
        Protected by secure HTTP-only session cookies & Firestore backend encryption.
      </div>
    </div>
  );
};
