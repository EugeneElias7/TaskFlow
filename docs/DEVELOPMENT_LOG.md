# TaskFlow — Development Log

## Project Overview

**TaskFlow** is an Android to-do application (React Native CLI + TypeScript)
with a Node.js/Express REST backend, MongoDB persistence, Firebase
email/password authentication, and Redux Toolkit state management.

- Target platform: Android (emulator or physical device).
- Auth: Firebase Auth on mobile; Firebase Admin SDK verifies ID tokens on the backend.
- Trust rule: backend derives identity from the verified token — never from client input.
- Features: register, login, add task (title/description/date-time/deadline/priority),
  list, status view, complete toggle, delete — plus bonus search/filter/sort.
- Architecture: mobile → Bearer token → Express (auth middleware → controller →
  service → Mongoose → MongoDB) → Redux → UI. Full detail: docs/ARCHITECTURE.md.

---

# Milestone 1 — Project scaffolding & repo hygiene

## Objective

Create the `mobile/`, `backend/`, `docs/` structure, `.gitignore`, and env
templates so secrets can never be committed and both apps have a home.

## Requirements Addressed

Clean project structure; environment/secret management foundation.

## Implementation

Created folder trees per docs/ARCHITECTURE.md, root `.gitignore`
(secrets, node_modules, build outputs), `backend/.env.example`.
Every folder's purpose is tabulated in ARCHITECTURE.md — no filler folders.

## Files Created

- `.gitignore` — why: single choke point keeping `.env`, service-account JSON,
  google-services files, node_modules, APKs/build dirs out of git.
- `backend/.env.example` — documents PORT/MONGODB_URI/credentials shape.
- `mobile/`, `backend/src/*`, `docs/` trees.

## Technical Concepts

Gitignore patterns; env-file convention (`.env` real vs `.env.example` contract).

## Why This Technology?

Plain git + `.env` files: zero dependencies, interview-defensible, matches
assignment tooling (Git/GitHub/VS Code).

## Alternatives Considered

Secret managers (Vault, cloud KMS) — overkill for an assignment; noted as
production improvement in PROJECT_EXPLANATION.md.

## Security Considerations

Service-account JSON and `.env` gitignored from the first commit — secrets
must never appear in history, not just be deleted later.

## Testing

`Get-ChildItem -Recurse` verified the tree; `git status` (once repo inits)
must show no `.env`/JSON secrets.

## Git

Suggested: `git init && git add .gitignore backend/.env.example`
`git commit -m "chore: initialize project structure and gitignore"`.

## Developer Knowledge Check

1. Why is `.env` gitignored but `.env.example` committed?
2. What happens if a service-account key reaches git history?
3. Why one folder per layer (routes/controllers/services)?

<details><summary>Answers</summary>

1. `.env` holds real secrets; `.example` documents the shape without values.
2. It must be revoked/rotated — history rewrites don't reliably erase it.
3. Separation of concerns: routing vs request-shaping vs business logic.

</details>

---

# Milestone 2 — Backend foundation (Express + Mongoose + Firebase Admin)

## Objective

Build the complete task API with token verification, ownership enforcement,
validation, smart sorting, and tests.

## Requirements Addressed

Node.js backend, MongoDB persistence, auth integration, all task CRUD,
deadline/priority fields, bonus sort/filter/search.

## Implementation

`server.ts` (composition root) → `routes/tasks.ts` (all behind `requireAuth`)
→ `controllers/taskController.ts` (thin) → `services/taskService.ts`
(queries + smart sort) → `models/Task.ts` (schema) → MongoDB.
`utils/validate.ts` (Zod) guards input; `middleware/errorHandler.ts`
sanitizes errors.

## Files Created

- `backend/package.json`, `tsconfig.json` (with `"types"` pin — see Problems),
  `jest.config.js` — why: reproducible builds, strict TS, test runner.
- `backend/src/server.ts` — why: single composition root (dotenv, cors, json
  limit, /health, routes, 404, error handler, listen).
- `backend/src/config/firebase.ts` — why: Admin SDK init-once from ADC.
- `backend/src/config/db.ts` — why: isolated Mongoose connect.
- `backend/src/types/task.ts` — why: priority/status enums + TaskDto contract.
- `backend/src/models/Task.ts` — why: schema, validation, userId + compound indexes.
- `backend/src/middleware/auth.ts` — why: Bearer extraction + `verifyIdToken`,
  sets `req.user`; the security trust root.
- `backend/src/middleware/errorHandler.ts` — why: generic 500s, logged server-side.
- `backend/src/utils/validate.ts` — why: Zod runtime validation (TS types vanish at runtime).
- `backend/src/services/taskService.ts` — why: all DB logic, always `{ userId }`-scoped,
  smart-sort implementation.
- `backend/src/controllers/taskController.ts` — why: thin HTTP adapter; identical
  404s for missing vs not-yours (anti-probing).
- `backend/src/routes/tasks.ts` — why: route table, `router.use(requireAuth)`.
- `backend/src/utils/sortTasks.test.ts` — why: proves sort order without a DB.

## Technical Concepts

> LEARNING POINT: Middleware — a function running before the controller that can
> attach data (`req.user`) or reject early (401). Chains compose cross-cutting
> concerns (auth, errors) without duplicating code.

> LEARNING POINT: Mongoose schema vs document — schema = declared shape/rules in
> code; document = one stored record; model = query class bridging them.

> LEARNING POINT: Firebase ID token — short-lived JWT proving identity; verified
> cryptographically by the Admin SDK (signature + expiry + audience).

REST verbs/statuses, Bearer auth, Zod runtime validation, `lean()` reads,
compound indexes, `express-async-errors` (forwards async throws to error middleware).

## Why This Technology?

- Express over NestJS: minimal, no decorators/codegen to defend; assignment-scale.
- Mongoose over raw driver: schema validation + indexes in code.
- MongoDB over PostgreSQL: tasks are schemaless-ish independent documents; no joins needed.
- Zod over hand-rolled checks: composable schemas, typed inference.
- Firebase Auth over custom JWT: no password storage, no session store, free email flows.

## Alternatives Considered

NestJS (heavier DI/module ceremony), Prisma/Postgres (relational power unneeded),
custom bcrypt+JWT (must then store passwords + handle resets — real security risk),
RTK Query (cache semantics harder to explain than plain thunks).

## Code Explanation

- `requireAuth`: extracts `Bearer <token>`, `verifyIdToken`, sets `req.user`,
  else 401 with generic message (no leak of *why*).
- `taskService` queries embed `{ userId }` — ownership enforced *in the query*,
  not as an after-check. Smart sort: pending → sooner deadline (nulls last) →
  high priority → newest.
- Controllers `parse → service → res.json({ data })`; `update`/`remove` return
  404 for foreign IDs (indistinguishable from missing).
- `errorHandler` (registered last) logs full error, sends generic message.

## Data Flow

Mobile → `POST /api/tasks` + Bearer → requireAuth (verify) → controller (Zod)
→ service (`createTask(uid, …)`) → MongoDB → 201 → Redux → FlatList.

## Security Considerations

No client userId trusted; per-request verification; query-scoped isolation;
anti-probing 404s; generic 500s; 100kb body limit; secrets via env/ADC, gitignored.

## Testing

- `npx tsc --noEmit` → clean (after `types` pin + import-path fix; see Problems).
- `npx jest --runInBand` → 3/3 sort tests pass (pending-first, deadline order +
  nulls-last, priority tiebreak).
- Manual (needs MongoDB + Firebase project + device): Postman checklist in
  docs/API_DOCUMENTATION.md; cross-user 404 probe included.
- Mobile `tsc` not run (React Native deps not installed in this environment —
  install requires Android SDK + ~1GB fetch; explicitly not claimed as passing).

## Problems Encountered

### Error — npm install exceeded 120s timeout

Cause: firebase-admin ≈ 800 packages. Investigation: re-ran with longer timeout.
Solution: 300s timeout, `--no-audit --no-fund`; done in ~54s.
Lesson: first installs need generous timeouts.

### Error — TS2688 missing type-def files (babel__generator, qs, send…)

Cause: TS auto-loads all hoisted `@types/*`, including broken transitive stubs.
Investigation: errors named packages never directly referenced.
Solution: `"types": ["node", "express", "cors", "jest"]` in tsconfig.
Lesson: pin `types` to keep stray defs out of the build.

### Error — TS2307 `../src/types/task` in sortTasks.test.ts

Cause: wrong relative path (file is already under `src/`).
Solution: `../types/task`. Lesson: resolve relative imports from the file's own dir.

## Git

Suggested:
`git add backend/ docs/ARCHITECTURE.md docs/API_DOCUMENTATION.md docs/DATABASE.md`
`git commit -m "feat: implement task API with Firebase token auth and ownership"`.
Commit = backend vertical slice + its docs.

## Developer Knowledge Check

1. Why must the backend verify the Firebase token on *every* request?
2. Why can't the client just send `userId` in the body?
3. What does `router.use(requireAuth)` do?
4. Why do update/delete return 404 for other users' tasks instead of 403?
5. What is `lean()` and why use it on reads?
6. Why Zod when TypeScript already types the input?
7. What query does "my tasks, newest first" translate to, and which index serves it?

<details><summary>Answers</summary>

1. Tokens expire/are revocable; each request must prove identity anew (stateless API).
2. Client input is attacker-controlled — anyone could claim any userId.
3. Runs requireAuth before every route in this router; missing/invalid token → 401, controller never runs.
4. Identical 404s prevent probing whether an ID exists for another user.
5. Returns plain JS objects instead of Mongoose documents — faster, no change-tracking overhead.
6. TS types are compile-time only; runtime HTTP input needs runtime checks.
7. `find({ userId }).sort({ createdAt: -1 })` → compound index `{ userId: 1, createdAt: -1 }`.

</details>

---

# Milestone 3 — Mobile foundation (RN CLI + Redux + Firebase + screens)

## Objective

Build the Android app: Firebase email/password auth, Redux store, task list
screen with add/complete/delete + search/filter, navigation gating.

## Requirements Addressed

React Native CLI + TypeScript, Android app, register, login, add/view/status/
complete/delete tasks, state management, RN components, bonus search/filter/sort.

## Implementation

`App.tsx` (Provider → SafeArea → AppNavigator) → `AppNavigator`
(`onAuthStateChanged` listener → Auth stack or Tasks screen) →
`Login/RegisterScreen` (Firebase SDK directly) → `TaskListScreen`
(FlatList + TaskForm + filter/search) → Redux thunks → `taskApi` (+ Bearer) →
backend. `authToken.ts` holds the cached ID token.

## Files Created

- `mobile/package.json` (RN 0.75.3, Firebase v21, Navigation v6, Redux Toolkit v2),
  `tsconfig.json`, `App.tsx` — why: deps, strict TS, composition root.
- `mobile/src/types/task.ts` — why: DTOs mirroring backend (contract).
- `mobile/src/services/taskApi.ts` — why: fetch wrapper injecting Bearer;
  `10.0.2.2` emulator→host alias documented.
- `mobile/src/services/authToken.ts` — why: token holder so thunks stay UI-agnostic.
- `mobile/src/store/store.ts`, `authSlice.ts`, `tasksSlice.ts` — why: single store;
  auth mirrors session, tasks holds server state via thunks (fetch/add/toggle/remove).
- `mobile/src/hooks/hooks.ts` — why: typed dispatch/selector.
- `mobile/src/utils/validation.ts` — why: instant client checks (server re-validates).
- `mobile/src/components/TaskCard.tsx`, `TaskForm.tsx` — why: small presentational
  row + controlled form, keeping the screen lean.
- `mobile/src/screens/auth/LoginScreen.tsx`, `RegisterScreen.tsx` — why: Firebase
  email/password flows; backend uninvolved.
- `mobile/src/screens/tasks/TaskListScreen.tsx` — why: list + form + filter + search,
  loading/empty/error states, pull-to-refresh.
- `mobile/src/navigation/AppNavigator.tsx` — why: session-gated stacks.

## Technical Concepts

> LEARNING POINT: Redux selector — `state => state.tasks.items`; `useAppSelector`
> subscribes the component so it re-renders only when the selected slice changes.

> LEARNING POINT: Controlled inputs — input value lives in React state
> (`value` + `onChangeText`), enabling instant validation and reset after submit.

FlatList virtualization + `keyExtractor`; stack navigation; `onAuthStateChanged`
as session source of truth; thunks for async API; `10.0.2.2` emulator networking.

## Why This Technology?

- RN CLI over Expo: Firebase native modules need a real native project.
- Redux Toolkit over Context/useState: single predictable store, async thunks,
  scales to filters/search without prop-drilling; RTK Query skipped (plain thunks
  are more transparent for interview).
- React Navigation native-stack: standard Android navigation patterns.
- `fetch` over axios: zero extra deps for simple JSON REST.

## Alternatives Considered

Expo (can't load Firebase native modules in Go), Context-only state (becomes
prop-drilling spaghetti with filters + async), axios (unneeded abstraction),
MMKV/AsyncStorage token cache (Firebase SDK already persists sessions natively).

## Code Explanation

- `AppNavigator` effect subscribes `onAuthStateChanged`: caches fresh ID token,
  dispatches `setUser`; `uid` presence switches stacks — no manual post-login nav.
- Thunks call `requireToken()` → `taskApi.*` → `fetch` with Bearer; fulfilled
  updates (`unshift` on add, map-replace on toggle, filter-out on remove).
- `TaskListScreen` derives `visible` via filter+search locally (server also
  supports these params — client-side is instant for assignment scale).
- `TaskForm` validates title locally, emits ISO deadline strings, clears on submit.

## Data Flow

User types → local state → submit → `dispatch(addTask)` → Bearer fetch →
backend → fulfilled → `items.unshift` → selector → FlatList re-renders.

## Security Considerations

Passwords only go to Firebase (never our API); token cached in memory (not
AsyncStorage — avoids stale-token bugs; Firebase SDK persists the session);
no userId ever constructed client-side.

## Testing

- Static review of every file (imports resolve to declared deps; types mirror backend).
- Backend `tsc`/jest pass (see Milestone 2). Mobile `tsc`/Metro build NOT run here:
  `node_modules` for mobile were not installed (no Android SDK in this environment);
  README gives exact install + `run-android` steps. No test results fabricated.
- Manual device checklist: register → login → add → toggle → delete →
  search/filter → sign out → reinstall (session restore) → cross-user isolation via API.

## Problems Encountered

### Error — Mobile typecheck/build not runnable in this environment

Cause: no Android SDK / emulator here and RN deps (~1GB) unsuitable for this session.
Investigation: confirmed `node`/`npm` present but no `ANDROID_HOME`, no device.
Solution: documented exact setup + `/health` probe order in README; backend
contract verified instead (tsc + jest + API docs + Postman checklist).
Lesson: verify what you can, explicitly label what you can't — never fake green builds.

## Git

Suggested:
`git add mobile/ docs/`
`git commit -m "feat: implement mobile auth, task list, and Redux store"`.

## Developer Knowledge Check

1. Why does login involve Firebase only, not our backend?
2. Where does the Bearer token come from on each API call?
3. Why switch navigation stacks on `uid` instead of navigating manually?
4. What re-renders when a task is toggled, and why?
5. Why is client validation insufficient on its own?
6. What is `10.0.2.2` and when is it wrong?
7. Why `keyExtractor={t => t._id}` instead of array index?

<details><summary>Answers</summary>

1. Firebase owns credentials/sessions; backend only verifies the resulting token.
2. Cached by the auth listener via `setIdToken(await user.getIdToken())`, read by thunks.
3. Declarative: any auth change (login, logout, restore, expiry) renders the right tree.
4. The fulfilled reducer replaces the item → selector value changes → subscribed FlatList re-renders.
5. Attackers bypass UI; server Zod validation is the real gate. Client checks are UX only.
6. Emulator alias for host loopback; wrong on physical devices (use PC LAN IP) and iOS.
7. Stable keys let FlatList recycle rows correctly; indexes break on insert/delete reorder.

</details>

---

# Milestone 4 — Final audit (this log's closing review)

Assignment checklist: RN CLI ✓, TypeScript ✓ (both apps), Android ✓ (structure +
run instructions; build needs SDK), register ✓, login ✓, add/title/desc/datetime/
deadline/priority ✓, list ✓, status ✓, complete ✓, delete ✓, Node backend ✓,
MongoDB ✓, auth integration ✓, state management ✓, structure ✓, comments ✓
(why/security-focused). Bonus: search ✓, filter ✓, sort ✓ (documented + tested),
due dates ✓, loading/empty/error states ✓, pull-to-refresh ✓.

Security review: token verified per request; ownership query-scoped; anti-probing
404s; generic 500s; secrets gitignored; 100kb body cap. Open items for production:
token-refresh-on-401 retry, pagination for large lists, refresh-token rotation —
all listed in PROJECT_EXPLANATION.md rather than half-built here.
