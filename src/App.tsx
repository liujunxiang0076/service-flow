import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { NotificationToast } from "@/components/notification-toast"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider"
import { SidebarProvider } from "@/components/sidebar-context"
import DashboardPage from "./app/page"
import ApplicationsPage from "./app/applications/page"
import GroupsPage from "./app/groups/page"
import ServicesPage from "./app/services/page"
import DependenciesPage from "./app/dependencies/page"
import HealthPage from "./app/health/page"
import LogsPage from "./app/logs/page"
import SettingsPage from "./app/settings/page"
import LoginPage from "./app/login/page"

export default function App() {
  return (
    <BrowserRouter>
      <KeyboardShortcutsProvider>
        <SidebarProvider>
          <div className="font-sans antialiased bg-background text-foreground min-h-screen">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/dependencies" element={<DependenciesPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
            <NotificationToast />
          </div>
        </SidebarProvider>
      </KeyboardShortcutsProvider>
    </BrowserRouter>
  )
}
