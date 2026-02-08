import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Check, X, Trophy, Swords, Users } from 'lucide-react'
import { profileApi, challengeApi, friendsApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { useSkill } from '../lib/skill-context'
import ContributionGraph from '../components/ContributionGraph'
import NotificationBell from '../components/NotificationBell'

export default function ProfilePage() {
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ wins: 0, losses: 0, active: 0, completed: 0 })
    const [recentChallenges, setRecentChallenges] = useState([])
    const [friends, setFriends] = useState([])
    const [checkinsData, setCheckinsData] = useState([])
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({ display_name: '', bio: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()
    const { allSkillNames, syncChallenges } = useSkill()
    const { signOut } = useAuth()

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const [profileData, challengeData, friendsData] = await Promise.all([
                profileApi.getMyProfile(),
                challengeApi.getMyChallenges(),
                friendsApi.getMyFriends()
            ])

            setProfile(profileData)
            setEditForm({
                display_name: profileData?.display_name || '',
                bio: profileData?.bio || '',
            })

            setFriends(friendsData)

            const active = challengeData.filter(c => c.challenge.status === 'active')
            const completed = challengeData.filter(c => c.challenge.status === 'completed')
            const wins = completed.filter(c => c.challenge.winner_id === profileData?.id)
            const losses = completed.filter(c => c.challenge.winner_id && c.challenge.winner_id !== profileData?.id)

            setStats({
                wins: wins.length,
                losses: losses.length,
                active: active.length,
                completed: completed.length,
            })

            setRecentChallenges(challengeData.slice(0, 5))

            // Build checkins data from ALL daily_log entries (not just last_checkin)
            const checkins = []
            challengeData.forEach(c => {
                if (c.my_progress?.daily_log) {
                    c.my_progress.daily_log.forEach(entry => {
                        checkins.push({
                            date: entry.date,
                            skill_name: c.my_progress.skill_name,
                        })
                    })
                }
            })
            setCheckinsData(checkins)

            // Sync challenge skills to context
            syncChallenges()
        } catch (err) {
            console.error('Failed to load profile:', err)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const updated = await profileApi.updateProfile(editForm)
            setProfile(updated)
            setEditing(false)
        } catch (err) {
            console.error('Failed to update profile:', err)
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-medium text-stone-900">Profile</h1>
                    </div>
                    <NotificationBell />
                </div>
            </header>

            <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                            {profile?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                            {editing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                                        placeholder="Display name"
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:border-stone-900 outline-none"
                                    />
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                        placeholder="Bio"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:border-stone-900 outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium"
                                        >
                                            <Check className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-semibold text-stone-900">
                                            {profile?.display_name || profile?.username}
                                        </h2>
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-stone-400" />
                                        </button>
                                    </div>
                                    <p className="text-stone-500">@{profile?.username}</p>
                                    {profile?.bio && (
                                        <p className="text-stone-600 mt-2">{profile.bio}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-6 mt-6 pt-4 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-600">
                                <span className="font-semibold text-stone-900">{stats.wins}</span> wins
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-600">
                                <span className="font-semibold text-stone-900">{stats.active}</span> active
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-600">
                                <span className="font-semibold text-stone-900">{friends.length}</span> friends
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contribution Graph */}
                <ContributionGraph activeSkills={allSkillNames} checkinsData={checkinsData} />

                {/* Friends Quick Card */}
                <div
                    className="bg-white rounded-2xl border border-stone-200 p-5 cursor-pointer hover:border-stone-300 transition-colors"
                    onClick={() => navigate('/friends')}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-stone-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-stone-900">Friends</h3>
                                <p className="text-sm text-stone-500">
                                    {friends.length === 0 ? 'Find people to learn with' : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm text-stone-400">&rarr;</span>
                    </div>
                    {friends.length > 0 && (
                        <div className="flex -space-x-2 mt-3 pt-3 border-t border-stone-100">
                            {friends.slice(0, 6).map(friend => (
                                <div
                                    key={friend.id}
                                    className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                                    title={`@${friend.username}`}
                                >
                                    {friend.username[0].toUpperCase()}
                                </div>
                            ))}
                            {friends.length > 6 && (
                                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-xs font-medium text-stone-600 ring-2 ring-white">
                                    +{friends.length - 6}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Challenges */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5">
                    <h3 className="font-medium text-stone-900 mb-4">Recent Challenges</h3>
                    {recentChallenges.length === 0 ? (
                        <p className="text-stone-500 text-sm">No challenges yet. Start one from the skills page!</p>
                    ) : (
                        <div className="space-y-3">
                            {recentChallenges.map(({ challenge }) => (
                                <div
                                    key={challenge.id}
                                    className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                            {challenge.opponent?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-900">
                                                vs @{challenge.opponent?.username}
                                            </p>
                                            <p className="text-xs text-stone-500">{challenge.challenger_skill}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${challenge.status === 'active' ? 'bg-stone-200 text-stone-700' :
                                        challenge.status === 'completed' ? 'bg-stone-800 text-white' :
                                            'bg-stone-100 text-stone-600'
                                        }`}>
                                        {challenge.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-center pt-6">
                <button
                    onClick={async () => {
                        const { error } = await signOut()
                        if (!error) {
                            navigate('/login')
                        }
                    }}
                    className="text-stone-500 hover:text-red-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg"
                >
                    Sign Out
                </button>
            </div>

        </div>
    )
}
