# Deployment Guide: Predictive Distribution System (DINZIN)

This project uses an automated 2-script deployment model (identical to the DINZIN platform standard).

---

## Quick Start (Fresh Server)

To deploy on a fresh Ubuntu 22.04 or 24.04 LTS VPS:

```bash
# 1. Clone the repository
git clone <YOUR_GIT_REPO_URL>
cd predictive-distribution-system

# 2. Make scripts executable
chmod +x setup.sh deploy.sh

# 3. Provision the server (runs once)
sudo ./setup.sh

# 4. Deploy and launch all services
./deploy.sh
```

---

## What the Scripts Do

### 1. `setup.sh` (Server Provisioning)
Run once as root.
- Updates system packages and installs `curl`, `git`, `ufw`, `fail2ban`, `jq`, `cron`.
- Configures a **2GB swapfile** to prevent Out-Of-Memory (OOM) during Next.js multi-stage container builds.
- Installs the latest **Docker Engine** and **Docker Compose plugin**.
- Configures Docker daemon log rotation (max 50MB per container, 5 files) to prevent disk space exhaustion.
- Enables the **UFW firewall**, opening only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS).
- Adds the current non-root user to the `docker` group.

### 2. `deploy.sh` (Automated Build & Deploy)
Run whenever you want to deploy, configure, or update.
- **Auto-Configures `.env.prod`**: If `deploy/.env.prod` does not exist, it interactively asks for your domain and admin email, then auto-generates:
  - Secure PostgreSQL password
  - 32-byte AES-256-GCM `MASTER_ENCRYPTION_KEY`
  - Cryptographic `JWT_SECRET`
- **Pulls & Builds**: Pulls base images and compiles the Fastify API, BullMQ worker, and Next.js Web app.
- **Starts Database & Queue**: Boots PostgreSQL 16 and Valkey (Redis), waiting until PostgreSQL health checks pass.
- **Executes Migrations**: Runs Drizzle ORM migrations via `@app/db`.
- **Zero-Downtime Rollout**: Starts all services (`caddy`, `api`, `worker`, `web`, `postgres`, `valkey`).
- **Automated Nightly Backups**: Registers a daily cron job (`/etc/cron.d/pds-backup`) that dumps PostgreSQL at 2:00 AM with a 14-day retention cycle.
- **SSL Auto-Provisioning**: Caddy provisions and auto-renews Let's Encrypt certificates for `APP_DOMAIN` and on-demand tracking domains.

---

## Architecture Overview

```
                      Internet
                         │
                         ▼ (80/443)
              ┌──────────────────────┐
              │    Caddy Proxy       │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
    /api/*, /t/*                         /*
┌──────────────────┐            ┌──────────────────┐
│   Fastify API    │            │   Next.js 15     │
│   (@app/api)     │            │   (@app/web)     │
└────────┬─────────┘            └──────────────────┘
         │
         ├───────────────────────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│  PostgreSQL 16   │            │   Valkey / Redis │
│  (Persistent)    │            │   (BullMQ Queue) │
└──────────────────┘            └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │  BullMQ Worker   │
                                │  (Background)    │
                                └──────────────────┘
```

---

## Routine Operations

### Check Service Status
```bash
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml ps
```

### Tail Live Logs
```bash
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml logs -f
# Or tail a specific service:
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml logs -f api
```

### Updating the Application
```bash
git pull origin main
./deploy.sh
```

### Manual Database Backup
```bash
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml exec -T postgres \
  pg_dump -U pds_admin pds_production | gzip > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

