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
- Node.js 18 or newer
- The Expo Go app on your phone, or an iOS or Android simulator

### Setup
```bash
git clone https://github.com/BU-Spark/se-bu-campus-emergency.git
cd se-bu-campus-emergency
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder using `.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```
Ask a team member for the values. Never commit this file.

### Start the app
```bash
npx expo start
```
Scan the QR code with Expo Go on your phone, or press `i` for the iOS simulator or `a` for Android.

## Current Status

This is the initial skeleton. It includes:
- A home screen listing emergency types
- A guidance screen with step-by-step instructions for each emergency
- A contacts screen with a confirmation popup before calling

The frontend also includes location permission handling, campus detection, manual building selection,
and an AED directory with floor/room details and directions. A manual building choice is shared across
screens for the current app session; it does not claim that GPS detected the building.

Authentication, persistent offline caching, and automatic building-level detection are not implemented.
The current backend supplies AEDs and campus contacts; other building-specific resources need a data contract.

See `frontend/SCREEN_TESTING.md` for device testing and demo instructions.
