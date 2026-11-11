import data from '../data/avatars.json'

// [{ id, icon }]: the avatars a user can pick from (the files are in public/profile)
export const AVATARS = data.avatars

// The default avatar of a new account: shown, but not part of the list above (it cannot be picked)
export const DEFAULT_AVATAR = data.default

// The admin avatar: shown for the account that has it, never part of the list above (nobody can pick it, the admin
// gives it with the command `npm run admin -- admin-avatar <user>`)
export const ADMIN_AVATAR = data.admin

// The server always sends a valid id; the default avatar is also the safety net (unknown id, old cached data...)
export const avatarSrc = (id) =>
  (id === ADMIN_AVATAR?.id ? ADMIN_AVATAR : (AVATARS.find((a) => a.id === id) ?? DEFAULT_AVATAR)).icon
