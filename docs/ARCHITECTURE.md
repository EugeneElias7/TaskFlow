# TaskFlow — Architecture

## Overall architecture

```
React Native (Android)
  |  Firebase Auth SDK (register / login, session, ID token)
  v
Firebase Auth
  |  ID token (JWT, ~1h lifetime)
  v
React Native --HTTPS--> Express REST API  [Authorization: Bearer <token>]
  |  Firebase Admin SDK: verifyIdToken()
  v
Auth middleware (req.user = { uid, email })
  |
  v
Controller (thin: validate -> service -> respond)
  |
  v
Service (business logic + Mongoose queries, ALWAYS scoped by uid)
  |
  v
MongoDB (tasks collection, userId = Firebase UID)
```

Request lifecycle example (create task):

Mobile TaskForm → dispatch(addTask) → taskApi.create(token, payload)
→ POST /api/tasks, header `Authorization: Bearer <idToken>`
→ requireAuth verifies token → req.user.uid
→ taskController.create: Zod-validate body
→ taskService.createTask(uid, input) → TaskModel.create({ userId: uid, ... })
→ 201 { data: task } → Redux unshifts item → FlatList re-renders.

## Mobile architecture (mobile/src)

| Folder | Responsibility | Why it exists |
|---|---|---|
| components/ | TaskCard, TaskForm — presentational, props-in/callbacks-out | keeps screens small, reusable UI |
| navigation/ | AppNavigator — Auth stack vs Tasks stack switch | single place for session-gated routing |
| screens/auth/ | LoginScreen, RegisterScreen — Firebase email/password only | auth UI never talks to our backend |
| screens/tasks/ | TaskListScreen — FlatList + filter/search + form | one screen satisfies list/status/complete/delete |
| services/ | taskApi (fetch wrapper), authToken (token holder) | isolates networking + token plumbing from Redux/UI |
| store/ | store, authSlice, tasksSlice (thunks) | predictable global state; thunks = async API calls |
| types/ | task.ts DTOs mirroring backend | compile-time API contract |
| utils/ | validation.ts (client UX checks) | fast feedback; server re-validates |
| hooks/ | typed useAppDispatch/useAppSelector | type-safe Redux access |

Auth flow detail: `onAuthStateChanged` in AppNavigator is the single source
of truth. On login it caches `user.getIdToken()` via `setIdToken()` and
dispatches `setUser`. Thunks read the token via `getIdToken()` — components
never touch tokens. Tokens expire (~1h); a production app would call
`getIdToken(true)` refresh on 401 and retry once.

## Backend architecture (backend/src)

| Folder | Responsibility |
|---|---|
| config/ | firebase.ts (Admin init), db.ts (Mongoose connect) |
| middleware/ | auth.ts (requireAuth), errorHandler.ts (central errors) |
| models/ | Task.ts Mongoose schema |
| routes/ | tasks.ts — route table, all behind requireAuth |
| controllers/ | taskController.ts — thin request/response shaping |
| services/ | taskService.ts — queries + smart-sort |
| types/ | task.ts enums + TaskDto |
| utils/ | validate.ts (Zod schemas), sortTasks.test.ts (sort tests) |
| server.ts | composition root: dotenv → middleware → routes → errors → listen |

## Authentication architecture

- Identity provider: Firebase Authentication (email/password).
- Mobile registers/logs in with the Firebase client SDK — passwords never
  touch our backend.
- Mobile attaches the Firebase ID token as `Authorization: Bearer <token>`.
- Backend `requireAuth` calls `admin.auth().verifyIdToken(token)` (signature
  + expiry + audience checked by Google). On success `req.user.uid` is set.
- `userId` on every task = Firebase UID. Queries always include `{ userId }`,
  so user A can never read/write user B's tasks even by guessing an `_id`
  (unknown IDs return the same 404, preventing ID probing).

## Database architecture

Single `tasks` collection; no separate users collection (Firebase owns
identity). Schema: userId (indexed) + title/description/scheduledAt/deadline/
priority/status + timestamps. Compound index `{ userId: 1, createdAt: -1 }`
matches the hot query (a user's tasks, newest first). See docs/DATABASE.md.

## API architecture

REST, JSON, stateless (no sessions — every request carries its own token):

- POST /api/tasks, GET /api/tasks, GET /api/tasks/:id,
  PATCH /api/tasks/:id, DELETE /api/tasks/:id, plus GET /health.
- Errors: 400 Zod validation, 401 missing/invalid token,
  404 not-found-or-not-yours, 500 generic (details logged server-side only).

## Error flow

Throw/Zod-error in controller → `express-async-errors` forwards to
`errorHandler` (last middleware) → sanitized JSON `{ message }`.
Mobile `request()` throws `Error(message)` → thunk rejected →
`state.error` → screen renders error text. Network failure surfaces the
same way (fetch throws → thunk rejected).

## Security boundaries

1. Client validation ≠ security (bypassable) — Zod re-validates server-side.
2. Trust boundary = `requireAuth`: everything downstream uses `req.user.uid`,
   never `req.body.userId` / `req.query.userId`.
3. Ownership enforced inside DB queries (`{ _id, userId }`), not as a
   post-check — eliminates TOCTOU-style mistakes.
4. Secrets (serviceAccountKey.json, .env, google-services.json) are gitignored;
   only `.env.example` files are committed.
