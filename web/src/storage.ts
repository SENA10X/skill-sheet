/**
 * Keeps the document in this browser's localStorage between visits.
 *
 * Storage can be missing, full or blocked (private windows, a large photo),
 * so every call is guarded and reports failure instead of throwing.
 */
import { normalizeResume } from './io';
import type { Resume } from './model';

const STORAGE_KEY = 'skill-sheet:v1';

export function loadResume(createdOn: string): Resume | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeResume(JSON.parse(saved), createdOn) : null;
  } catch {
    return null;
  }
}

/** Returns false when the browser refused to store it. */
export function saveResume(resume: Resume): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    return true;
  } catch {
    return false;
  }
}

export function clearResume(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
