// Exact confirmation for destructive actions: neither the typed text nor the
// stored name is trimmed, so the user has to reproduce the campaign name
// character by character (including any leading/trailing space it may have).
// An empty expected name can never confirm, so a broken dialog state fails
// closed instead of unlocking the destructive button.
export function isDeleteConfirmationValid(typed: string, name: string): boolean {
  return name.length > 0 && typed === name
}
