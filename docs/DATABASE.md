# TaskFlow — Database

MongoDB database `taskflow`, single collection `tasks` (Mongoose model `Task`).
No users collection: Firebase Authentication owns identity; MongoDB stores
only tasks, each stamped with its owner's Firebase UID.

## User identity → task ownership

- On registration/login Firebase creates a user with a stable `UID`
  (e.g. `Xy9...`). The mobile app never sends this UID to the API.
- The backend decodes the UID from the **verified** ID token (`req.user.uid`)
  and writes it as `task.userId` on create, and as the `{ userId }` filter on
  every read/update/delete.
- Consequence: data isolation is structural (in the query), not advisory.
  `GET /api/tasks?userId=someone-else` cannot work — the server ignores any
  client-supplied user id entirely.

## Task schema (backend/src/models/Task.ts)

| Field | Type | Required | Rules |
|---|---|---|---|
| _id | ObjectId | auto | MongoDB primary key |
| userId | String (Firebase UID) | yes | indexed; never from client |
| title | String | yes | trim, 1–120 chars |
| description | String | no | default '', trim, ≤2000 chars |
| scheduledAt | Date | no | "date/time" of the task (optional) |
| deadline | Date | no | due date for sorting/filtering (optional) |
| priority | Enum low\|medium\|high | no | default `medium` |
| status | Enum pending\|completed | no | default `pending` |
| createdAt | Date | auto | via `timestamps: true` |
| updatedAt | Date | auto | via `timestamps: true` |

Example document:

```json
{ "_id": { "$oid": "66f..." }, "userId": "firebaseUid123", "title": "Submit report",
  "description": "Q3 summary", "scheduledAt": null,
  "deadline": { "$date": "2026-10-05T18:00:00Z" },
  "priority": "high", "status": "pending",
  "createdAt": { "$date": "..." }, "updatedAt": { "$date": "..." }, "__v": 0 }
```

## Indexes

- `userId` (single-field): every query is scoped by owner.
- `{ userId: 1, createdAt: -1 }` (compound): the hot query — one user's tasks
  newest-first — is served in index order.

## Relationships

None (no joins): tasks are independent documents linked to an owner only by
the opaque `userId` string. This is intentional — a to-do list needs no
relational modelling, and embedding user profiles would duplicate Firebase data.

## Why userId exists

Without it, tasks would be a global pile visible to everyone. `userId` +
query-scoping gives per-user privacy with zero extra tables, and makes
"delete my account" trivially `deleteMany({ userId })` (bonus).
