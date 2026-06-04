# LiftForge — Deployment Guide

This guide takes you from a fresh Hetzner VPS to a fully running LiftForge deployment with three isolated environments (production, UAT, test) behind HTTPS.

**Assumed starting point:** you have SSH access to a new VPS and nothing else installed.

---

## Architecture overview

```
Internet
   │
   ▼
[Hetzner VPS — single server]
   │
   ├── nginx (host, port 80/443) — SSL termination + subdomain routing
   │     ├── liftforge.xyz          → localhost:4001  (prod frontend)
   │     ├── api.liftforge.xyz      → localhost:3001  (prod API)
   │     ├── uat.liftforge.xyz      → localhost:4002  (UAT frontend)
   │     ├── api.uat.liftforge.xyz  → localhost:3002  (UAT API)
   │     ├── test.liftforge.xyz     → localhost:4003  (test frontend)
   │     └── api.test.liftforge.xyz → localhost:3003  (test API)
   │
   ├── Docker stack: prod  (API :3001, Web :4001, PostgreSQL internal)
   ├── Docker stack: uat   (API :3002, Web :4002, PostgreSQL internal)
   └── Docker stack: test  (API :3003, Web :4003, PostgreSQL internal)
```

Each Docker stack is an isolated `docker compose` project with its own database volume.

---

## Part 1 — VPS initial setup

### 1.1 Create the server

In Hetzner Cloud Console:
- Image: **Ubuntu 22.04**
- Type: CX21 (2 vCPU, 4 GB RAM) or larger
- Location: pick one close to your users
- Add your SSH public key during creation

### 1.2 SSH in as root

```bash
ssh root@YOUR_VPS_IP
```

### 1.3 Create a non-root user

```bash
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 1.4 Harden SSH (optional but recommended)

```bash
nano /etc/ssh/sshd_config
```

Set these:
```
PermitRootLogin no
PasswordAuthentication no
```

```bash
systemctl restart sshd
```

From now on, connect as `deploy`:
```bash
ssh deploy@YOUR_VPS_IP
```

### 1.5 Configure the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 1.6 Update the system

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Part 2 — Install Docker

```bash
# Install dependencies
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the Docker apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let the deploy user run docker without sudo
sudo usermod -aG docker deploy

# Re-login or run newgrp to pick up the group change
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Part 3 — Install nginx + Certbot

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Certbot (via snap — most reliable on Ubuntu 22.04)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

---

## Part 4 — DNS records (Cloudflare)

In your Cloudflare dashboard for `liftforge.xyz`, create the following **A records** all pointing to your VPS IP.

> **Cloudflare proxy (orange cloud):** you can enable it for all records — SSL termination will still work because we set `Full (strict)` mode. Alternatively turn proxy OFF (grey cloud) while setting up Certbot for the first time, then turn it back on.

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `@` (liftforge.xyz) | `YOUR_VPS_IP` | On |
| A | `www` | `YOUR_VPS_IP` | On |
| A | `api` | `YOUR_VPS_IP` | On |
| A | `uat` | `YOUR_VPS_IP` | On |
| A | `api.uat` | `YOUR_VPS_IP` | On |
| A | `test` | `YOUR_VPS_IP` | On |
| A | `api.test` | `YOUR_VPS_IP` | On |

Wait a few minutes for DNS to propagate before continuing.

---

## Part 5 — Clone the repositories

```bash
sudo mkdir -p /opt/liftforge
sudo chown deploy:deploy /opt/liftforge
cd /opt/liftforge

# Clone both repos (adjust URLs if private — use a deploy key)
git clone https://github.com/YOUR_ORG/liftforge-api.git
git clone https://github.com/YOUR_ORG/liftforge-web.git
```

The directory structure must be:
```
/opt/liftforge/
  liftforge-api/   ← docker-compose files live here
  liftforge-web/   ← referenced by compose via ../liftforge-web
```

---

## Part 6 — Create environment files

### Production

```bash
cd /opt/liftforge/liftforge-api
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in every `CHANGE_ME_*` value:

```
DB_PASSWORD=          # use a strong random password
JWT_SECRET=           # run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=   # same command, different value
RESEND_API_KEY=       # from resend.com dashboard
GOOGLE_CLIENT_ID=     # from Google Cloud Console
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=      # from Meta Developer Portal
FACEBOOK_APP_SECRET=
```

Make sure `DATABASE_URL` matches `DB_USER` and `DB_PASSWORD`:
```
DATABASE_URL=postgresql://liftforge:YOUR_DB_PASSWORD@db:5432/liftforge_prod
```

Secure the file:
```bash
chmod 600 .env.prod
```

### UAT and Test (same process)

```bash
cp .env.uat.example .env.uat && nano .env.uat && chmod 600 .env.uat
cp .env.test.example .env.test && nano .env.test && chmod 600 .env.test
```

Use **different** passwords and secrets for each environment.

---

## Part 7 — Temporary nginx config (for Certbot)

Certbot needs HTTP on port 80 to work. Create a temporary catch-all config:

```bash
sudo nano /etc/nginx/conf.d/liftforge-temp.conf
```

Paste:
```nginx
server {
    listen 80;
    server_name liftforge.xyz www.liftforge.xyz api.liftforge.xyz
                uat.liftforge.xyz api.uat.liftforge.xyz
                test.liftforge.xyz api.test.liftforge.xyz;
    root /var/www/html;
    location / { try_files $uri $uri/ =404; }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Part 8 — Obtain SSL certificates

Run Certbot once per domain group. Certbot will add HTTPS blocks automatically:

```bash
# Production
sudo certbot --nginx \
  -d liftforge.xyz \
  -d www.liftforge.xyz \
  -d api.liftforge.xyz \
  --email your@email.com --agree-tos --no-eff-email

# UAT
sudo certbot --nginx \
  -d uat.liftforge.xyz \
  -d api.uat.liftforge.xyz \
  --email your@email.com --agree-tos --no-eff-email

# Test
sudo certbot --nginx \
  -d test.liftforge.xyz \
  -d api.test.liftforge.xyz \
  --email your@email.com --agree-tos --no-eff-email
```

Verify auto-renewal works:
```bash
sudo certbot renew --dry-run
```

---

## Part 9 — Install the production nginx configs

Remove the temporary config and install the real ones:

```bash
sudo rm /etc/nginx/conf.d/liftforge-temp.conf

# Copy the nginx configs from the repo
sudo cp /opt/liftforge/liftforge-api/deploy/nginx/conf.d/prod.conf  /etc/nginx/conf.d/liftforge-prod.conf
sudo cp /opt/liftforge/liftforge-api/deploy/nginx/conf.d/uat.conf   /etc/nginx/conf.d/liftforge-uat.conf
sudo cp /opt/liftforge/liftforge-api/deploy/nginx/conf.d/test.conf  /etc/nginx/conf.d/liftforge-test.conf

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Part 10 — First deploy

### Make the deploy script executable

```bash
chmod +x /opt/liftforge/liftforge-api/deploy/deploy.sh
```

### Deploy production

```bash
cd /opt/liftforge/liftforge-api
docker compose -f docker-compose.prod.yml up -d --build
```

The first build takes 3–5 minutes (downloads Node image, installs npm packages, compiles TypeScript).

On startup the API container automatically runs `prisma migrate deploy` before the app starts.

Watch the logs live:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Verify

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Test API response
curl https://api.liftforge.xyz/api   # should return Swagger JSON

# Test frontend (should return HTML)
curl -I https://liftforge.xyz
```

Then open https://liftforge.xyz in a browser.

### Deploy UAT and Test (same process)

```bash
docker compose -f docker-compose.uat.yml up -d --build
docker compose -f docker-compose.test.yml up -d --build
```

---

## Part 11 — Redeploying (rolling updates)

After pushing new code to git, redeploy with:

```bash
# Using the deploy script
/opt/liftforge/liftforge-api/deploy/deploy.sh prod
/opt/liftforge/liftforge-api/deploy/deploy.sh uat
/opt/liftforge/liftforge-api/deploy/deploy.sh test

# Or manually for a single service (faster — only rebuilds the API, not the DB)
cd /opt/liftforge/liftforge-api
git pull origin main
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

The `--no-deps` flag restarts only the API container without touching the database or frontend.

To redeploy only the frontend (after a UI change):
```bash
cd /opt/liftforge/liftforge-web && git pull origin main
cd /opt/liftforge/liftforge-api
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d --no-deps web
```

---

## Part 12 — Useful day-to-day commands

### View logs

```bash
# All services (tail 100 lines + follow)
docker compose -f docker-compose.prod.yml logs -f --tail=100

# API only
docker compose -f docker-compose.prod.yml logs -f api

# Database only
docker compose -f docker-compose.prod.yml logs -f db
```

### Container status

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.uat.yml ps
docker compose -f docker-compose.test.yml ps

# All running containers on the server
docker ps
```

### Restart a single service

```bash
docker compose -f docker-compose.prod.yml restart api
```

### Stop an environment

```bash
docker compose -f docker-compose.prod.yml down
```

### Stop and wipe the database (DESTRUCTIVE — deletes all data)

```bash
docker compose -f docker-compose.prod.yml down -v
```

---

## Part 13 — Database operations

### Run migrations manually

If migrations didn't run automatically (e.g. after a failed deploy):

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Open a psql shell

```bash
docker compose -f docker-compose.prod.yml exec db psql -U liftforge -d liftforge_prod
```

### Backup the database

```bash
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U liftforge liftforge_prod \
  > /opt/liftforge/backups/prod_$(date +%Y%m%d_%H%M%S).sql
```

Create a simple daily backup cron:
```bash
mkdir -p /opt/liftforge/backups
crontab -e
```

Add:
```
0 3 * * * docker compose -f /opt/liftforge/liftforge-api/docker-compose.prod.yml exec -T db pg_dump -U liftforge liftforge_prod > /opt/liftforge/backups/prod_$(date +\%Y\%m\%d).sql 2>&1
```

### Restore from backup

```bash
# Stop the API first to avoid writes during restore
docker compose -f docker-compose.prod.yml stop api

# Drop + recreate the database
docker compose -f docker-compose.prod.yml exec db \
  psql -U liftforge -c "DROP DATABASE liftforge_prod; CREATE DATABASE liftforge_prod;"

# Restore
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U liftforge liftforge_prod < /opt/liftforge/backups/prod_20240101_030000.sql

# Restart the API
docker compose -f docker-compose.prod.yml start api
```

### Seed the database (UAT / Test only)

```bash
docker compose -f docker-compose.uat.yml exec api npm run seed:staging
```

---

## Part 14 — SSL certificate renewal

Certbot auto-renews via a systemd timer. To check:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

After renewal, nginx needs to reload:
```bash
sudo systemctl reload nginx
```

To automate the nginx reload after renewal, add a deploy hook:
```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

```bash
#!/bin/bash
systemctl reload nginx
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## Part 15 — Troubleshooting

### Container exits immediately

```bash
docker compose -f docker-compose.prod.yml logs api
```

Common causes:
- Missing env var — check `.env.prod` has all required keys
- Database not ready — the healthcheck should handle this, but if the DB is very slow to start, the API may fail before `service_healthy` is reached. Try `docker compose up -d db` first, wait 30s, then `docker compose up -d api`
- Migration failure — check logs for `prisma migrate deploy` errors; may need to manually resolve schema conflicts

### Migrations fail

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate status
```

If there's a drift, you may need to run:
```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate resolve --applied <migration_name>
```

### CORS errors in the browser

Check that `FRONTEND_URL` in `.env.prod` exactly matches the URL the browser is using (including `https://`, no trailing slash). Example:
```
FRONTEND_URL=https://liftforge.xyz
```

If you're behind Cloudflare, make sure the `X-Forwarded-Proto` header is being forwarded — the nginx config in this repo already sets it.

### "502 Bad Gateway" from nginx

The Docker container on that port isn't running or isn't healthy:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api
```

Verify the port is actually listening:
```bash
ss -tlnp | grep 3001   # prod API
ss -tlnp | grep 4001   # prod frontend
```

### Docker build fails (out of disk space)

```bash
# Show disk usage
df -h
docker system df

# Clean up unused images, containers, volumes
docker system prune -af
docker volume prune -f
```

### Cloudflare + SSL issues

If Certbot can't issue certs because Cloudflare is proxying the domain:
- Temporarily set the DNS records to **DNS only** (grey cloud) in Cloudflare
- Run Certbot
- Switch back to **Proxied** (orange cloud)

---

## Quick reference

| Task | Command |
|------|---------|
| Deploy prod | `./deploy/deploy.sh prod` |
| Deploy UAT | `./deploy/deploy.sh uat` |
| Deploy test | `./deploy/deploy.sh test` |
| Prod logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| Prod status | `docker compose -f docker-compose.prod.yml ps` |
| Run migrations | `docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy` |
| Postgres shell | `docker compose -f docker-compose.prod.yml exec db psql -U liftforge -d liftforge_prod` |
| Backup DB | `docker compose -f docker-compose.prod.yml exec db pg_dump -U liftforge liftforge_prod > backup.sql` |
| Restart API | `docker compose -f docker-compose.prod.yml restart api` |
| Stop env | `docker compose -f docker-compose.prod.yml down` |
| Reload nginx | `sudo nginx -t && sudo systemctl reload nginx` |
| Check SSL renewal | `sudo certbot renew --dry-run` |
