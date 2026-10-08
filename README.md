# BU Campus Emergency Guidance App

A mobile app that gives the Boston University community clear, step-by-step emergency guidance
(fire, medical, severe weather, evacuation, and more), quick access to emergency contacts, and
location-aware safety resources such as AED locations.

Built for **BU Campus Planning and Operations** as a Spark! DS 519 project (Fall 2026). Guidance content
comes from existing BU emergency plans and protocols ([BU EHS Emergency Communications](https://www.bu.edu/ehs/emergency-communications/)).

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Mobile app     | React Native, Expo (SDK 57), Expo Router, TypeScript |
| Backend        | Supabase (Postgres)                                  |
| Authentication | Clerk (planned, not part of the initial skeleton)    |
| Tooling        | ESLint, Prettier, Jest, Husky, GitHub Actions        |

## Repository Structure

```
.
├── frontend/          Expo mobile app
│   ├── src/app/       Screens (file-based routing via Expo Router)
│   ├── src/components Reusable UI components
│   ├── src/constants  Theme and shared constants
│   ├── src/hooks      Custom React hooks (including data-loading hooks)
│   ├── src/lib        Supabase client
│   ├── src/services   Data access functions (queries to Supabase)
│   ├── src/types      Database types generated from the Supabase schema
│   └── assets/        Icons, splash screen, images
├── backend/           Supabase project
│   └── supabase/
│       └── migrations/  Versioned SQL schema changes
├── .github/           CI workflow and pull request template
└── .husky/            Git hooks (lint, format, and test before commit/push)
```

## Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- The [Expo Go](https://expo.dev/go) app on an iOS or Android phone, or the iOS Simulator / Android Emulator
- A free [Expo account](https://expo.dev/signup)

### Configure environment variables

```bash
cd frontend
cp .env.example .env
```

Open `frontend/.env` and set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key
(Supabase dashboard → Project Settings → API Keys). Never use the secret key in the app. `.env` is git-ignored.

### Run the app

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with your phone (Camera app on iOS, Expo Go on Android). If you are on a network that
blocks local connections (e.g. campus Wi-Fi), use `npx expo start --tunnel`.

### Common commands

Run from `frontend/`:

| Command                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `npx expo start`        | Start the development server                    |
| `npm run lint`          | Lint and check formatting                       |
| `npm test`              | Run unit tests                                  |
| `npm run test:coverage` | Run tests with a coverage report                |
| `npm run typecheck`     | Run the TypeScript compiler                     |
| `npm run gen:types`     | Regenerate database types after a schema change |

## Development Workflow

- Work on a feature branch; `main` is updated only after review and approval.
- Before each commit, Husky runs ESLint and Prettier on staged files and runs the test suite.
- CI runs lint, tests, and a type check on pushes and pull requests to `main` and `dev`.

## License

See [LICENSE](LICENSE).
