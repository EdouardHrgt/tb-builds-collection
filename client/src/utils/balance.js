// The balance the site is based on (talents, weapons, gear...): the Tourney Balance mod, not the official
// game balance. The version lives in data/balance.json, shared with the server: the header, the footer and
// the version saved in every build all read it. Restart the server after changing it.
import balance from '../data/balance.json'

export const BALANCE = balance
