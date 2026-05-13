/**
 * Compare two semantic versions (e.g. "v2.0.0" vs "v1.9.5").
 * Returns:
 *   > 0  if a > b (a is newer)
 *   < 0  if a < b (a is older)
 *   0    if equal
 *
 * Handles optional "v" prefix on either side.
 */
export function compareVersions(a: string, b: string): number {
  const normalize = (v: string) =>
    v.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

  const [aMajor, aMinor, aPatch] = normalize(a);
  const [bMajor, bMinor, bPatch] = normalize(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Returns true if the current app version is older than (below) the required version,
 * meaning an update is needed.
 */
export function needsUpdate(currentVersion: string, requiredVersion: string): boolean {
  return compareVersions(currentVersion, requiredVersion) < 0;
}