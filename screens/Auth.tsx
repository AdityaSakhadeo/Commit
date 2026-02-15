import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { User as UserType } from '../types';

interface AuthProps {
  mode: 'LOGIN' | 'SIGNUP';
  onAuthSuccess: (user: UserType) => void;
  onSwitchMode: () => void;
}

export default function Auth({ mode, onAuthSuccess, onSwitchMode }: AuthProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 800));

    if (mode === 'SIGNUP') {
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      const result = StorageService.signup(name, email, password);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.message || 'Signup failed');
      }
    } else {
      if (!email || !password) {
        setError('Please enter email and password');
        setLoading(false);
        return;
      }
      const result = StorageService.login(email, password);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.message || 'Login failed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500">
            {mode === 'LOGIN' 
              ? 'Enter your details to access your goals.' 
              : 'Join the community and start achieving.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                  placeholder="John Doe"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                placeholder="hello@example.com"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            {mode === 'SIGNUP' && (
              <div className="text-[10px] text-slate-400 px-1 pt-1 leading-tight">
                Must include: 8+ chars, uppercase, lowercase, number, special char.
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {mode === 'LOGIN' ? 'Log In' : 'Sign Up'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          {mode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setError('');
              onSwitchMode();
            }}
            className="text-teal-600 font-bold hover:underline"
          >
            {mode === 'LOGIN' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}