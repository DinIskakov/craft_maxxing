import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Home, Compass, Swords, Users, User } from 'lucide-react'
import { friendsApi } from '../lib/api'
import { useSkill } from '../lib/skill-context'

export default function BottomNav() {
    const [pendingRequests, setPendingRequests] = useState(0)
    const { getActivePlan } = useSkill()
    const navigate = useNavigate()

    useEffect(() => {
        fetchPending()
        const interval = setInterval(fetchPending, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchPending = async () => {
        try {
            const requests = await friendsApi.getFriendRequests()
            setPendingRequests(requests.length)
        } catch {
            // silently fail
        }
    }

    const handleTodayClick = (e) => {
        e.preventDefault()
        const plan = getActivePlan()
        // If user has an active plan, go to the current day's tasks
        // Otherwise, go to the skills selection page
        navigate(plan ? '/plan/today' : '/setup')
    }

    // Define nav items with dynamic Today behavior
    const navItems = [
        { id: 'today', icon: Home, label: 'Today', onClick: handleTodayClick },
        { to: '/discover', icon: Compass, label: 'Discover' },
        { to: '/challenges', icon: Swords, label: 'Challenges' },
        { to: '/friends', icon: Users, label: 'Friends', hasBadge: true },
        { to: '/profile', icon: User, label: 'Profile' },
    ]

    const isToday = window.location.pathname.startsWith('/setup') || window.location.pathname.startsWith('/plan')

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 safe-area-pb z-40">
            <div className="max-w-lg mx-auto flex justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon

                    // Special handling for Today tab (custom onClick)
                    if (item.id === 'today') {
                        return (
                            <button
                                key="today"
                                onClick={handleTodayClick}
                                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                                    isToday ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        )
                    }

                    // Regular NavLink for other tabs
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                                    isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                }`
                            }
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {item.hasBadge && pendingRequests > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 ring-2 ring-white">
                                        {pendingRequests > 9 ? '9+' : pendingRequests}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}
