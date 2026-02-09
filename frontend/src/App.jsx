import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./lib/auth-context"
import ProtectedRoute from "./components/ProtectedRoute"
import ProfileRequired from "./components/ProfileRequired"
import AppLayout from "./components/AppLayout"

import LandingPage from "./pages/LandingPage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import SignupPage from "./pages/SignupPage.jsx"
import UsernameSetupPage from "./pages/UsernameSetupPage.jsx"
import SetupPage from "./pages/SetupPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import ChallengesPage from "./pages/ChallengesPage.jsx"
import NewChallengePage from "./pages/NewChallengePage.jsx"
import FriendsPage from "./pages/FriendsPage.jsx"
import FriendProfilePage from "./pages/FriendProfilePage.jsx"
import JoinChallengePage from "./pages/JoinChallengePage.jsx"
import DiscoverPage from "./pages/DiscoverPage.jsx"
import PlanLoadingPage from "./pages/plan/PlanLoadingPage.jsx"
import TodayPage from "./pages/plan/TodayPage.jsx"
import PlanCalendarPage from "./pages/plan/PlanCalendarPage.jsx"
import CheckinPage from "./pages/plan/CheckinPage.jsx"

/** Wrap a page with ProtectedRoute + ProfileRequired + AppLayout (bottom nav) */
function AuthPage({ children }) {
  return (
    <ProtectedRoute>
      <ProfileRequired>
        <AppLayout>
          {children}
        </AppLayout>
      </ProfileRequired>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <div className="font-sans antialiased">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Username setup (after signup, before profile exists) */}
            <Route path="/username-setup" element={
              <ProtectedRoute>
                <UsernameSetupPage />
              </ProtectedRoute>
            } />

            {/* Setup / Today page - public, but shows BottomNav when authenticated */}
            <Route path="/setup" element={<SetupPage />} />

            {/* All app pages with bottom nav */}
            <Route path="/discover" element={<AuthPage><DiscoverPage /></AuthPage>} />
            <Route path="/profile" element={<AuthPage><ProfilePage /></AuthPage>} />
            <Route path="/challenges" element={<AuthPage><ChallengesPage /></AuthPage>} />
            <Route path="/challenges/new" element={<AuthPage><NewChallengePage /></AuthPage>} />
            <Route path="/challenges/join/:code" element={<AuthPage><JoinChallengePage /></AuthPage>} />
            <Route path="/friends" element={<AuthPage><FriendsPage /></AuthPage>} />
            <Route path="/friends/:username" element={<AuthPage><FriendProfilePage /></AuthPage>} />

            {/* Plan flow pages (part of skill learning, not tabs) */}
            <Route path="/plan/loading" element={<AuthPage><PlanLoadingPage /></AuthPage>} />
            <Route path="/plan/today" element={<AuthPage><TodayPage /></AuthPage>} />
            <Route path="/plan/calendar" element={<AuthPage><PlanCalendarPage /></AuthPage>} />
            <Route path="/plan/checkin" element={<AuthPage><CheckinPage /></AuthPage>} />

            {/* Redirect old plan routes */}
            <Route path="/plan/overview" element={<Navigate to="/plan/calendar" replace />} />
            <Route path="/plan/progress" element={<Navigate to="/discover" replace />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
