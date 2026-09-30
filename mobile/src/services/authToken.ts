// Singleton holder for the Firebase ID token, set by the auth listener.
// Redux thunks import this instead of reaching into Firebase directly,
// keeping the API layer testable and UI-agnostic.
let idToken: string | null = null;

export function setIdToken(token: string | null): void {
  idToken = token;
}

export function getIdToken(): string | null {
  return idToken;
}
