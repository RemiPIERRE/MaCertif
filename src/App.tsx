import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AccueilPage } from './pages/AccueilPage'
import { DossierListPage } from './pages/DossierListPage'
import { DossierTaskPage } from './pages/DossierTaskPage'
import { DossierComplilePage } from './pages/DossierCompilePage'
import { MonSitePage } from './pages/MonSitePage'
import { MonOralPage } from './pages/MonOralPage'
import { MesNotesPage } from './pages/MesNotesPage'
import { CalendrierPage } from './pages/CalendrierPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<AccueilPage />} />
        <Route path="/dossier" element={<DossierListPage />} />
        <Route path="/dossier/compile" element={<DossierComplilePage />} />
        <Route path="/dossier/:taskId" element={<DossierTaskPage />} />
        <Route path="/site" element={<MonSitePage />} />
        <Route path="/oral" element={<MonOralPage />} />
        <Route path="/notes" element={<MesNotesPage />} />
        <Route path="/calendrier" element={<CalendrierPage />} />
      </Route>
    </Routes>
  )
}
