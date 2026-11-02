# code-image — onglet « Mes extraits de code »

Module autonome React + TS (code → image PNG). Voir `prompt-claude-code-integration-extraits-de-code.md`.

Export : `CodeImageTab`, `CODE_IMAGE_EXPORT_KEYS` (`code:extraits`, `code:reglages`), `exporterCodeImage`, `importerCodeImage`, `normalizeExtraits`, `normalizeReglages`.
Dépendances : highlight.js, html-to-image, @fontsource/{jetbrains-mono,fira-code,source-code-pro}.
Ne pas exporter `code:actif` (état UI).
