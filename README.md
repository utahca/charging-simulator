# Charging Simulator

A Vite + React + TypeScript + Tailwind app that simulates real-world charging power for adapters, cables, and devices.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build output is written to `dist/`.

## GitHub Pages deployment

GitHub Actions deploys on every push to `main` using `.github/workflows/deploy.yml`.
The workflow runs `npm ci`, builds the app, uploads `dist/`, and deploys via `actions/deploy-pages`.

The Vite base path is configured in `vite.config.ts` for `/charging-simulator/`, matching the repository name.

## Troubleshooting

- **Blank page on GitHub Pages**: verify the Vite `base` option is set to `/charging-simulator/`.
- **MIME type errors**: ensure the workflow deploys the built `dist/` folder (not the source tree).
- **Missing assets**: confirm the Pages URL includes the repository path (`/charging-simulator/`).
