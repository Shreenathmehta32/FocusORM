import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TimelinePage from './pages/TimelinePage'
import ApplicationsPage from './pages/ApplicationsPage'
import WebsitesPage from './pages/WebsitesPage'
import FocusPage from './pages/FocusPage'
import DistractionPage from './pages/DistractionPage'
import SettingsPage from './pages/SettingsPage'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="websites" element={<WebsitesPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="distractions" element={<DistractionPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
