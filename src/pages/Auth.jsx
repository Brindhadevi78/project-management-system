import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      // Auto sign in right after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError('Account created! Please sign in.')
    }

    setLoading(false)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-slate-900"
      style={{
        backgroundImage: "url('/auth-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply pointer-events-none"></div>

      <div className="glass-dark p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/10 m-4">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-3xl leading-none tracking-tighter">P</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 text-white tracking-tight">ProjectHub</h1>
        <h2 className="text-sm font-medium text-center mb-8 text-slate-400">
          {isLogin ? 'Sign in to access your workspace' : 'Create an account to get started'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder-slate-600 text-sm transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-900/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder-slate-600 text-sm transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 rounded-xl hover:from-brand-500 hover:to-brand-400 hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-300 font-semibold tracking-wide disabled:opacity-50 mt-2"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-brand-400 font-semibold hover:text-brand-300 hover:underline transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
