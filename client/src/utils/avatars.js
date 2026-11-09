import data from '../data/avatars.json'

// [{ id, icon }]: the avatars a user can pick from (the files are in public/profile)
export const AVATARS = data.avatars

// The server always sends a valid id; the first avatar is only a safety net (unknown id, old cached data...)
export const avatarSrc = (id) => (AVATARS.find((a) => a.id === id) ?? AVATARS[0]).icon
