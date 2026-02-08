import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Home, Compass, Swords, Users, User } from 'lucide-react'
import { friendsApi } from '../lib/api'

const navItems = [
    { to: '/setup', icon: Home, label: 'Today' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/challenges', icon: Swords, label: 'Challenges' },
    { to: '/friends', icon: Users, label: 'Friends', hasBadge: true },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
    const [pendingRequests, setPendingRequests] = useState(0)

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

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 safe-area-pb z-40">
            <div className="max-w-lg mx-auto flex justify-around">
                {navItems.map(({ to, icon: Icon, label, hasBadge }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${isActive
                                ? 'text-stone-900'
                                : 'text-stone-400 hover:text-stone-600'
                            }`
                        }
                    >
                        <div className="relative">
                            <Icon className="w-5 h-5" />
                            {hasBadge && pendingRequests > 0 && (
                                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 ring-2 ring-white">
                                    {pendingRequests > 9 ? '9+' : pendingRequests}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
