import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Sparkles, Users, Plus, Swords, RefreshCw,
    BookOpen, TrendingUp, ArrowRight
} from 'lucide-react'
import { aiApi, friendsApi } from '../lib/api'
import { useSkill } from '../lib/skill-context'
import NotificationBell from '../components/NotificationBell'

export default function DiscoverPage() {
    const [suggestion, setSuggestion] = useState(null)
    const [suggestLoading, setSuggestLoading] = useState(false)
    const [suggestError, setSuggestError] = useState(null)
    const [activity, setActivity] = useState([])
    const [activityLoading, setActivityLoading] = useState(true)
    const [skillAdded, setSkillAdded] = useState(false)
    const navigate = useNavigate()
    const { addSkill, skills } = useSkill()

    useEffect(() => {
        loadActivity()
    }, [])

    const loadActivity = async () => {
        setActivityLoading(true)
        try {
            const data = await friendsApi.getFriendsActivity()
            setActivity(data)
        } catch {
            // silently fail
        }
        setActivityLoading(false)
    }

    const handleSuggestSkill = async () => {
        setSuggestLoading(true)
        setSuggestError(null)
        setSkillAdded(false)
        try {
            const data = await aiApi.suggestSkill()
            setSuggestion(data)
        } catch (err) {
            setSuggestError('Failed to generate suggestion. Try again!')
        }
        setSuggestLoading(false)
    }

    const handleAddSuggestion = () => {
        if (suggestion?.skill_name && !skills.includes(suggestion.skill_name)) {
            addSkill(suggestion.skill_name)
            setSkillAdded(true)
        }
    }

    const handleLearnSkill = (skillName) => {
        if (!skills.includes(skillName)) {
            addSkill(skillName)
        }
        navigate('/setup')
    }

    return (
        <div className="min-h-screen bg-stone-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 px-6 py-5">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif text-stone-900">Discover</h1>
                        <p className="text-stone-500 text-sm mt-1">Find your next skill to learn</p>
                    </div>
                    <NotificationBell />
                </div>
            </header>

            <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
                {/* AI Skill Suggestion Card */}
                <div className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 rounded-2xl border border-violet-200/60 p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-stone-900">Not sure what to learn?</h2>
                            <p className="text-sm text-stone-500 mt-0.5">
                                Let AI suggest a fun skill you can master in 30 days
                            </p>
                        </div>
                    </div>

                    {/* Suggestion result */}
                    {suggestion && !suggestLoading && (
                        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-stone-900">{suggestion.skill_name}</h3>
                                    <p className="text-sm text-stone-500 mt-1">{suggestion.description}</p>
                                </div>
                            </div>
                            {skills.includes(suggestion.skill_name) || skillAdded ? (
                                <div className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                                    {skillAdded ? "Added! Go to Today tab to start learning." : "You're already learning this skill."}
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddSuggestion}
                                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add to My Skills
                                </button>
                            )}
                        </div>
                    )}

                    {suggestError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                            {suggestError}
                        </div>
                    )}

                    <button
                        onClick={handleSuggestSkill}
                        disabled={suggestLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-70"
                    >
                        {suggestLoading ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Thinking...
                            </>
                        ) : suggestion ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Suggest Another
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Suggest a Skill
                            </>
                        )}
                    </button>
                </div>

                {/* Friends Activity Feed */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-stone-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-stone-400" />
                            Friends are learning
                        </h3>
                        <button
                            onClick={() => navigate('/friends')}
                            className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors"
                        >
                            Find friends
                        </button>
                    </div>

                    {activityLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900" />
                        </div>
                    ) : activity.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-7 h-7 text-stone-300" />
                            </div>
                            <p className="text-sm text-stone-500 mb-1">No activity yet</p>
                            <p className="text-xs text-stone-400 mb-4">
                                Add friends to see what they&apos;re learning
                            </p>
                            <button
                                onClick={() => navigate('/friends?tab=search')}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                            >
                                Find people <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activity.map((item, index) => (
                                <div
                                    key={`${item.username}-${item.skill_name}-${index}`}
                                    className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                            className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 cursor-pointer"
                                            onClick={() => navigate(`/friends/${item.username}`)}
                                        >
                                            {item.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-stone-900 truncate">
                                                <span
                                                    className="cursor-pointer hover:underline"
                                                    onClick={() => navigate(`/friends/${item.username}`)}
                                                >
                                                    @{item.username}
                                                </span>
                                                {' '}is learning{' '}
                                                <span className="font-semibold">{item.skill_name}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden max-w-[100px]">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${(item.completed_days / item.total_days) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-stone-400">
                                                    Day {item.completed_days}/{item.total_days}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {skills.includes(item.skill_name) ? (
                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0 ml-2">
                                            Learning
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleLearnSkill(item.skill_name)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0 ml-2"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Learn
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/challenges/new')}
                        className="bg-white rounded-2xl border border-stone-200 p-4 text-left hover:border-stone-300 transition-colors"
                    >
                        <Swords className="w-5 h-5 text-stone-400 mb-2" />
                        <p className="text-sm font-medium text-stone-900">Challenge a friend</p>
                        <p className="text-xs text-stone-500 mt-0.5">Compete to learn faster</p>
                    </button>
                    <button
                        onClick={() => navigate('/friends?tab=search')}
                        className="bg-white rounded-2xl border border-stone-200 p-4 text-left hover:border-stone-300 transition-colors"
                    >
                        <Users className="w-5 h-5 text-stone-400 mb-2" />
                        <p className="text-sm font-medium text-stone-900">Find people</p>
                        <p className="text-xs text-stone-500 mt-0.5">Learn together</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
