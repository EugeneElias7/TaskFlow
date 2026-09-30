# TaskFlow — API Documentation

Base URL (dev): `http://10.0.2.2:5000` (Android emulator → host localhost).
On a physical device use your PC's LAN IP. All `/api/tasks` endpoints require
`Authorization: Bearer <Firebase-ID-token>`.

## POST /api/tasks — create a task

- Auth: required.
- Body (JSON): `title*` (1–120 chars), `description` (≤2000, default ''),
  `scheduledAt` (ISO datetime, optional/nullable), `deadline` (ISO, optional/nullable),
  `priority` (`low|medium|high`, default `medium`).
- 201 example:
```json
{ "data": { "_id": "66f...", "userId": "firebaseUid123", "title": "Buy milk",
  "description": "", "scheduledAt": null, "deadline": "2026-10-05T18:00:00.000Z",
  "priority": "high", "status": "pending",
  "createdAt": "2026-09-30T...", "updatedAt": "2026-09-30T..." } }
```
- Errors: 400 (validation, e.g. empty title), 401 (missing/invalid token).
- Purpose: task creation; `userId` is taken from the verified token, never the body.

## GET /api/tasks — list my tasks (smart-sorted)

- Auth: required.
- Query (all optional): `status=pending|completed`, `priority=low|medium|high`,
  `search=<text over title+description>`, `sort=deadline|priority|scheduledAt|createdAt`,
  `order=asc|desc`.
- 200: `{ "data": [ TaskDto, ... ] }` (default order = smart sort: pending first,
  sooner deadline first with nulls last, high priority first, newest first).
- Purpose: task listing + bonus search/filter/sort.

## GET /api/tasks/:id — get one task

- Auth: required. 200 `{ "data": TaskDto }`.
- Errors: 401; 404 if the id doesn't exist **or belongs to another user**
  (deliberately identical — prevents probing other users' task IDs).
- Purpose: detail view / status view.

## PATCH /api/tasks/:id — update / mark complete

- Auth: required.
- Body (any subset): `title, description, scheduledAt, deadline, priority, status`.
  Toggling completion = `{ "status": "completed" }` (or back to `"pending"`).
- 200 `{ "data": TaskDto }`. Errors: 400 (bad value), 401, 404 (not found / not yours).
- Purpose: edit + complete/pending toggle.

## DELETE /api/tasks/:id — delete a task

- Auth: required. 200 `{ "data": { "id": "<deleted id>" } }`.
- Errors: 401, 404 (not found / not yours).
- Purpose: task deletion.

## GET /health — liveness probe

- Auth: none. 200 `{ "status": "ok" }`. Purpose: verify server is up
  (emulator networking check: open `http://10.0.2.2:5000/health`).

## Auth notes

There are deliberately **no** `/api/login` or `/api/register` endpoints —
registration/login happen in the app via the Firebase Auth SDK. The backend's
only auth job is verifying the ID token in `requireAuth`.

## Postman checklist

1. In the app, log in; print `await auth().currentUser.getIdToken()` to obtain a token.
2. Set collection header `Authorization: Bearer <token>`.
3. POST /api/tasks with `{ "title": "Hello", "priority": "high" }` → expect 201.
4. GET /api/tasks → expect the task in `data`.
5. PATCH /api/tasks/:id `{ "status": "completed" }` → expect status flipped.
6. DELETE /api/tasks/:id → expect `{ data: { id } }`.
7. Repeat step 3 with another user's token + step 5's id → expect 404 (ownership).
