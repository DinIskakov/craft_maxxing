import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, Swords, UserPlus, UserMinus, Trophy, Clock,
    BookOpen, Share2, Copy, CheckCheck, Link as LinkIcon, Calendar, Lock
} from 'lucide-react'
import { extendedProfileApi, friendsApi, challengeLinksApi } from '../lib/api'
import NotificationBell from '../components/NotificationBell'

export default function FriendProfilePage() {
    const { username } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showChallengeLink, setShowChallengeLink] = useState(false)
    const [challengeLink, setChallengeLink] = useState(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [linkForm, setLinkForm] = useState({ skill: '', deadline: '', message: '' })
    const [linkLoading, setLinkLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        loadProfile()
    }, [username])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const result = await extendedProfileApi.getFullProfile(username)
            setData(result)
        } catch (err) {
            console.error('Failed to load profile:', err)
        }
        setLoading(false)
    }

    const handleAddFriend = async () => {
        if (!data?.profile) return
        setActionLoading(true)
        try {
            await friendsApi.addFriend(data.profile.id)
            await loadProfile()
        } catch (err) {
            console.error('Failed to add friend:', err)
        }
        setActionLoading(false)
    }

    const handleRemoveFriend = async () => {
        if (!data?.friendship) return
        if (!confirm(`Remove @${username} from friends?`)) return
        setActionLoading(true)
        try {
            await friendsApi.removeFriend(data.friendship.id)
            await loadProfile()
        } catch (err) {
            console.error('Failed to remove friend:', err)
        }
        setActionLoading(false)
    }

    const handleAcceptRequest = async () => {
        if (!data?.friendship) return
        setActionLoading(true)
        try {
            await friendsApi.respondToRequest(data.friendship.id, true)
            await loadProfile()
        } catch (err) {
            console.error('Failed to accept request:', err)
        }
        setActionLoading(false)
    }

    const handleGenerateLink = async (e) => {
        e.preventDefault()
        if (!linkForm.skill || !linkForm.deadline) return
        setLinkLoading(true)
        try {
            const result = await challengeLinksApi.createInviteLink(
                linkForm.skill,
                new Date(linkForm.deadline),
                linkForm.message
            )
            setChallengeLink(result)
        } catch (err) {
            console.error('Failed to generate link:', err)
        }
        setLinkLoading(false)
    }

    const handleCopyLink = () => {
        if (!challengeLink) return
        const fullLink = `${window.location.origin}/challenges/join/${challengeLink.code}`
        navigator.clipboard.writeText(fullLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
    }

    const handleShareLink = () => {
        if (!challengeLink) return
        const fullLink = `${window.location.origin}/challenges/join/${challengeLink.code}`
        const text = `I challenge you on CraftMaxxing! Learn ${linkForm.skill} with me.`
        if (navigator.share) {
            navigator.share({ title: 'CraftMaxxing Challenge', text, url: fullLink })
        } else {
            handleCopyLink()
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700'
            case 'active': return 'bg-blue-100 text-blue-700'
            case 'completed': return 'bg-green-100 text-green-700'
            case 'declined': return 'bg-red-100 text-red-700'
            default: return 'bg-stone-100 text-stone-700'
        }
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    // Calc min/max dates for challenge link
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 6)

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            </div>
        )
    }

    if (!data?.profile) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-stone-500 mb-4">User not found</p>
                    <button
                        onClick={() => navigate('/friends')}
                        className="text-stone-900 font-medium underline"
                    >
                        Back to Friends
                    </button>
                </div>
            </div>
        )
    }

    const { profile, is_self, is_friend, friendship, current_skills, shared_challenges } = data
    const isPendingSent = friendship && friendship.status === 'pending' && friendship.user_id !== profile.id
    const isPendingReceived = friendship && friendship.status === 'pending' && friendship.user_id === profile.id

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/friends')}
                            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-medium text-stone-900">@{username}</h1>
                    </div>
                    <NotificationBell />
                </div>
            </header>

            <div className="px-6 py-6 max-w-2xl mx-auto space-y-5">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                            {profile.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-stone-900">
                                {profile.display_name || profile.username}
                            </h2>
                            <p className="text-stone-500">@{profile.username}</p>
                            {profile.bio && (
                                <p className="text-stone-600 mt-2 text-sm">{profile.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-5 pt-4 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-600">
                                <span className="font-semibold text-stone-900">{profile.total_wins || 0}</span> wins
                            </span>
                        </div>
                        <div className="text-sm text-stone-500">
                            Joined {formatDate(profile.created_at)}
                        </div>
                    </div>

                    {/* Action buttons */}
                    {!is_self && (
                        <div className="flex gap-2 mt-5 pt-4 border-t border-stone-100">
                            {is_friend ? (
                                <>
                                    <button
                                        onClick={() => navigate(`/challenges/new?opponent=${username}`)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                                    >
                                        <Swords className="w-4 h-4" />
                                        Challenge
                                    </button>
                                    <button
                                        onClick={() => setShowChallengeLink(true)}
                                        className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
                                        title="Generate challenge link"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Link
                                    </button>
                                    <button
                                        onClick={handleRemoveFriend}
                                        disabled={actionLoading}
                                        className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-stone-400 hover:text-red-500 disabled:opacity-50"
                                        title="Remove friend"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                </>
                            ) : isPendingSent ? (
                                <span className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl font-medium">
                                    Friend request sent
                                </span>
                            ) : isPendingReceived ? (
                                <button
                                    onClick={handleAcceptRequest}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                >
                                    Accept Friend Request
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add Friend
                                    </button>
                                    <button
                                        onClick={() => navigate(`/challenges/new?opponent=${username}`)}
                                        className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
                                    >
                                        <Swords className="w-4 h-4" />
                                        Challenge
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Current Skills (only for friends) */}
                {(is_friend || is_self) ? (
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <h3 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-stone-400" />
                            Currently Learning
                        </h3>
                        {current_skills && current_skills.length > 0 ? (
                            <div className="space-y-3">
                                {current_skills.map((skill, i) => (
                                    <div key={i} className="bg-stone-50 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-stone-900 text-sm">{skill.skill_name}</p>
                                            <span className="text-xs text-stone-500">
                                                Day {skill.completed_days}/{skill.total_days}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                                style={{ width: `${skill.completion_percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1.5">
                                            {skill.completion_percentage.toFixed(0)}% complete
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-stone-500">Not currently learning any skills in challenges.</p>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <div className="flex items-center gap-3 text-stone-400">
                            <Lock className="w-5 h-5" />
                            <div>
                                <p className="font-medium text-stone-600">Skills are private</p>
                                <p className="text-sm text-stone-400">Become friends to see what they&apos;re learning</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shared Challenge History (only for friends) */}
                {(is_friend || is_self) ? (
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <h3 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
                            <Swords className="w-4 h-4 text-stone-400" />
                            {is_self ? 'Your Challenges' : 'Shared Challenges'}
                        </h3>
                        {shared_challenges && shared_challenges.length > 0 ? (
                            <div className="space-y-3">
                                {shared_challenges.map(challenge => (
                                    <div
                                        key={challenge.id}
                                        className="bg-stone-50 rounded-xl p-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                <Swords className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-stone-900">
                                                    {challenge.challenger_skill} vs {challenge.opponent_skill}
                                                </p>
                                                <p className="text-xs text-stone-500">
                                                    {formatDate(challenge.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(challenge.status)}`}>
                                            {challenge.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-stone-500">No shared challenges yet. Challenge them now!</p>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <div className="flex items-center gap-3 text-stone-400">
                            <Lock className="w-5 h-5" />
                            <div>
                                <p className="font-medium text-stone-600">Challenge history is private</p>
                                <p className="text-sm text-stone-400">Become friends to see shared challenges</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Challenge Link Modal */}
            {showChallengeLink && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-stone-100">
                            <h3 className="font-semibold text-stone-900">Generate Challenge Link</h3>
                            <button
                                onClick={() => {
                                    setShowChallengeLink(false)
                                    setChallengeLink(null)
                                    setLinkForm({ skill: '', deadline: '', message: '' })
                                }}
                                className="p-1.5 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
                            >
                                ✕
                            </button>
                        </div>

                        {challengeLink ? (
                            <div className="p-5 space-y-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <LinkIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="font-medium text-stone-900">Link generated!</p>
                                    <p className="text-sm text-stone-500">Share this with @{username} or anyone</p>
                                </div>
                                <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
                                    <p className="text-xs text-stone-600 truncate flex-1">
                                        {window.location.origin}/challenges/join/{challengeLink.code}
                                    </p>
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors flex-shrink-0"
                                    >
                                        {linkCopied ? (
                                            <><CheckCheck className="w-3.5 h-3.5" /> Copied</>
                                        ) : (
                                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={handleShareLink}
                                    className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-900 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleGenerateLink} className="p-5 space-y-4">
                                <p className="text-sm text-stone-500">
                                    Create a challenge link to share with @{username}. They can accept it to start a challenge.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Skill</label>
                                    <input
                                        type="text"
                                        value={linkForm.skill}
                                        onChange={e => setLinkForm(f => ({ ...f, skill: e.target.value }))}
                                        placeholder="e.g., Playing Guitar"
                                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Deadline</label>
                                    <input
                                        type="date"
                                        value={linkForm.deadline}
                                        onChange={e => setLinkForm(f => ({ ...f, deadline: e.target.value }))}
                                        min={tomorrow.toISOString().split('T')[0]}
                                        max={maxDate.toISOString().split('T')[0]}
                                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                                        Message <span className="text-stone-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={linkForm.message}
                                        onChange={e => setLinkForm(f => ({ ...f, message: e.target.value }))}
                                        placeholder="Let's learn this together!"
                                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={linkLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                                >
                                    {linkLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    ) : (
                                        <><LinkIcon className="w-4 h-4" /> Generate Link</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}
