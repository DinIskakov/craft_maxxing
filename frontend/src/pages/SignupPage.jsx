import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        const { data, error } = await signUp(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else if (data?.user?.identities?.length === 0) {
            setError('An account with this email already exists')
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            // If email confirmation is disabled in Supabase, navigate directly
            // Otherwise show success message
            if (data?.session) {
                navigate('/setup')
            }
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-serif text-stone-900 mb-2">Check your email</h2>
                        <p className="text-stone-500 mb-6">
                            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                            Click the link to activate your account.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-stone-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-stone-800 transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <h1 className="text-4xl font-serif italic text-stone-900">CraftMaxxing</h1>
                    </Link>
                    <p className="text-stone-500 mt-2">Create your account to start learning.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-stone-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-stone-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-stone-900 font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
