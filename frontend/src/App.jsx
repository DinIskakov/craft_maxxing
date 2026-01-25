import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import LandingPage from "./pages/LandingPage.jsx"
import SetupPage from "./pages/SetupPage.jsx"
import PlanLoadingPage from "./pages/plan/PlanLoadingPage.jsx"
import TodayPage from "./pages/plan/TodayPage.jsx"
import PlanOverviewPage from "./pages/plan/PlanOverviewPage.jsx"
import ProgressPage from "./pages/plan/ProgressPage.jsx"
import CheckinPage from "./pages/plan/CheckinPage.jsx"

function App() {
  return (
    <div className="font-sans antialiased">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/plan/loading" element={<PlanLoadingPage />} />
          <Route path="/plan/today" element={<TodayPage />} />
          <Route path="/plan/overview" element={<PlanOverviewPage />} />
          <Route path="/plan/progress" element={<ProgressPage />} />
          <Route path="/plan/checkin" element={<CheckinPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
