// Mirrors the server rules (the server stays the source of truth).
export const PASSWORD_HINT = 'At least 8 characters, including a number and a special character.'

export function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (pw.length > 72) return 'Password must be at most 72 characters'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number'
  if (!/[^A-Za-z0-9\s]/.test(pw)) return 'Password must contain at least one special character'
  return ''
}
