# Sigmar's Arsenal — Vermintide 2 Modded Realm builds (Vue 3 + Node + SQLite)

Build sharing site for the Tourney Balance mod: talents, weapons, gear, breakpoints and ideal team, with likes,
comments, bookmarks and follows.

## Run in development (2 terminals)

Requires Node.js 20.6 or newer (22 recommended) and npm.

```bash
# Terminal 1: API (http://localhost:3000)
cd server && cp .env.example .env && npm install && npm run dev

# Terminal 2: front end (http://localhost:5173, /api is proxied to the API)
cd client && npm install && npm run dev
```

The SQLite database is created automatically in `server/data/app.db`. Without `SMTP_HOST`, emails (password reset)
are printed in the server console. Restart the server after changing the JSON files in `client/src/data/`.

## Production

The server serves both the API and the built front end (`client/dist`): same origin, no CORS.
Step-by-step guide for a VPS: **[DEPLOY.md](DEPLOY.md)**.

## Admin and maintenance

Moderation, password reset and backups: **[server/scripts/README.md](server/scripts/README.md)**.

## Structure

- `client/src/data/` game data (heroes, talents, weapons, gear...) and `balance.json` (the Tourney Balance version)
- `client/src/views/`, `client/src/components/` pages and components
- `server/src/db.js` SQLite schema, `server/src/auth.js` JWT in an httpOnly cookie, `server/src/routes/` the API
- `server/src/meta.js` link previews (Open Graph) of the build pages
- `server/scripts/` admin tool, backups, development tools

## Password rules

At least 8 characters, including one number and one special character.
