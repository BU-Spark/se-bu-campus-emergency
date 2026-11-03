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

## Running Locally

### Prerequisites

- Node.js 22 (the version in `.nvmrc`; run `nvm use` if you use nvm)
- The Expo Go app on your phone, or an iOS or Android simulator

### Setup

The app lives in the `frontend` folder, so install and run everything from there:

```bash
git clone https://github.com/BU-Spark/se-bu-campus-emergency.git
cd se-bu-campus-emergency/frontend
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

Then fill in the values in `frontend/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Find them in the Supabase dashboard under Project Settings → API Keys, or ask a team member.
Use the publishable key, never the secret key. Never commit `.env`.

### Start the app

From the `frontend` folder:

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for the iOS simulator or `a` for Android.

### Checks

From the `frontend` folder, these are the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build:web
```

## Current Status

This is the initial skeleton. It includes:

- A home screen listing emergency types
- A guidance screen with step-by-step instructions for each emergency
- A contacts screen with a confirmation popup before calling

Authentication and location-based features will be added in later phases.
