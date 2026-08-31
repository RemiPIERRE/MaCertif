import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const links = [
  { to: '/', label: 'Accueil', icon: '⌂', end: true },
  { to: '/dossier', label: 'Mon dossier', icon: '✎' },
  { to: '/site', label: 'Mon site', icon: '◱' },
  { to: '/oral', label: 'Mon oral', icon: '🗎' },
  { to: '/notes', label: 'Mes notes', icon: '✚' },
  { to: '/calendrier', label: 'Calendrier', icon: '▦' },
]

export function Sidebar() {
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
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon" aria-hidden>
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Toutes vos données restent dans ce navigateur.</p>
      </div>
    </aside>
  )
}
