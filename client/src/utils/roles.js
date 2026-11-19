// Roles a build can be made for (2 at most), e.g. "Tank" + "Support". The list lives in data/roles.json,
// shared with the server (which checks it when a build is saved). Builds saved before the roles existed have none.
import data from '../data/roles.json'

export const ROLES = data.roles
export const MAX_ROLES = data.maxRoles

// The roles of a build as objects, in the order of the list (data.roles may be missing on an old build, or hold
// an id that no longer exists: it is skipped)
export const buildRoles = (build) => ROLES.filter((r) => build?.data?.roles?.includes(r.id))
