import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The avatars users can pick from (client/src/data/avatars.json, the same file as the front end).
// Restart the server after editing it.
const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')
const AVATAR_IDS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'avatars.json'), 'utf8')).avatars.map((a) => a.id)
if (!AVATAR_IDS.length) throw new Error('avatars.json is empty')

export const isAvatarId = (id) => AVATAR_IDS.includes(id)

// The avatar shown for a user: the one he picked, or (nothing picked yet / avatar removed from the list)
// a default that depends on his id, so new accounts do not all look the same.
export const avatarFor = (userId, avatar) =>
  avatar && isAvatarId(avatar) ? avatar : AVATAR_IDS[(userId - 1) % AVATAR_IDS.length]
