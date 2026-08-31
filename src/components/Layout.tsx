import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ContinuityBanner } from './ContinuityBanner'
import './Layout.css'

export function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <ContinuityBanner />
        <Outlet />
      </main>
    </div>
  )
}
