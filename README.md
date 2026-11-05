# Modded Builds — Vermintide 2 (Vue 3 + Node + SQLite)

## Run in development (2 terminals)

```bash
# Terminal 1: API (http://localhost:3000)
cd server && npm install && npm run dev

# Terminal 2: front end (http://localhost:5173, /api is proxied to the API)
cd client && npm install && npm run dev
```

The SQLite database is created automatically in `server/data/app.db`.

## Run in production (single process)

```bash
cd client && npm install && npm run build
cd ../server && npm install
JWT_SECRET="a-long-random-string" DB_PATH=/persistent/path/app.db npm start
```

The server serves both the API and the built front end (`client/dist`): same origin, no CORS.
The SQLite file must live on a PERSISTENT disk.

## Structure

- `server/src/db.js` SQLite schema (users, builds)
- `server/src/auth.js` JWT in an httpOnly cookie
- `server/src/routes/` /api/auth/_ and /api/builds_
- `client/src/data/` hero/career reference (PLACEHOLDER: replace with Modded Realm data)
- `client/src/views/` pages (list, detail, editor, login...)

## Password rules

At least 8 characters, including one number and one special character.

## Next steps

1. Replace `heroes.json` with the real reference data (talents, weapons, properties, traits) and swap the editor's text fields for selectors.
2. Show talent names in the build view.
3. Shareable URL-encoded build links and a guest editor (no account needed).
