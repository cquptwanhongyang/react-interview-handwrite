# Repository Guidelines

## Project Structure & Module Organization

- `src/` — application source. `main.tsx` mounts the app, `App.tsx` is the root component, and `index.css`/`App.css` hold global and component styles.
- `src/assets/` — bundled images and SVGs imported by components (`hero.png`, `react.svg`).
- `public/` — static files copied as-is and served from `/` (`favicon.svg`, `icons.svg`).
- `index.html` — Vite HTML entry point.
- `vite.config.ts`, `eslint.config.js`, `tsconfig*.json` — toolchain configuration.
- No test directory exists yet; add one only when tests are introduced.

## Build, Test, and Development Commands

- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server with HMR.
- `npm run build` — type-check with `tsc -b`, then bundle to `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint across the repository.
- There is no `test` script; treat `npm run lint` and `npm run build` as the verification gate.

## Coding Style & Naming Conventions

- Match the existing style: 2-space indentation, single quotes, no semicolons.
- Components and their files use PascalCase (`App.tsx`); hooks and variables use camelCase (`useState`); asset files stay lowercase (`hero.png`).
- `verbatimModuleSyntax` is enabled: import types with `import type`. `noUnusedLocals`/`noUnusedParameters` fail the build, so delete dead code.
- No Prettier config exists; keep formatting consistent with surrounding files and run `npm run lint` before committing.

## Testing Guidelines

- No test framework is configured. Verify changes with `npm run lint` and `npm run build`.
- If tests are added, prefer Vitest with React Testing Library, co-locate them as `src/**/*.test.tsx`, and name tests by the behavior they verify.

## Commit & Pull Request Guidelines

- This checkout has no `.git` metadata, so no history is available to summarize. Use Conventional Commits such as `feat(scope): ...`, `fix: ...`, or `docs: ...`, in the imperative mood, 72 characters or fewer.
- Pull requests should describe the exercise or component added, link related issues, report `lint`/`build` results, and include screenshots for UI changes.
