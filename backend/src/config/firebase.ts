import admin from 'firebase-admin';

// Initializes Firebase Admin SDK ONCE using Application Default Credentials.
// In dev: set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
// (gitignored). In production: use the host's secret manager / env.
let initialized = false;

export function initFirebaseAdmin(): void {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  initialized = true;
}

export { admin };
