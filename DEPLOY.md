# Deploying Sigmar's Arsenal on a VPS (Ubuntu 24.04)

One machine runs everything: Caddy (HTTPS + reverse proxy) -> Node (API + built front end) -> the SQLite file.

```
Internet --443--> Caddy --localhost:3000--> Node (Express) --> server/data/app.db
```

Commands are for Ubuntu 24.04. Replace `sigmararsenal.xyz` and `SERVER_IP` with your values.
Lines starting with `#` are comments. Take your time: nothing here is urgent.

## 0. What you need

- The VPS (Ubuntu 24.04) and its IP address (sent by the host).
- The domain name.
- The code in a Git repository (GitHub). If the repository is private, see step 5.
- An email sending service for the password-reset mails (step 10). Can be done after the first launch.

## 1. Point the domain to the server

In the DNS settings of the registrar, create:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` (the bare domain) | `SERVER_IP` |
| A | `www` | `SERVER_IP` |

Propagation takes a few minutes to a few hours. Check from your PC: `nslookup sigmararsenal.xyz`.
If the host also gives an IPv6 address, you can add the same records with type `AAAA`.

## 2. First connection and a normal user

Connect as root (the host gives the password or a console in its panel):

```bash
ssh root@SERVER_IP
```

Create a user for the site, with sudo rights:

```bash
adduser deploy                 # choose a strong password
usermod -aG sudo deploy
```

**SSH key (recommended).** On your Windows PC (PowerShell), if you don't have a key yet:

```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Copy the line printed, then on the server:

```bash
su - deploy
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys     # paste the line, save (Ctrl+O, Enter, Ctrl+X)
chmod 600 ~/.ssh/authorized_keys
exit
```

Test from a NEW terminal: `ssh deploy@SERVER_IP` (it must work without asking the account password).
Only then disable root login and passwords:

```bash
sudo nano /etc/ssh/sshd_config.d/99-hardening.conf
```

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart ssh
```

Keep your first terminal open while testing, so you can undo a mistake.

## 3. Firewall and automatic security updates

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw unattended-upgrades git
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo dpkg-reconfigure -plow unattended-upgrades     # answer Yes
```

Port 3000 (Node) stays closed to the outside: only Caddy, on the same machine, talks to it.
If your host also has a firewall in its web panel, allow the same ports (22, 80, 443) there.

## 4. Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3
node -v        # v22.x
```

(`build-essential` and `python3` are only needed if the SQLite module has to be compiled.)

## 5. Get the code

```bash
cd ~
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPO.git sigmar
cd sigmar
```

Private repository: create a *deploy key* (`ssh-keygen -t ed25519 -f ~/.ssh/deploy_key`), add the `.pub` content in
GitHub > repository > Settings > Deploy keys (read only), then clone with the SSH address.

## 6. Build

```bash
cd ~/sigmar/client && npm ci && npm run build
cd ~/sigmar/server && npm ci --omit=dev
```

## 7. Configuration (`server/.env`)

```bash
cd ~/sigmar/server
cp .env.example .env
nano .env
```

Fill in at least:
- `JWT_SECRET`: paste the result of `openssl rand -hex 32`.
- `APP_URL=https://sigmararsenal.xyz` (https, no trailing slash).
- `NODE_ENV=production` (uncomment it; also protects against running `db:reset` by mistake).
- the `SMTP_*` values later (step 10).

```bash
chmod 600 .env
```

## 8. Run it as a service

```bash
sudo nano /etc/systemd/system/sigmar.service
```

```ini
[Unit]
Description=Sigmar's Arsenal
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/sigmar/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node --env-file=.env src/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sigmar
systemctl status sigmar            # "active (running)"
curl -I http://localhost:3000      # HTTP/1.1 200 OK
```

Logs: `journalctl -u sigmar -f` (Ctrl+C to leave).
`deploy.sh` (step 12) restarts the service with `sudo`, so it asks for the password of the `deploy` user.

## 9. HTTPS with Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

(If these lines have changed, the current ones are on caddyserver.com > Docs > Install.)

```bash
sudo nano /etc/caddy/Caddyfile
```

```
sigmararsenal.xyz {
    encode zstd gzip
    reverse_proxy localhost:3000
}

www.sigmararsenal.xyz {
    redir https://sigmararsenal.xyz{uri} permanent
}
```

```bash
sudo systemctl reload caddy
```

Caddy gets and renews the certificate by itself (the DNS records of step 1 must already point to the server).
Open `https://sigmararsenal.xyz`: the site is online. Caddy is the one reverse proxy in front of Node, which is
what the server expects by default (`TRUST_PROXY=1`).

## 10. Emails (password reset)

Create a free account on an email sending service (Brevo, Resend...). Follow its guide to:
1. **Verify the domain**: it gives you DNS records (SPF, DKIM, sometimes DMARC) to add at the registrar. Without
   them the emails land in spam, which is likely with a `.xyz` domain.
2. Get the SMTP settings. With Resend: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_USER=resend`,
   `SMTP_PASS=` your API key.
3. Add a DMARC record at the registrar (TXT, name `_dmarc`, value `v=DMARC1; p=none;`): it helps the emails stay out
   of spam.

Put them in `server/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` with an address of your
domain), then `sudo systemctl restart sigmar`.
Test: "Forgot password" on the site with your own account, and check the inbox AND the spam folder.

Abuse limits (built in): one reset email per account every 5 minutes, and 30 reset emails per hour for the whole
site. Never paste server logs in public: they can contain reset links.

## 11. Backups

```bash
crontab -e
```

Add (every night at 03:30, 7 copies kept in `server/backups`):

```
30 3 * * *  cd /home/deploy/sigmar/server && /usr/bin/npm run db:backup >> backup.log 2>&1
```

Test once by hand: `cd ~/sigmar/server && npm run db:backup && ls backups`.

**A copy outside the server** (the host's daily backup of the whole machine does not replace it). From your Windows
PC, e.g. once a week (PowerShell):

```powershell
scp "deploy@SERVER_IP:/home/deploy/sigmar/server/backups/app-*.db" "D:\backups\sigmar\"
```

**Restoring** (tested once, before you need it): `sudo systemctl stop sigmar`, replace `server/data/app.db` with a
copy, delete `app.db-wal` and `app.db-shm` if they exist, `sudo systemctl start sigmar`.

## 12. Updating the site

On your PC: commit and `git push`. On the server:

```bash
cd ~/sigmar && bash deploy.sh
```

(pulls the code, rebuilds, restarts). If you changed `server/.env`, only `sudo systemctl restart sigmar` is needed.
Game data (`client/src/data/*.json`, including `balance.json`) is read by the server at startup: the restart in
`deploy.sh` covers it.

## 13. After going live: checks

- [ ] `https://sigmararsenal.xyz` loads, the padlock is there, `www.` redirects.
- [ ] Register, create a build, edit it: the badge shows the Tourney Balance version.
- [ ] Browser console (F12) shows no "Refused to load..." errors: if one appears, send it (it is the CSP in
      `server/src/index.js`).
- [ ] Paste a build link in Discord: the preview shows the title and the career portrait. Discord keeps previews in
      cache: a new link or `?x=1` forces a refresh.
- [ ] "Forgot password" email arrives.
- [ ] `/privacy` page opens (footer link) and sign-up requires the checkbox.
- [ ] `npm run db:backup` works and the cron line is in `crontab -l`.
- [ ] Admin tools work: `cd ~/sigmar/server && npm run admin -- users` (see `server/scripts/README.md`).

## Troubleshooting

| Symptom | Where to look |
| --- | --- |
| Site down | `systemctl status sigmar`, `journalctl -u sigmar -n 50` |
| Certificate / HTTPS error | `journalctl -u caddy -n 50`; check the DNS records and that ports 80/443 are open |
| 502 Bad Gateway | Node is not running or not on port 3000 (`PORT` in `.env`) |
| Everyone gets "Too many requests" | The proxy is not trusted: check `TRUST_PROXY` (1 with Caddy) |
| Logged out after each restart | `JWT_SECRET` missing or different between runs |
| "Missing game data file" at start | The `client/src/data` folder is missing: `git pull` was incomplete |
