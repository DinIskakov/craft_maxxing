import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Loader2 } from 'lucide-react'
import { profileApi } from '../lib/api'

export default function UsernameSetupPage() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [isAvailable, setIsAvailable] = useState(null)
    const [checking, setChecking] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // Debounced username availability check
    useEffect(() => {
        if (username.length < 3) {
            setIsAvailable(null)
            return
        }

        const timer = setTimeout(async () => {
            setChecking(true)
            try {
                const result = await profileApi.checkUsername(username)
                setIsAvailable(result.available)
            } catch {
                setIsAvailable(null)
            }
            setChecking(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [username])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!isAvailable) {
            setError('Please choose an available username')
            return
        }

        setLoading(true)
        try {
            await profileApi.createProfile(username, displayName || username, bio)
            navigate('/setup')
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-stone-900 mb-2">Choose Your Username</h1>
                    <p className="text-stone-500">This is how other users will find and challenge you.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-stone-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">@</span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                                    placeholder="your_username"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    className="w-full pl-8 pr-12 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {checking && <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />}
                                    {!checking && isAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                                    {!checking && isAvailable === false && <X className="w-5 h-5 text-red-500" />}
                                </div>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                                3 or more characters
                            </p>
                            {isAvailable === false && (
                                <p className="text-xs text-red-500 mt-1">This username is already taken</p>
                            )}
                        </div>

                        {/* Display Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-stone-700 mb-2">
                                Display Name <span className="text-stone-400">(optional)</span>
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-stone-700 mb-2">
                                Bio <span className="text-stone-400">(optional)</span>
                            </label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="What do you want to learn?"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isAvailable}
                            className="w-full bg-stone-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Profile...' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
