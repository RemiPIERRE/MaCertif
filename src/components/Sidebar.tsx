import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { downloadExport, importFromFile, ImportError } from '../lib/exportImport'
import {
  IconHome,
  IconDossier,
  IconSite,
  IconOral,
  IconNotes,
  IconCalendar,
  IconSun,
  IconMoon,
  IconMenu,
} from './icons'
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await importFromFile(file)
      setImportMessage('Données importées.')
    } catch (error) {
      setImportMessage(error instanceof ImportError ? error.message : "Échec de l'import.")
    }
    window.setTimeout(() => setImportMessage(null), 2500)
  }

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
        <IconMenu />
      </button>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">MC</span>
          <div>
            <div className="sidebar-brand-name">MaCertif</div>
            <div className="sidebar-brand-sub">Dossier DWWM</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon" aria-hidden>
                <Icon />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-backup-actions">
            <button className="sidebar-footer-btn" onClick={downloadExport}>
              Exporter
            </button>
            <button className="sidebar-footer-btn" onClick={handleImportClick}>
              Importer
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
          </div>
          {importMessage && <p className="sidebar-import-message">{importMessage}</p>}
          <button className="sidebar-theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
            {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
          </button>
          <p>Toutes vos données restent dans ce navigateur.</p>
        </div>
      </aside>
    </>
  )
}
