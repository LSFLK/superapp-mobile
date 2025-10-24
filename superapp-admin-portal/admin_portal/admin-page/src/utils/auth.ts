/**
 * Auth utilities
 *
 * Centralize extraction of user groups from various token/userinfo shapes.
 */

export const GROUP_CLAIM_KEYS = [
  "groups",
  "http://wso2.org/claims/role",
  "roles",
  "role",
  "wso2_role",
] as const;

export type GroupClaimKey = (typeof GROUP_CLAIM_KEYS)[number];

/**
 * Normalize a value that could be a string or array-like into a string array.
 */
export function toStringArray(
  value:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | null
    | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (value == null) return [];
  return [String(value)].filter(Boolean);
}

/**
 * Extract user groups from a claims-like object using a set of known keys.
 */
export function extractGroupsFromClaims(
  claims: Record<string, any> | null | undefined,
): string[] {
  if (!claims || typeof claims !== "object") return [];
  const obj = claims as Record<string, any>;

  for (const key of GROUP_CLAIM_KEYS) {
    const v = obj[key as string];
    const arr = toStringArray(v);
    if (arr.length > 0) {
      return arr;
    }
  }
  return [];
}
