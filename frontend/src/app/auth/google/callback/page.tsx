'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Authenticating with Google...')

  useEffect(() => {
    handleGoogleCallback()
  }, [])

  const handleGoogleCallback = async () => {
    try {
      // Get the ID token from URL hash
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const idToken = params.get('id_token')

      if (!idToken) {
        setError('No authentication token received from Google')
        return
      }

      setStatus('Verifying your identity...')

      // Send to our backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
        { idToken }
      )

      setStatus('Setting up your account...')

      // Store tokens
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Redirect based on new user or existing
      if (response.data.isNew) {
        setStatus('Welcome to Agent Arena! Redirecting...')
        setTimeout(() => router.push('/agent/create'), 1000)
      } else {
        setStatus('Welcome back! Redirecting...')
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } catch (err: any) {
      console.error('Google callback error:', err)
      setError(err.response?.data?.error || 'Authentication failed')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {error ? (
          <>
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-4">Authentication Failed</h1>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 transition-all"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-4 inline-block"
            >
              🎮
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">{status}</h1>
            <div className="flex justify-center">
              <div className="w-12 h-1 bg-cyan-500 rounded-full animate-pulse" />
            </div>
          </>
        )}
      </motion.div>
    </main>
  )
}
