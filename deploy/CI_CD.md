# LiftForge — CI/CD Setup Guide

This guide covers setting up automated deployments via GitHub Actions. After completing this, every push to `main`, `uat`, or `test` in either repo will automatically build a Docker image and deploy it to the corresponding environment on your Hetzner VPS.

## How it works

```
Push to main  →  GitHub Actions builds API/Web image
              →  Pushes image to GitHub Container Registry (ghcr.io)
              →  SSHes into VPS
              →  Pulls new image
              →  Restarts the container (migrations run automatically on boot)
```

Branch → environment mapping:

| Branch | Environment | URLs |
|--------|-------------|------|
| `main` | production | liftforge.xyz / api.liftforge.xyz |
| `uat`  | UAT         | uat.liftforge.xyz / api.uat.liftforge.xyz |
| `test` | test        | test.liftforge.xyz / api.test.liftforge.xyz |

---

## Step 1 — Generate a dedicated SSH key for CI

Run this **on your local machine** (not the VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-liftforge" -f ~/.ssh/liftforge_ci -N ""
```

This creates:
- `~/.ssh/liftforge_ci` — private key (goes into GitHub Secrets)
- `~/.ssh/liftforge_ci.pub` — public key (goes onto the VPS)

### Add the public key to the VPS

```bash
# Copy the public key to your clipboard
cat ~/.ssh/liftforge_ci.pub
```

SSH into the VPS and append it to the deploy user's authorized keys:

```bash
ssh deploy@YOUR_VPS_IP
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Get the VPS known hosts fingerprint

Run this on your **local machine** — you'll need the output for a GitHub secret:

```bash
ssh-keyscan YOUR_VPS_IP
```

Copy the entire output (multiple lines starting with the IP address).

---

## Step 2 — Make GHCR packages public (recommended)

This lets the VPS pull images without needing to authenticate.

1. Go to your GitHub profile → **Packages**
2. After the first deploy runs (or manually create the packages), click on `liftforge-api` and `liftforge-web`
3. On each package page → **Package settings** → **Change visibility** → **Public**

If you prefer to keep images private, see [Private GHCR setup](#private-ghcr-optional) below.

---

## Step 3 — Add GitHub Secrets

Both repos need the same three secrets. Add them via:
**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Do this for **both** `liftforge-api` and `liftforge-web`.

| Secret name | Value |
|-------------|-------|
| `SSH_HOST` | Your VPS IP address (e.g. `123.456.789.0`) |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/liftforge_ci` (the private key file) |

> **Tip:** Use **GitHub Environments** (Settings → Environments) to have separate secrets per environment and add a manual approval gate on production. The workflows already reference the `production`, `uat`, and `test` environments — create them in GitHub to activate protection rules.

---

## Step 4 — Create the branches

If you don't have `uat` and `test` branches yet:

```bash
# In both repos
git checkout -b uat && git push origin uat
git checkout -b test && git push origin test
```

---

## Step 5 — (One-time) Bootstrap the VPS stacks

The first deploy via GitHub Actions will push images to GHCR, but the VPS stacks need to be running first (so the DB container exists and is healthy before the API starts).

SSH into the VPS and start each environment for the first time. This only needs to happen once:

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/liftforge/liftforge-api

# Start the DB first for each env, then bring up everything
docker compose -f docker-compose.prod.yml up -d db
sleep 15
docker compose -f docker-compose.prod.yml up -d

docker compose -f docker-compose.uat.yml up -d db
sleep 15
docker compose -f docker-compose.uat.yml up -d

docker compose -f docker-compose.test.yml up -d db
sleep 15
docker compose -f docker-compose.test.yml up -d
```

After this, GitHub Actions handles all subsequent deploys.

---

## Step 6 — Trigger your first automated deploy

```bash
# Deploy to test
git checkout test
git commit --allow-empty -m "chore: trigger CI test deploy"
git push origin test

# Deploy to UAT
git checkout uat
git commit --allow-empty -m "chore: trigger CI UAT deploy"
git push origin uat

# Deploy to production
git checkout main
git commit --allow-empty -m "chore: trigger CI prod deploy"
git push origin main
```

Watch the run in GitHub → Actions tab. The full flow (build + push + deploy) takes roughly 3–5 minutes on the first run, ~1–2 minutes on subsequent runs (thanks to layer caching).

---

## Workflow overview

### What triggers a deploy

| Repo | Trigger | What deploys |
|------|---------|-------------|
| `liftforge-api` | push to `main` / `uat` / `test` | API container only |
| `liftforge-web` | push to `main` / `uat` / `test` | Web (nginx) container only |

The DB container is never touched by CI — it only restarts if you manually intervene.

### What the API workflow does

1. Determines environment from branch name
2. Checks out source code
3. Builds the API Docker image (with GHA layer cache for speed)
4. Pushes two tags to GHCR: `:prod` (or `:uat`/`:test`) + `:<git-sha>`
5. SSHes into VPS → `git pull` (updates compose files) → `docker compose pull api` → `docker compose up -d --no-deps api`
6. The container starts → `docker-entrypoint.sh` runs `prisma migrate deploy` → app starts

### What the Web workflow does

1. Same environment resolution
2. Builds the Web image with the correct `VITE_API_BASE_URL` baked in
3. Pushes to GHCR
4. SSHes into VPS → `docker compose pull web` → `docker compose up -d --no-deps web`

### Image tags in GHCR

Every deploy creates two tags:
- `:prod` / `:uat` / `:test` — always points to the latest deploy of that env
- `:<git-sha>` — immutable, useful for rollbacks

---

## Rolling back a deploy

If a bad deploy goes out, roll back by re-pulling a previous image:

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/liftforge/liftforge-api

# Find the SHA of the last good commit
# e.g. PREVIOUS_SHA=abc1234def5678...

# Pull the specific image version
docker pull ghcr.io/mariozitko/liftforge-api:PREVIOUS_SHA

# Temporarily override the image in compose and restart
docker compose -f docker-compose.prod.yml stop api
docker tag ghcr.io/mariozitko/liftforge-api:PREVIOUS_SHA \
           ghcr.io/mariozitko/liftforge-api:prod
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

---

## Private GHCR (optional)

If you keep packages private, the VPS needs to authenticate to pull images.

**Generate a Personal Access Token (PAT):**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Create token with scope: `read:packages`
3. Copy the token

**Login on the VPS:**
```bash
ssh deploy@YOUR_VPS_IP
echo "YOUR_PAT" | docker login ghcr.io -u mariozitko --password-stdin
```

Docker saves the credentials in `~/.docker/config.json`. This is a one-time setup.

---

## Checking CI status

- GitHub Actions runs: `https://github.com/mariozitko/liftforge-api/actions`
- GitHub Actions runs: `https://github.com/mariozitko/liftforge-web/actions`
- GHCR packages: `https://github.com/mariozitko?tab=packages`

---

## Concurrency note

Both workflows use `concurrency: cancel-in-progress: false`. This means if two pushes land in quick succession, the second deploy waits for the first to finish rather than cancelling it. This prevents race conditions where a newer image is pushed but an older deploy script runs last.
