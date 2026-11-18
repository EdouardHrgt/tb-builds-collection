# Sigmar's Arsenal API

JSON API of the site (`https://sigmararsenal.xyz/api`). The front end uses the same API, so this document describes
what the code does today. It is **not versioned**: fields can change when the site changes. Check the `balance`
field of a build (the Tourney Balance version it was made for) before relying on its content.

- Base URL: `https://sigmararsenal.xyz/api` (same origin as the site, no CORS headers).
- Format: JSON in, JSON out (`Content-Type: application/json`, request bodies up to 100 kB).
- Errors: an HTTP status and `{ "error": "message" }`.
  `400` invalid data, `401` login required, `403` not allowed, `404` not found, `429` too many requests, `500` server error.
- Dates are UTC, formatted `YYYY-MM-DD HH:MM:SS`.

## Public read endpoints (no login)

These are the ones to use from a script, a bot or a game mod.

### `GET /builds` — list builds

Query parameters (all optional):

| Parameter | Meaning |
| --- | --- |
| `hero` | Hero id, e.g. `kruber` |
| `career` | Career id, e.g. `mercenary` |
| `weapon` | Weapon id, matches the melee or the ranged slot |
| `username` | Part of the author's name (case-insensitive) |
| `upToDate=1` | Only builds made for the current balance version |
| `sort` | `newest` (default), `oldest`, `likes` |
| `page` | Page number, 20 builds per page (out of range = last page) |

Response:

```json
{ "page": 1, "pages": 3, "total": 52, "items": [ /* Build */ ] }
```

### `GET /builds/top` — top rated builds

Most liked builds, only builds with at least one like, one per career (the best of each).
With `career`, its 10 best builds instead. Accepts `hero`, `career`, `weapon`.
`all=1` removes the cap and pages with `offset` and `limit` (default 40, max 200).

```json
{ "items": [ /* Build */ ], "hasMore": false }
```

### `GET /builds/:id` — one build

Returns a **Build** plus `teammateBuilds`: the recommended teammate builds that still exist, by id.

```json
{
  "...": "all Build fields",
  "teammateBuilds": { "12": { "id": 12, "title": "...", "heroId": "...", "careerId": "...", "author": "..." } }
}
```

### `GET /users/:username` — public profile

`{ id, username, avatar, createdAt, followerCount, builds: [ /* Build, newest first, capped */ ], ... }`

### `GET /builds/:id/comments` — comments of a build

## The Build object

```json
{
  "id": 42,
  "title": "My build",
  "description": "Free text, up to 2000 characters",
  "heroId": "kruber",
  "careerId": "mercenary",
  "data": { /* see below */ },
  "author": "Tester",
  "authorId": 7,
  "authorAvatar": "...",
  "likeCount": 3,
  "likedByMe": false,
  "bookmarkedByMe": false,
  "commentCount": 1,
  "createdAt": "2026-11-01 10:00:00",
  "updatedAt": "2026-11-05 18:30:00"
}
```

`likedByMe` and `bookmarkedByMe` are always `false` without a session.

### `data` (format version 2)

```json
{
  "v": 2,
  "balance": "V38.3",
  "talents": [1, 3, 2, 1, 1, 2],
  "weapons": {
    "melee":  { "weaponId": "sword", "traitId": "parry", "propertyIds": ["crit", "powervsskaven"] },
    "ranged": { "weaponId": "handgun", "traitId": null, "propertyIds": [] }
  },
  "equipment": {
    "necklace": { "traitId": "barkskin", "propertyIds": ["..."] },
    "charm":    { "traitId": null, "propertyIds": [] },
    "trinket":  { "traitId": null, "propertyIds": [] }
  },
  "difficulty": "c3",
  "deathwish": true,
  "breakpoints": [
    { "type": "melee", "hits": [ { "kind": "heavy", "zone": "head", "crit": true } ], "boosters": ["careerult"], "enemyIds": ["..."] },
    { "type": "stagger", "hits": [ { "kind": "pushattack" } ], "boosters": [], "enemyIds": ["..."] }
  ],
  "teammates": [ { "heroId": "...", "careerId": "...", "buildId": 12 } ],
  "teamDescription": "A few words about the team"
}
```

| Field | Details |
| --- | --- |
| `balance` | Tourney Balance version the build was made for. A build is *outdated* when it differs from the current version (`client/src/data/balance.json`). |
| `talents` | 6 numbers, one per talent tier (levels 5, 10, 15, 20, 25, 30). `0` = none, `1`, `2`, `3` = position of the talent in its tier (the talent ids in `heroes.json` are `"1"`, `"2"`, `"3"`). |
| `weapons` | Slots `melee` and `ranged`. `weaponId` can be `null`. Up to 2 distinct `propertyIds`. |
| `equipment` | Slots `necklace`, `charm`, `trinket`. Same shape without `weaponId`. |
| `difficulty` | `legend`, `c1`, `c2`, `c3` (difficulty the breakpoints were calculated for). |
| `deathwish` | `true` if the breakpoints are for Deathwish. |
| `breakpoints` | Fast breakpoint cards, 50 at most. 1 or 2 hits each. `type` is `melee`, `ranged` or `stagger`. A `stagger` card has exactly 1 hit and no `zone` / `crit`. `boosters` and `enemyIds` are ids from the game data. |
| `teammates` | Up to 3 recommended teammates (careers of other heroes), with an optional recommended build. |

### Where the ids come from

All ids are the ones of the JSON files in `client/src/data/` (public in the repository):

| File | Content |
| --- | --- |
| `heroes.json` | Heroes, careers (`id`, name, talents by tier) |
| `weapons.json` | Weapons: `id`, `heroId`, `type` (melee/ranged), `availableFor` (career ids) |
| `weapon-options.json` | Weapon traits and properties, per slot type (`melee`, `ranged`) |
| `equipment-options.json` | Necklace, charm and trinket traits and properties |
| `enemies.json` | Enemy ids for breakpoints |
| `breakpoint-attacks.json` | Breakpoint types, kinds of hit, zones, boosters |
| `difficulties.json` | Difficulty ids |
| `balance.json` | Current Tourney Balance version |

## Account endpoints (login required)

The session is an `httpOnly` cookie named `token` (7 days), set by `POST /auth/login`. There is no API key or token
for scripts: a script would have to log in like a browser. Authentication endpoints are limited to 30 requests per
15 minutes per IP.

| Method and path | Purpose |
| --- | --- |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Account and session (login body: `{ "identifier", "password" }`) |
| `POST /auth/forgot-password` and the other `/auth/*` routes | Password reset, email, account management |
| `POST /builds` | Create a build (body: `{ title, description, heroId, careerId, data }`). Title 5 to 30 characters. The server validates every id against the game data and writes the current `balance`. |
| `PUT /builds/:id` | Edit your build (same body). Brings it to the current balance version. |
| `POST /builds/:id/refresh` | "No major changes": mark your outdated build as up to date without editing it. |
| `DELETE /builds/:id` | Delete your build. |
| `GET /me/builds` | Your builds |
| `POST` / `DELETE /builds/:id/like` | Like / unlike (not your own build) |
| `POST` / `DELETE /builds/:id/bookmark`, `GET /me/bookmarks` | Private bookmarks |
| `POST /builds/:id/comments`, `DELETE /comments/:id`, `GET /me/notifications` | Comments |
| `POST` / `DELETE /users/:username/follow`, `GET /me/following`, `GET /me/following/new`, `GET /me/following/builds`, `PATCH /me/settings` | Follows and settings |

## Notes for external tools (e.g. a game mod)

- Reading is public and needs no login: `GET /builds/:id` is enough to fetch one build.
- A build only stores **ids**, never names or icons: map them with the game data files above.
- Unknown or removed ids can appear after a balance update: ignore what you do not recognise.
- The public read endpoints have no rate limit today. Please stay reasonable (cache a build instead of fetching it on every frame or every keypress).
- Please do not scrape the whole site. Ask first if you need bulk access.
