import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AccueilPage } from './pages/AccueilPage'
import { DossierListPage } from './pages/DossierListPage'
import { DossierTaskPage } from './pages/DossierTaskPage'
import { DossierComplilePage } from './pages/DossierCompilePage'
import { MonSitePage } from './pages/MonSitePage'
import { OralHomePage } from './pages/oral/OralHomePage'
import { SlideEditorPage } from './pages/oral/SlideEditorPage'
import { OralApercuPage } from './pages/oral/OralApercuPage'
import { OralDiscoursPage } from './pages/oral/OralDiscoursPage'
import { OralEntrainementHomePage } from './pages/oral/OralEntrainementHomePage'
import { OralTrainingPage } from './pages/oral/OralTrainingPage'
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
        <Route path="/oral" element={<OralHomePage />} />
        <Route path="/oral/presentation/:slideId" element={<SlideEditorPage kind="presentation" />} />
        <Route path="/oral/annexes/:slideId" element={<SlideEditorPage kind="annexe" />} />
        <Route path="/oral/apercu" element={<OralApercuPage />} />
        <Route path="/oral/discours" element={<OralDiscoursPage />} />
        <Route path="/oral/entrainement" element={<OralEntrainementHomePage />} />
        <Route path="/oral/entrainement/prompteur/:slideId" element={<OralTrainingPage mode="prompteur" />} />
        <Route path="/oral/entrainement/slides/:slideId" element={<OralTrainingPage mode="slides" />} />
        <Route path="/notes" element={<MesNotesPage />} />
        <Route path="/calendrier" element={<CalendrierPage />} />
      </Route>
    </Routes>
  )
}
