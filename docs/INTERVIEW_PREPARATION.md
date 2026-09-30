# TaskFlow — Interview Preparation (implementation-specific)

## Architecture

### Q: Walk me through a task-creation request end to end.
Expected: Form → dispatch(addTask) → POST /api/tasks + Bearer → requireAuth
verifies via Admin SDK → controller Zod-parses → service creates with uid →
201 → Redux unshift → FlatList re-renders.
Why it matters: proves you own the full data flow, not just one layer.

### Q: Where is the trust boundary, and what crosses it?
Expected: `requireAuth`. Untrusted: headers/body/query. Trusted after it:
`req.user.uid`. No userId from the client is ever read.
Why: the single most important security decision in the project.

## React Native / TypeScript / Redux

### Q: Why FlatList + stable `_id` keys?
Expected: virtualization for long lists; index keys corrupt recycling on insert/delete.
### Q: What does your Redux store hold, and why not RTK Query?
Expected: auth mirror + tasks server-state via plain thunks; thunks are
transparent (pending/fulfilled/rejected) vs cache semantics to defend.
### Q: How do mobile and backend stay in sync on the task shape?
Expected: mirrored `types/task.ts` DTOs; drift = runtime bugs.

## Firebase / Auth / Backend / MongoDB

### Q: Who does authentication vs authorization here?
Expected: Firebase authenticates (credentials → ID token); backend authorizes
(verifies token, scopes queries to UID).
### Q: How is user A prevented from deleting user B's task by ID?
Expected: delete query is `{ _id, userId }`; foreign IDs return the same 404.
### Q: Why no users collection in MongoDB?
Expected: Firebase owns identity; duplicating profiles adds sync bugs for zero benefit.
### Q: Which index serves the main query?
Expected: `{ userId: 1, createdAt: -1 }` for `find({userId}).sort({createdAt:-1})`.
### Q: Why Zod when TypeScript is already used?
Expected: TS is compile-time; HTTP input needs runtime validation.

## Git / Security / Debugging

### Q: What does a good commit look like here, and what's gitignored?
Expected: `feat:`/`fix:`/`chore:` per coherent change; `.env`, service-account
JSON, google-services files, node_modules, builds.
### Q: A user reports "tasks won't load on the device but work on emulator" — first steps?
Expected: probe `GET /health` at the LAN IP (not 10.0.2.2), check token expiry,
read server logs; generic client message is by design.
### Q: What did you deliberately leave for production?
Expected: 401-refresh-retry, pagination, offline queue — documented, not half-built.

## Project-specific

### Q: Explain your smart-sort order and its edge cases.
Expected: pending → sooner deadline (nulls last, overdue naturally first) →
high priority → newest; tested in `sortTasks.test.ts` (3/3 passing).
### Q: What couldn't you verify in this environment, and how did you handle it?
Expected: mobile build (no Android SDK) — stated openly, backend contract
verified instead (tsc clean, jest green), exact device steps in README.
