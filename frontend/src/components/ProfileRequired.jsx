import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { profileApi } from '../lib/api'

/**
 * Wrapper component that ensures user has created a profile (username).
 * Redirects to username setup if profile doesn't exist.
 */
export default function ProfileRequired({ children }) {
    const [loading, setLoading] = useState(true)
    const [hasProfile, setHasProfile] = useState(false)

    useEffect(() => {
        checkProfile()
    }, [])

    const checkProfile = async () => {
        try {
            const profile = await profileApi.getMyProfile()
            setHasProfile(!!profile)
        } catch {
            setHasProfile(false)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
            </div>
        )
    }

    if (!hasProfile) {
        return <Navigate to="/username-setup" replace />
    }

    return children
}
