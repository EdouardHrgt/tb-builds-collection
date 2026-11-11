import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The avatars users can pick from, and the default one (client/src/data/avatars.json, the same file as the
// front end). The default avatar is NOT in the pickable list: it is what a new account shows until he picks
// one, so it also tells that the member is new. A third avatar, "admin", is the one only the admin can have: it is
// not pickable either (the settings route refuses it), it is given from the command line (scripts/admin.js). Restart the server after editing the file.
const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.GAME_DATA_DIR || path.join(here, '../../client/src/data')
const DATA = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'avatars.json'), 'utf8'))
const AVATAR_IDS = DATA.avatars.map((a) => a.id)
const DEFAULT_ID = DATA.default?.id
export const ADMIN_ID = DATA.admin?.id
if (!AVATAR_IDS.length) throw new Error('avatars.json is empty')
if (!DEFAULT_ID) throw new Error('avatars.json has no "default" avatar')

// Only the pickable avatars: the default one cannot be chosen
export const isAvatarId = (id) => AVATAR_IDS.includes(id)

// The avatar shown for a user: the one he picked, or the default one (nothing picked yet, or the avatar
// he had was removed from the list).
export const avatarFor = (_userId, avatar) =>
  avatar && (isAvatarId(avatar) || avatar === ADMIN_ID) ? avatar : DEFAULT_ID
