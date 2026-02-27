# job-auto-apply

A browser extension that automatically detects and fills job application forms, with a Hono backend API.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Hono** - Lightweight, performant server framework
- **WXT** - Browser extension framework with React
- **LanceDB** - Embedded database for storing applications, resumes, and cover letters
- **Bun** - Runtime environment
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

The API is running at [http://localhost:3000](http://localhost:3000).

## Extension Development

To develop the browser extension:

```bash
cd apps/extension
bun run dev
```

Load the extension in your browser (see WXT docs for instructions).

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
job-auto-apply/
├── apps/
│   ├── server/          # Backend API (Hono, port from env.PORT)
│   │   ├── src/
│   │   │   ├── db/      # Database (LanceDB)
│   │   │   ├── routes/  # API route handlers
│   │   │   ├── lib/     # Business logic
│   │   │   └── types/   # TypeScript types
│   └── extension/       # Browser extension (WXT + React)
│       ├── entrypoints/ # Extension entry points
│       └── hooks/       # React hooks
├── packages/
│   ├── env/             # Environment validation (Zod)
│   └── config/          # Shared config
└── package.json         # Monorepo root
```

## Available Scripts

### Root Commands
- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:server`: Start only the server
- `bun run dev:extension`: Start only the extension
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Oxlint and Oxfmt

### Server (apps/server)
- `bun run dev`: Start with hot reload
- `bun run build`: Build with tsdown
- `bun run start`: Start production server
- `bun run compile`: Compile to standalone binary

### Extension (apps/extension)
- `bun run dev`: Start extension dev server
- `bun run dev:firefox`: Dev with Firefox
- `bun run build`: Build extension
- `bun run zip`: Create zip bundle

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_GENERATIVE_AI_API_KEY=your-key
QWEN_API_KEY=your-key
```
