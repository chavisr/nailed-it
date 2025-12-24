# Agent Guidelines for Nailed-it

## Commands
- **Dev**: `npm run dev` (starts Vite dev server on port 5173)
- **Lint**: `npm run lint` (runs ESLint on all files)
- **No test suite** - this project has no tests configured

## Code Style
- **Framework**: React 19 with Vite, uses JSX files (.jsx)
- **Styling**: Tailwind CSS utility classes (avoid custom CSS)
- **Imports**: React imports first, then third-party (lucide-react), then relative imports
- **Naming**: camelCase for variables/functions, PascalCase for components, SCREAMING_SNAKE_CASE for constants
- **State**: Use React hooks (useState, useRef, useEffect)
- **Unused vars**: Allow unused variables starting with uppercase (e.g., `_Unused`)
- **File structure**: Single-file component (App.jsx), modular functions at top of file
- **Error handling**: Use try-catch for localStorage operations and async operations
- **ES version**: ES2020+, modern JavaScript features allowed

## Project Context
- Browser-based thumbnail editor with canvas rendering, layer management, and image/text editing
- Uses localStorage for auto-save, no backend
- Base path for deployment: `/nailed-it/`

## Workflow
- always do git commit every changes (do not push yet)

## Notes
- Do not run any commands except those in commands section and git
