import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Swords, Clock, Trophy, ChevronRight, Check, X, Ban } from 'lucide-react'
import { challengeApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import NotificationBell from '../components/NotificationBell'
import { markChallengeNotificationRead } from '../lib/notification-sync'

export default function ChallengesPage() {
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, active, completed
    const [actionLoading, setActionLoading] = useState(null)
    const { user } = useAuth()

    useEffect(() => {
        loadChallenges()
    }, [filter])

    const loadChallenges = async () => {
        setLoading(true)
        try {
            const data = await challengeApi.getMyChallenges(filter === 'all' ? null : filter)
            setChallenges(data)
        } catch (err) {
            console.error('Failed to load challenges:', err)
        }
        setLoading(false)
    }

    const handleAccept = async (e, challengeId) => {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(challengeId + '-accept')
        try {
            await challengeApi.respondToChallenge(challengeId, true)
            await loadChallenges()
            // Mark related notification as read and update bell badge
            markChallengeNotificationRead(challengeId)
        } catch (err) {
            console.error('Failed to accept challenge:', err)
        }
        setActionLoading(null)
    }

    const handleDecline = async (e, challengeId) => {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(challengeId + '-decline')
        try {
            await challengeApi.respondToChallenge(challengeId, false)
            await loadChallenges()
            // Mark related notification as read and update bell badge
            markChallengeNotificationRead(challengeId)
        } catch (err) {
            console.error('Failed to decline challenge:', err)
        }
        setActionLoading(null)
    }

    const handleWithdraw = async (e, challengeId) => {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(challengeId + '-withdraw')
        try {
            await challengeApi.withdrawChallenge(challengeId)
            await loadChallenges()
        } catch (err) {
            console.error('Failed to withdraw challenge:', err)
        }
        setActionLoading(null)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700'
            case 'active': return 'bg-blue-100 text-blue-700'
            case 'completed': return 'bg-green-100 text-green-700'
            case 'declined': return 'bg-red-100 text-red-700'
            case 'expired': return 'bg-stone-200 text-stone-500'
            case 'cancelled': return 'bg-stone-200 text-stone-500'
            default: return 'bg-stone-100 text-stone-700'
        }
    }

    const formatDeadline = (deadline) => {
        const date = new Date(deadline)
        const now = new Date()
        const diff = date - now
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

        if (days < 0) return 'Ended'
        if (days === 0) return 'Today'
        if (days === 1) return 'Tomorrow'
        return `${days} days left`
    }

    const formatResponseDeadline = (deadlineStr) => {
        if (!deadlineStr) return null
        const date = new Date(deadlineStr)
        const now = new Date()
        const diff = date - now
        const hours = Math.ceil(diff / (1000 * 60 * 60))
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

        if (hours <= 0) return 'Expired'
        if (hours < 24) return `${hours}h to respond`
        return `${days}d to respond`
    }

    const isIncoming = (challenge) => challenge.opponent_id === user?.id
    const isOutgoing = (challenge) => challenge.challenger_id === user?.id

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-6">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif text-stone-900">Challenges</h1>
                        <p className="text-stone-500 text-sm mt-1">Compete with friends to learn faster</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <Link
                            to="/challenges/new"
                            className="bg-stone-900 text-white p-3 rounded-full hover:bg-stone-800 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="px-6 py-4 max-w-2xl mx-auto">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'active', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                                    ? 'bg-stone-900 text-white'
                                    : 'bg-white text-stone-600 hover:bg-stone-50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Challenges List */}
            <div className="px-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                    </div>
                ) : challenges.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Swords className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-lg font-medium text-stone-900 mb-2">No challenges yet</h3>
                        <p className="text-stone-500 mb-6">Challenge a friend to learn something new together!</p>
                        <Link
                            to="/challenges/new"
                            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-800 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Challenge
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {challenges.map(({ challenge, my_progress, opponent_progress }) => {
                            const incoming = isIncoming(challenge)
                            const outgoing = isOutgoing(challenge)
                            const isPending = challenge.status === 'pending'
                            const responseInfo = formatResponseDeadline(challenge.response_deadline)

                            return (
                                <div
                                    key={challenge.id}
                                    className="block bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                                {challenge.opponent?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-stone-900">
                                                    {incoming ? 'From' : 'vs'} @{incoming ? challenge.challenger?.username : challenge.opponent?.username || 'unknown'}
                                                </p>
                                                <p className="text-sm text-stone-500">
                                                    {challenge.challenger_skill}{challenge.challenger_skill !== challenge.opponent_skill ? ` vs ${challenge.opponent_skill}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(challenge.status)}`}>
                                                {challenge.status}
                                            </span>
                                            {isPending && responseInfo && (
                                                <span className="text-[10px] text-stone-400">
                                                    {responseInfo}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message if present */}
                                    {challenge.message && isPending && (
                                        <div className="bg-stone-50 rounded-lg px-3 py-2 mb-3">
                                            <p className="text-xs text-stone-600 italic">&ldquo;{challenge.message}&rdquo;</p>
                                        </div>
                                    )}

                                    {/* Progress bars for active challenges */}
                                    {challenge.status === 'active' && (
                                        <div className="space-y-2 mb-3">
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>You</span>
                                                    <span>{my_progress?.completion_percentage?.toFixed(0) || 0}%</span>
                                                </div>
                                                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${my_progress?.completion_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>@{challenge.opponent?.username}</span>
                                                    <span>{opponent_progress?.completion_percentage?.toFixed(0) || 0}%</span>
                                                </div>
                                                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${opponent_progress?.completion_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons for pending challenges */}
                                    {isPending && incoming && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                                            <button
                                                onClick={(e) => handleAccept(e, challenge.id)}
                                                disabled={!!actionLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === challenge.id + '-accept' ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                Accept
                                            </button>
                                            <button
                                                onClick={(e) => handleDecline(e, challenge.id)}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === challenge.id + '-decline' ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-400" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                                Decline
                                            </button>
                                        </div>
                                    )}

                                    {/* Withdraw button for outgoing pending */}
                                    {isPending && outgoing && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                                            <div className="flex-1 flex items-center gap-2 text-xs text-stone-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                Waiting for @{challenge.opponent?.username} to respond
                                            </div>
                                            <button
                                                onClick={(e) => handleWithdraw(e, challenge.id)}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === challenge.id + '-withdraw' ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-stone-400" />
                                                ) : (
                                                    <Ban className="w-3.5 h-3.5" />
                                                )}
                                                Withdraw
                                            </button>
                                        </div>
                                    )}

                                    {/* Footer with deadline for non-pending */}
                                    {!isPending && (
                                        <div className="flex items-center justify-between text-sm text-stone-500 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDeadline(challenge.deadline)}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
