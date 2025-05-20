import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

type FormData = {
  email: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw error
      }

      if (data) {
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to register. Please try again.')
      } else {
        setError('Failed to register. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Register | Armenian Real Estate</title>
        <meta name="description" content="Create an account on Armenian Real Estate" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            <Link href="/" className="hover:text-gray-700">
              Armenian Real Estate
            </Link>
          </h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-900 hover:text-gray-700">
              Home
            </Link>
            <Link href="/register" className="text-gray-900 hover:text-gray-700 font-semibold">
              Register
            </Link>
            <Link href="/dashboard" className="text-gray-900 hover:text-gray-700">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create an Account</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">© {new Date().getFullYear()} Armenian Real Estate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 