export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Client-side validation = fast UX feedback only. The backend re-validates
// with Zod, and Firebase enforces real password rules server-side.
export function validateTaskInput(title: string): string | null {
  if (!title.trim()) return 'Title is required';
  if (title.trim().length > 120) return 'Title must be at most 120 characters';
  return null;
}
