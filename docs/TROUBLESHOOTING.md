# TaskFlow — Troubleshooting

Real problems hit during development, with cause → fix → lesson.

## 1. `npm install` timed out at 120s

- Cause: `firebase-admin` pulls ~800 packages; default 120s tool timeout hit.
- Fix: re-ran with a 300s timeout — completed in ~54s.
- Lesson: set generous timeouts for first installs; `--no-audit --no-fund` skips slow steps.

## 2. `tsc --noEmit`: TS2688 "Cannot find type definition file" (babel__generator, qs, send…)

- Cause: TypeScript auto-includes *every* `@types/*` package hoisted into
  `node_modules/@types` (transitive deps of jest/express), some of which are
  broken stubs in this tree.
- Fix: pinned `"types": ["node", "express", "cors", "jest"]` in
  `backend/tsconfig.json` so only needed lib defs load.
- Lesson: > LEARNING POINT — `types` field restricts ambient @types inclusion;
  without it any stray @types package can break the whole build.

## 3. `TS2307: Cannot find module '../src/types/task'` in sortTasks.test.ts

- Cause: test lives in `src/utils/`, so `../src/types/task` resolves to
  `src/src/types/task` — wrong relative path.
- Fix: changed to `../types/task`.
- Lesson: count directories from the importing file, not the project root.

## 4. (Anticipated) Emulator can't reach `localhost:5000`

- Cause: each Android emulator has its own loopback; `localhost` = the phone, not the PC.
- Fix: use `http://10.0.2.2:5000` (emulator alias for host loopback);
  physical device → PC's LAN IP. `GET /health` verifies connectivity first.
- Lesson: always probe `/health` before debugging auth/business logic.

## 5. (Anticipated) `Firebase Admin: MONGODB_URI is not set` / credential errors

- Cause: `.env` is gitignored, so fresh clones lack it; Admin SDK needs
  `GOOGLE_APPLICATION_CREDENTIALS` pointing at the service-account JSON.
- Fix: copy `backend/.env.example` → `backend/.env`, fill values, keep the
  JSON file next to it (also gitignored).
- Lesson: `.env.example` is the contract; real `.env` never gets committed.
