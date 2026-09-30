# TaskFlow — Project Explanation

## 30 seconds

TaskFlow is an Android to-do app: register/login with email+password, then add,
view, complete, and delete personal tasks (title, description, date/time,
deadline, priority) with search, filter, and smart sorting. Data persists in
MongoDB via our own REST API; Firebase handles identity.

## 2 minutes

React Native CLI + TypeScript mobile app (Navigation + Redux Toolkit) talks to
an Express + TypeScript API backed by MongoDB/Mongoose. Firebase Auth issues ID
tokens on login; the app attaches them as Bearer headers; the backend verifies
each one with the Firebase Admin SDK and scopes every database query to that
user's UID — so users can never touch each other's tasks.

## 5 minutes

Auth: Firebase client SDK owns registration, passwords, sessions. Backend never
sees a password; its only auth job is `verifyIdToken()` in `requireAuth`
middleware, producing `req.user.uid`. Controllers are thin (validate → service
→ JSON); services own queries + the documented smart sort (pending → sooner
deadline → higher priority → newest); Zod re-validates all input server-side;
errors are sanitized centrally. Mobile mirrors the session in Redux, caches the
token once per auth change, and performs CRUD through thunks + a tiny fetch
wrapper. One `tasks` collection, `userId`-indexed, no joins, no users table.

## 10 minutes

See docs/ARCHITECTURE.md (diagrams + folder tables), docs/API_DOCUMENTATION.md
(every endpoint with examples), docs/DATABASE.md (schema + indexes), and
docs/DEVELOPMENT_LOG.md Milestones 2–3 (file-by-file rationale, data flow,
security notes, knowledge checks).

## What I learned

Middleware as composable trust boundary; runtime (Zod) vs compile-time (TS)
validation; ownership-in-the-query as structural security; thin controllers;
Redux thunks over local state for server data; emulator networking (10.0.2.2);
pinning TS `types` against stray @types breakage.

## Problems encountered

npm install timeout (fixed with longer timeout); TS2688 stray @types (fixed by
pinning `types`); wrong relative import in test (fixed path); mobile build not
runnable without Android SDK (stated openly, backend contract verified instead).
Full records: docs/TROUBLESHOOTING.md + DEVELOPMENT_LOG Problems sections.

## Production improvements

401 → refresh-token → retry once; server pagination + cursor; offline mutation
queue; deadline push reminders; categories/tags; CI running tsc+jest; Detox E2E;
secret manager instead of files; rate limiting.

## Tradeoffs

Express over NestJS, plain thunks over RTK Query, fetch over axios, single
collection over relational model, client-side filter over extra round-trips —
each chosen for transparency and assignment scale, each documented with
alternatives in the log.
