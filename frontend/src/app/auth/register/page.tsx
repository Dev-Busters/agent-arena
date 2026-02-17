'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        { email, username, password }
      )

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce: Math.random().toString(36).substring(2)
    })}`
    window.location.href = googleUrl
  }

  const handleDiscordLogin = () => {
    const discordUrl = `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/auth/discord/callback`,
      response_type: 'code',
      scope: 'identify email'
    })}`
    window.location.href = discordUrl
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3] flex items-center justify-center p-4">
      {/* Subtle center glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-600/10 via-amber-900/5 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Title */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl font-display font-black tracking-tight"
            style={{
              background: 'linear-gradient(180deg, #f5e6b8, #d4a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            AGENT ARENA
          </motion.h1>
        </div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-gradient-to-br from-[rgba(26,26,40,0.95)] to-[rgba(14,14,22,0.98)] border border-[#2a2a3d] rounded-lg p-8 overflow-hidden"
        >
          {/* Top shimmer edge */}
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#92600a] to-transparent" />

          <h2 className="text-lg font-black uppercase tracking-widest text-[#d4a843] mb-6">
            Forge Your Legend
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-[#d44040]/20 border border-[#d44040]/50 rounded text-[#d44040] text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-8">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={handleDiscordLogin}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a0a0f] border border-l-4 border-l-[#5865F2] border-[#2a2a3d] text-[#e8e6e3] font-semibold rounded hover:bg-[#1a1a2e] transition-all"
            >
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Continue with Discord
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={handleGoogleLogin}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a0a0f] border border-l-4 border-l-[#1f2937] border-[#2a2a3d] text-[#e8e6e3] font-semibold rounded hover:bg-[#1a1a2e] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </motion.button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="h-px bg-[#2a2a3d]" />
            <div className="absolute inset-0 flex justify-center">
              <span className="px-3 bg-[rgba(26,26,40,0.95)] text-xs text-[#6b7280] uppercase tracking-widest">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af] mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[#2a2a3d] rounded text-[#e8e6e3] placeholder-[#6b7280] focus:outline-none focus:border-[#92600a] transition-all"
                placeholder="CoolAgent2026"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[#2a2a3d] rounded text-[#e8e6e3] placeholder-[#6b7280] focus:outline-none focus:border-[#92600a] transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[#2a2a3d] rounded text-[#e8e6e3] placeholder-[#6b7280] focus:outline-none focus:border-[#92600a] transition-all"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[#2a2a3d] rounded text-[#e8e6e3] placeholder-[#6b7280] focus:outline-none focus:border-[#92600a] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 mt-6 bg-[#d4a843] text-[#0a0a0f] font-bold uppercase tracking-widest rounded hover:shadow-[0_0_20px_rgba(212,168,67,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Forging...' : 'Begin'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[#9ca3af] text-sm">
            Returning champion?{' '}
            <Link
              href="/auth/login"
              className="text-[#d4a843] hover:text-[#fbbf24] font-semibold transition-colors"
            >
              Enter →
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </main>
  )
}
