/**
 * Maps Meta ad account names to client names.
 * Examples:
 *   "Farm Rio - Principal" → "Farm Rio"
 *   "Animale - Outlet"     → "Animale"
 *   "Osklen"               → "Osklen"
 */
export function accountNameToClientName(accountName: string): string {
  // Strip everything after the first " - " separator
  const dashIndex = accountName.indexOf(" - ")
  if (dashIndex !== -1) {
    return accountName.slice(0, dashIndex).trim()
  }
  return accountName.trim()
}

/**
 * Converts a client name to a URL-safe slug.
 * "Farm Rio" → "farm-rio"
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}
