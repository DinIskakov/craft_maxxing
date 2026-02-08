import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Target, Flame, BookOpen, Swords, Settings } from 'lucide-react'
import { profileApi, challengeApi } from '../lib/api'
import UserSearchInput from './UserSearchInput'

export default function ProfileSidebar() {
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ wins: 0, active: 0, streak: 0, skills: 0 })
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const profileData = await profileApi.getMyProfile()
            setProfile(profileData)

            // Load challenges to calculate stats
            const challenges = await challengeApi.getMyChallenges()
            const activeChallenges = challenges.filter(c => c.challenge.status === 'active')
            const completedWins = challenges.filter(c =>
                c.challenge.status === 'completed' && c.challenge.winner_id === profileData?.id
            )

            setStats({
                wins: profileData?.total_wins || completedWins.length,
                active: activeChallenges.length,
                streak: calculateStreak(challenges),
                skills: countSkills(challenges),
            })
        } catch (err) {
            console.error('Failed to load profile:', err)
        }
        setLoading(false)
    }

    const calculateStreak = (challenges) => {
        // Simple streak calculation based on recent activity
        const activeChallenges = challenges.filter(c => c.challenge.status === 'active')
        if (activeChallenges.length === 0) return 0

        // Check if user has checked in today
        const today = new Date().toDateString()
        const hasCheckedInToday = activeChallenges.some(c =>
            c.my_progress?.last_checkin && new Date(c.my_progress.last_checkin).toDateString() === today
        )

        return hasCheckedInToday ? Math.max(1, activeChallenges.length) : 0
    }

    const countSkills = (challenges) => {
        const skills = new Set()
        challenges.forEach(c => {
            if (c.my_progress?.skill_name) {
                skills.add(c.my_progress.skill_name)
            }
        })
        return skills.size
    }

    const handleUserSelect = (user) => {
        navigate(`/challenges/new?opponent=${user.username}`)
    }

    if (loading) {
        return (
            <div className="w-72 bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                <div className="h-16 bg-stone-100 rounded-xl mb-4" />
                <div className="h-24 bg-stone-100 rounded-xl mb-4" />
                <div className="h-12 bg-stone-100 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="w-72 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                        {profile?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">
                            {profile?.display_name || profile?.username}
                        </p>
                        <p className="text-sm text-stone-500 truncate">@{profile?.username}</p>
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4 text-stone-400" />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <Trophy className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-stone-900">{stats.wins}</p>
                        <p className="text-xs text-stone-500">Wins</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-stone-900">{stats.active}</p>
                        <p className="text-xs text-stone-500">Active</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <Flame className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-stone-900">{stats.streak}</p>
                        <p className="text-xs text-stone-500">Streak</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <BookOpen className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-stone-900">{stats.skills}</p>
                        <p className="text-xs text-stone-500">Skills</p>
                    </div>
                </div>
            </div>

            {/* Quick Challenge */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-4 h-4 text-stone-600" />
                    <h3 className="font-medium text-stone-900 text-sm">Quick Challenge</h3>
                </div>
                <UserSearchInput
                    onSelect={handleUserSelect}
                    placeholder="Find @friend..."
                />
                <p className="text-xs text-stone-400 mt-2">
                    Search by username to send a challenge
                </p>
            </div>
        </div>
    )
}
