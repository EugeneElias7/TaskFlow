# TaskFlow — To-Do for Android

React Native CLI + TypeScript app with Express/MongoDB backend and Firebase
email/password auth. Users register, log in, and manage personal tasks
(title, description, date/time, deadline, priority, status) with search,
filter, and smart sorting.

## Features

- Register / login (Firebase Auth), session restore, sign out
- Add task: title*, description, scheduledAt, deadline, priority
- List with status, complete/pending toggle, delete
- Search (title+description), status filter, smart sort
  (pending → sooner deadline, nulls last → high priority → newest)
- Loading / empty / error states, pull-to-refresh

## Stack

Mobile: React Native CLI 0.75, TypeScript, React Navigation, Redux Toolkit,
`@react-native-firebase/auth`. Backend: Node 20+, Express 4, TypeScript,
Mongoose 8, Firebase Admin, Zod. DB: MongoDB. See docs/ARCHITECTURE.md.

## Requirements

Node 20+, JDK 17, Android Studio + SDK + emulator (or physical device),
MongoDB (local or Atlas), a Firebase project with Email/Password enabled.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill MONGODB_URI + Firebase values
# place serviceAccountKey.json (Firebase console → Project settings →
# Service accounts → Generate key) next to .env — NEVER commit it
npm run dev            # http://localhost:5000/health → {"status":"ok"}
```

### 2. Firebase (mobile)

- Create Android app in Firebase console → download `google-services.json`
  into `mobile/android/app/` (gitignored).
- Enable Authentication → Email/Password provider.

### 3. Mobile

```bash
cd mobile
npm install
# emulator: API_URL default http://10.0.2.2:5000 works as-is
# physical device: set API_URL to your PC's LAN IP
npx react-native run-android
```

## Project structure

```
mobile/src/{components,navigation,screens/{auth,tasks},services,store,types,utils,hooks}
backend/src/{config,controllers,middleware,models,routes,services,types,utils}
docs/{DEVELOPMENT_LOG,ARCHITECTURE,API_DOCUMENTATION,DATABASE,LEARNING_NOTES,TROUBLESHOOTING}.md
```

Why each folder exists: docs/ARCHITECTURE.md (tables per app).

## API

Full reference: docs/API_DOCUMENTATION.md.
`POST/GET /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id` (all Bearer-auth),
`GET /health`. Auth = Firebase ID token, verified per request; identity comes
from the token, never from client input.

## Scripts

Backend: `npm run dev` (watch), `npm run build` + `npm start` (prod),
`npm test` (jest — sort tests), `npm run lint` (tsc). Mobile: `npm start`,
`npm run android`, `npm run typecheck`.

## Future improvements

Token-refresh-and-retry on 401, server pagination, offline queue, push
reminders for deadlines, categories/tags, CI (tsc+jest on PR), E2E (Detox).
