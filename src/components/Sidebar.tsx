import { NavLink } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { IconHome, IconDossier, IconSite, IconOral, IconNotes, IconCalendar, IconSun, IconMoon } from './icons'
import './Sidebar.css'

const links = [
  { to: '/', label: 'Accueil', Icon: IconHome, end: true },
  { to: '/dossier', label: 'Mon dossier', Icon: IconDossier },
  { to: '/site', label: 'Mon site', Icon: IconSite },
  { to: '/oral', label: 'Mon oral', Icon: IconOral },
  { to: '/notes', label: 'Mes notes', Icon: IconNotes },
  { to: '/calendrier', label: 'Calendrier', Icon: IconCalendar },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">MC</span>
        <div>
          <div className="sidebar-brand-name">MaCertif</div>
          <div className="sidebar-brand-sub">Dossier DWWM</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon" aria-hidden>
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
          {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        </button>
        <p>Toutes vos données restent dans ce navigateur.</p>
      </div>
    </aside>
  )
}
