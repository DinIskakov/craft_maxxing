import { useState, useEffect, useRef } from 'react'
import { Search, User } from 'lucide-react'
import { profileApi } from '../lib/api'

export default function UserSearchInput({ onSelect, placeholder = "Search @username..." }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const wrapperRef = useRef(null)

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const users = await profileApi.searchUsers(query.replace('@', ''))
                setResults(users)
                setShowDropdown(true)
            } catch {
                setResults([])
            }
            setSearching(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (user) => {
        setQuery('')
        setResults([])
        setShowDropdown(false)
        onSelect(user)
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:border-stone-400 focus:bg-white outline-none transition-all text-sm"
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-50">
                    {results.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-stone-900">@{user.username}</p>
                                {user.display_name && (
                                    <p className="text-xs text-stone-500">{user.display_name}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && query.length >= 2 && results.length === 0 && !searching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg p-4 z-50">
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                        <User className="w-4 h-4" />
                        <span>No users found</span>
                    </div>
                </div>
            )}
        </div>
    )
}
