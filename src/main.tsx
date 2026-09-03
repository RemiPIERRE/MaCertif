import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import { App } from './App.tsx'
import { migrateLocalStorageInPlace } from './lib/exportImport'

// Must run before any component reads localStorage: a browser that used an earlier
// version of the app already has un-migrated data under these keys, and nothing else
// upgrades it in place (the schemaVersion/migration system otherwise only runs on
// file import).
migrateLocalStorageInPlace()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
