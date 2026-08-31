# MaCertif — Dossier de projet DWWM

Outil personnel pour préparer un dossier de soutenance DWWM (Développeur Web et Web Mobile) : rédaction guidée du
dossier projet, checklist des images à préparer, notes libres et calendrier de deadlines.

Reconstruction non-commerciale, inspirée d'une plateforme aujourd'hui disparue, pour un usage individuel.

## Stack

- React + TypeScript + Vite
- Aucun backend, aucune base de données : toutes les données sont stockées dans le `localStorage` du navigateur
- Export/import JSON pour sauvegarder ou transférer ses données
- Export du dossier compilé au format Word (`.docx`), généré côté client avec [`docx`](https://www.npmjs.com/package/docx)
- Déployé sur GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

## Démarrer en local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

Le déploiement se déclenche automatiquement sur push vers `main` (workflow `.github/workflows/deploy.yml`), qui build
puis publie `dist/` sur GitHub Pages. Le `base` de Vite (`vite.config.ts`) est fixé à `/MaCertif/` pour correspondre
au nom du repo — à adapter si le repo est renommé ou déplacé.

## Structure

- `src/data/dossierContent.ts` — les 69 tâches du dossier, organisées en 14 chapitres/sous-chapitres (chaque tâche a
  un id stable, un type `text`/`image`, une fourchette de caractères, et un champ `example` à remplir plus tard)
- `src/types/storage.ts` — clés et types localStorage (`profil:infos`, `dossier:reponses`, `site:coches`,
  `notes:items`, `calendrier:deadlines`)
- `src/lib/docxExport.ts` — génération du `.docx` (page de garde, en-tête/pied de page, sommaire, tableaux stylés,
  encadrés d'image à insérer)
- `src/pages/` — une page par module (Accueil, Mon dossier, Mon site, Mon oral, Mes notes, Calendrier)

## État du projet

**Phase 1 (fait)** : Accueil, Mon dossier (69 tâches, progression, dossier compilé, export Word), Mon site, Mes
notes, Calendrier.

**Phase 2 (à venir)** : contenu de Mon oral (support de soutenance), textes d'exemple génériques pour chaque tâche
du dossier (`example` est actuellement `null` partout), raffinement de l'export Word.
