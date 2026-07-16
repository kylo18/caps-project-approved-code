// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Centralized role validation and routing utilities.
// Ensures invalid/unknown roleIDs redirect safely instead of crashing.
// ─────────────────────────────────────────────────────────────────────────────

import type { RoleID } from '../types';

const VALID_ROLE_IDS: RoleID[] = [1, 2, 3, 4, 5];

/**
 * Type guard: returns true if roleID is a known valid RoleID.
 */
export function isValidRole(roleID: number): roleID is RoleID {
  return VALID_ROLE_IDS.includes(roleID as RoleID);
}

/**
 * Maps RoleID to the correct dashboard route path.
 * Defaults to '/' for unknown/invalid roleIDs.
 *
 * 1=Student, 2=Faculty, 3=Program Chair, 4=Dean, 5=Associate Dean
 */
export function getDashboardRoute(roleID: number): string {
  switch (roleID) {
    case 1: return '/(auth)/(student)/dashboard';
    case 2: return '/(auth)/(faculty)/dashboard';
    case 3: return '/(auth)/(program-chair)/dashboard';
    case 4: return '/(auth)/(dean)/dashboard';
    case 5: return '/(auth)/(associate-dean)/dashboard';
    default: return '/';
  }
}

/**
 * Returns the expected roleID for a given layout.
 * Used by role _layout.tsx files to validate the user.
 */
export function getExpectedRoleForLayout(layoutName: string): RoleID | null {
  switch (layoutName) {
    case 'student':       return 1;
    case 'faculty':       return 2;
    case 'program-chair': return 3;
    case 'associate-dean': return 4;
    case 'dean':          return 5;
    default:              return null;
  }
}