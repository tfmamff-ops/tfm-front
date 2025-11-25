const disabledValues = new Set(["false", "0", "off", "no"]);

/**
 * Source of truth for the login toggle.
 *
 * - Server components, middleware, and API routes call this helper so the env
 *   var is evaluated at request/runtime rather than build time.
 * - The root layout passes its return value as `initialLoginEnabled` to the
 *   AuthSessionProvider, which hydrates client components.
 * - Client components read the final value through `useAuthMode`, which the
 *   provider keeps in sync by calling `/api/auth/config`.
 */
export function isLoginEnabled(): boolean {
  if (process.env.LOGIN_ENABLED) {
    return !disabledValues.has(process.env.LOGIN_ENABLED.toLowerCase().trim());
  }

  return false;
}
