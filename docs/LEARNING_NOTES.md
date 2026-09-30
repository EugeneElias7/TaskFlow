# TaskFlow — Learning Notes

Short explanations of every major concept used, in the order encountered.

## React Native CLI vs Expo

CLI = raw native projects (`android/`, `ios/`) you control — required here
because `@react-native-firebase` needs native modules. Expo Go can't load
custom native code; Expo Dev Client could, but CLI is simpler for Firebase.

## Components / Props / State

Component = reusable UI function. Props = inputs from the parent (TaskCard
receives `task`, `onToggle`, `onDelete`). State (`useState`) = memory owned
by the component (form fields). Rule: TaskCard is stateless (props only);
TaskForm owns its inputs; TaskListScreen owns nothing — Redux does.

## Hooks: useState, useEffect, custom hooks

`useState` = local memory. `useEffect(fn, [deps])` = "run fn after render
when deps change" — used for initial `fetchTasks()` and the Firebase auth
listener (with cleanup `return unsub`). Custom hooks (`useAppDispatch`,
`useAppSelector`) wrap library hooks to add typing.

## FlatList

Virtualized list: renders only visible rows (+buffer), recycles the rest —
mandatory for long task lists. Needs `data` + `keyExtractor` (stable `_id`
keys!) + `renderItem`. `onRefresh`/`refreshing` give pull-to-refresh free.

## Navigation (React Navigation)

`NavigationContainer` + native stack. AppNavigator conditionally renders the
Auth stack (Login/Register) or the Tasks screen based on `state.auth.uid` —
no manual `navigate()` on login needed; the listener flips the tree.

## TypeScript: interfaces, enums, unions, DTOs

`interface TaskDto` fixes the API shape at compile time; `enum` restricts
priority/status to legal values; union `'all' | TaskStatus` restricts filter
state. Mobile `types/task.ts` mirrors backend `types/task.ts` — drift here =
runtime bugs, so keep them in sync.

## Redux Toolkit: store / slice / thunk / selector

Store = single global object. Slice = one key of state + its reducers
(authSlice, tasksSlice). Reducer = pure update fn. Action = event object.
`dispatch(action)` applies it. Async needs thunks (`createAsyncThunk`):
pending → API call → fulfilled/rejected, wired in `extraReducers`.
Selector = `state => state.tasks.items` read function (via `useAppSelector`).
RTK Query was considered but plain thunks + `fetch` are more transparent for
an assignment (no codegen/cache semantics to defend in interview).

## Node.js / npm / dotenv

Node runs JS server-side; npm installs deps; `dotenv` loads `backend/.env`
into `process.env` (connection strings, ports). Secrets stay out of git;
`.env.example` documents the shape.

## Express: server / routes / middleware / controllers

Express matches method+path → runs middleware chain → handler. Route =
URL mapping (`routes/tasks.ts`). Middleware = pre-handler fn
(`requireAuth` gates everything). Controller = thin adapter
(parse → service → JSON). `express-async-errors` forwards async throws to
the central `errorHandler` — without it, async errors crash the process.

## REST: verbs + status codes

POST = create (201), GET = read (200), PATCH = partial update (200),
DELETE = remove (200). 400 = bad input, 401 = unauthenticated,
404 = not found (or not yours — same response), 500 = server bug (generic
message only). JSON bodies; auth via `Authorization: Bearer <token>` header.

## Authentication vs authorization

Authentication = "who are you?" (Firebase verifies email+password, issues ID
token). Authorization = "may you do this?" (backend checks the token, then
scopes every query to that UID). Firebase does the first; our backend does
the second. Never confuse them: a valid login must still not see others' tasks.

## Firebase ID token / Bearer / Admin SDK

ID token = short-lived JWT proving identity. Sent as `Bearer <token>` header.
Admin SDK `verifyIdToken()` cryptographically checks signature + expiry +
audience — this is the trust root; everything after it (`req.user.uid`) is
trusted *because* verification passed.

## MongoDB / Mongoose: document / schema / model / ObjectId

MongoDB stores JSON-like documents in collections. `_id` = unique ObjectId.
Mongoose schema = validation + defaults + indexes declared in code;
model = class used to query (`findOne({ _id, userId })`). `lean()` returns
plain objects (faster, no Mongoose overhead) — used everywhere on reads.

## Zod validation

Runtime schema check (`createTaskSchema.parse(req.body)`) — TypeScript types
vanish at runtime, so API input must be re-checked on arrival. Throws 400-style
errors on bad input. Client validation is UX sugar; Zod is the real gate.

## Smart sort

Deterministic ordering: pending → sooner deadline (nulls last) → higher
priority → newer first. Implemented identically in `taskService.listTasks`
and unit-tested in `sortTasks.test.ts` (3 tests, all passing).

## Security essentials

Token verified per request; ownership in the query; identical 404s prevent ID
probing; generic 500s hide internals; secrets gitignored; body size limited
(`100kb`) against payload abuse.

## Git

Working tree → `git add` (stage) → `git commit -m "type: subject"`
(feat/fix/chore/docs/refactor) → `git push origin <branch>`. `.gitignore`
excludes secrets/node_modules/builds. Commit per coherent change, not at the end.
