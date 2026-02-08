import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, Calendar, Swords, X, Clock } from 'lucide-react'
import { profileApi, challengeApi } from '../lib/api'

const RESPONSE_OPTIONS = [
    { days: 1, label: '1 day', desc: 'They have 24 hours to respond' },
    { days: 3, label: '3 days', desc: 'They have 3 days to respond' },
    { days: 7, label: '1 week', desc: 'They have a week to respond' },
]

export default function NewChallengePage() {
    const [step, setStep] = useState(1) // 1: select opponent, 2: set skills & deadline
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [selectedOpponent, setSelectedOpponent] = useState(null)
    const [mySkill, setMySkill] = useState('')
    const [theirSkill, setTheirSkill] = useState('')
    const [sameSkill, setSameSkill] = useState(true)
    const [deadline, setDeadline] = useState('')
    const [responseDays, setResponseDays] = useState(3)
    const [message, setMessage] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Load opponent from URL query if provided
    useEffect(() => {
        const opponentUsername = searchParams.get('opponent')
        if (opponentUsername) {
            loadOpponentFromUrl(opponentUsername)
        }
    }, [searchParams])

    const loadOpponentFromUrl = async (username) => {
        try {
            const opponent = await profileApi.getProfileByUsername(username)
            if (opponent) {
                setSelectedOpponent(opponent)
                setStep(2)
            }
        } catch {
            // Opponent not found, stay on step 1
        }
    }

    // Search for users
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const results = await profileApi.searchUsers(searchQuery)
                setSearchResults(results)
            } catch {
                setSearchResults([])
            }
            setSearching(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSelectOpponent = (user) => {
        setSelectedOpponent(user)
        setSearchQuery('')
        setSearchResults([])
        setStep(2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!mySkill.trim()) {
            setError('Please enter a skill for yourself')
            return
        }

        const opponentSkill = sameSkill ? mySkill : theirSkill
        if (!opponentSkill.trim()) {
            setError('Please enter a skill for your opponent')
            return
        }

        if (!deadline) {
            setError('Please set a challenge deadline')
            return
        }

        setLoading(true)
        try {
            await challengeApi.createChallenge(
                selectedOpponent.username,
                mySkill,
                opponentSkill,
                new Date(deadline),
                message,
                responseDays
            )
            navigate('/challenges')
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    // Calculate min deadline (tomorrow) and max (6 months)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 6)

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => step === 1 ? navigate('/challenges') : setStep(1)}
                        className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-medium text-stone-900">
                        {step === 1 ? 'Challenge Someone' : 'Set Up Challenge'}
                    </h1>
                </div>
            </header>

            <div className="px-6 py-6 max-w-2xl mx-auto">
                {step === 1 ? (
                    /* Step 1: Search and select opponent */
                    <div>
                        <p className="text-stone-500 mb-4">
                            Search for a user to challenge them to learn a new skill.
                        </p>

                        {/* Search input */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by @username..."
                                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                                autoFocus
                            />
                        </div>

                        {/* Search results */}
                        {searching ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900"></div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectOpponent(user)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-stone-900">@{user.username}</p>
                                            {user.display_name && (
                                                <p className="text-sm text-stone-500">{user.display_name}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchQuery.length >= 2 ? (
                            <div className="text-center py-8 text-stone-500">
                                No users found matching &quot;{searchQuery}&quot;
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-400">
                                Type at least 2 characters to search
                            </div>
                        )}
                    </div>
                ) : (
                    /* Step 2: Set skills and deadline */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Selected opponent */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {selectedOpponent?.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Challenging</p>
                                    <p className="font-medium text-stone-900">@{selectedOpponent?.username}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>

                        {/* Same skill toggle */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-stone-900">Same skill for both</span>
                                <div
                                    className={`w-12 h-6 rounded-full relative transition-colors ${sameSkill ? 'bg-stone-900' : 'bg-stone-300'
                                        }`}
                                    onClick={() => setSameSkill(!sameSkill)}
                                >
                                    <div
                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${sameSkill ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                    />
                                </div>
                            </label>
                            <p className="text-sm text-stone-500 mt-2">
                                {sameSkill
                                    ? 'Both of you will learn the same skill'
                                    : 'Each person learns a different skill'}
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    {sameSkill ? 'Skill to learn' : 'Your skill'}
                                </label>
                                <input
                                    type="text"
                                    value={mySkill}
                                    onChange={(e) => setMySkill(e.target.value)}
                                    placeholder="e.g., Playing Guitar"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                                />
                            </div>

                            {!sameSkill && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Their skill
                                    </label>
                                    <input
                                        type="text"
                                        value={theirSkill}
                                        onChange={(e) => setTheirSkill(e.target.value)}
                                        placeholder="e.g., Learning Spanish"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Response window */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200">
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Time to respond
                            </label>
                            <p className="text-xs text-stone-400 mb-3">
                                How long does @{selectedOpponent?.username} have to accept or decline?
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {RESPONSE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.days}
                                        type="button"
                                        onClick={() => setResponseDays(opt.days)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                                            responseDays === opt.days
                                                ? 'border-stone-900 bg-stone-50'
                                                : 'border-stone-200 hover:border-stone-300'
                                        }`}
                                    >
                                        <Clock className={`w-4 h-4 ${responseDays === opt.days ? 'text-stone-900' : 'text-stone-400'}`} />
                                        <span className={`text-sm font-medium ${responseDays === opt.days ? 'text-stone-900' : 'text-stone-600'}`}>
                                            {opt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-stone-500 mt-2 text-center">
                                {RESPONSE_OPTIONS.find(o => o.days === responseDays)?.desc}
                                {' '}If they don&apos;t respond, the challenge expires and you can challenge someone else.
                            </p>
                        </div>

                        {/* Challenge Deadline */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200">
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Challenge deadline
                            </label>
                            <p className="text-xs text-stone-400 mb-2">
                                When does the challenge end?
                            </p>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    min={tomorrow.toISOString().split('T')[0]}
                                    max={maxDate.toISOString().split('T')[0]}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Optional message */}
                        <div className="bg-white rounded-xl p-4 border border-stone-200">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Message <span className="text-stone-400">(optional)</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a message to your challenge..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-colors resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-stone-900 text-white py-4 px-6 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Swords className="w-5 h-5" />
                                    Send Challenge
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
