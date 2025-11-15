const rawLoginEnabled = (
  process.env.LOGIN_ENABLED ??
  process.env.NEXT_PUBLIC_LOGIN_ENABLED ??
  "true"
).toLowerCase();

const disabledValues = new Set(["false", "0", "off", "no"]);

export const LOGIN_ENABLED = !disabledValues.has(rawLoginEnabled.trim());

export function isLoginEnabled(): boolean {
  return LOGIN_ENABLED;
}
