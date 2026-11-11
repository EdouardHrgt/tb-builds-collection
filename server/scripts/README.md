# Server scripts

All commands are run **from the `server/` folder, on the machine that holds the database** (your PC for the
development database, the production machine for the real one). A script never touches another machine's data.
They read the same settings as the server (`DB_PATH`, in `server/.env`), and they can run while the site is online.

If your host gives you environment variables instead of a `.env` file, run the scripts without npm:
`node scripts/admin.js <command>` (and `node scripts/backup-db.js`).

## Admin (production)

`npm run admin -- <command> [argument] [--yes]`

| Command | What it does |
| --- | --- |
| `users [text]` | Lists users (filtered by username / email if a text is given) with their number of builds |
| `user <name\|email\|id>` | Details of one account |
| `export <user>` | Writes everything held about an account (profile, email, builds, comments, likes, bookmarks, follows; never the password) to `exports/<name>-<date>.json`. For a user's data request: send them the file privately (WinSCP to download it), then delete it |
| `reset-password <user>` | Sets a new random password, prints it, logs the user out everywhere. Send it to them privately: they change it in *My builds > Account* |
| `logout <user>` | Logs the user out of every device |
| `admin-avatar <user> [off]` | Gives the admin-only avatar (`avatar-admin` in `avatars.json`, image `client/public/profile/avatar-admin.webp`) to an account; users cannot pick it. `off` takes it back (default avatar). If that user picks another avatar later, run the command again |
| `delete-user <user>` | Deletes the account and everything it owns: builds, comments, likes, follows |
| `builds <user>` | Lists the builds of a user (ids, titles, likes) |
| `delete-build <id>` | Deletes a build with its likes, bookmarks and comments |
| `comments <build id>` | Lists the comments of a build with their ids |
| `delete-comment <id>` | Deletes a comment and the replies under it |

Destructive commands ask you to type `yes`; `--yes` skips the question. Examples:

```
npm run admin -- users john
npm run admin -- reset-password john
npm run admin -- comments 42
npm run admin -- delete-comment 317
```

A user who lost their password normally uses "Forgot password" (needs the email settings, `SMTP_*`). `reset-password`
is for when that does not work. There is no way to read a password: only a new one can be set.

## Backups

`npm run db:backup` copies the database to `backups/app-YYYY-MM-DD-HHMM.db` (a consistent copy, safe while the site
runs) and deletes the oldest ones.

| Setting (environment) | Default | Meaning |
| --- | --- | --- |
| `BACKUP_DIR` | `./backups` | Where the copies go |
| `BACKUP_KEEP` | `7` | How many copies to keep |

It does **not** run by itself: schedule it once a day. On a Linux server, `crontab -e`, then (03:30 every night):

```
30 3 * * *  cd /path/to/server && /usr/bin/npm run db:backup >> backup.log 2>&1
```

A backup on the same disk as the database does not survive a dead disk: also copy `BACKUP_DIR` somewhere else
(another machine, object storage, even a weekly download to your PC).

**Restoring**: stop the server, replace the database file (`DB_PATH`, `data/app.db` by default) with the chosen
copy, delete `app.db-wal` and `app.db-shm` next to it if they exist, start the server.

## Development only

| Command | What it does |
| --- | --- |
| `npm run db:reset` | Wipes all data. Refuses to run with `NODE_ENV=production` |
| `npm run check:icons` | Checks that the icons referenced by the game data exist |
| `node --env-file=.env scripts/seed-test-users.js` | Creates 5 fake users with builds, likes and comments to try the site |
| `node --env-file=.env scripts/delete-builds.js old\|all` | Bulk delete: builds in the outdated format, or EVERY build (dry run unless `--yes`). Never run `all` on production |
