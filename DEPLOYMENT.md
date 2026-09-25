# 🚀 Voxen Cloud Services Production Deployment Guide

This guide provides end-to-end instructions for deploying **Voxen Cloud Services** on an **Ubuntu 22.04 / 24.04 LTS** virtual machine (e.g., **AWS EC2**, DigitalOcean, Linode, or any VPS) using Docker, Docker Compose, Nginx, Let's Encrypt SSL, and optional AWS S3 cloud storage.

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & EC2 Instance Setup](#2-prerequisites--ec2-instance-setup)
3. [Security Group & Firewall Configuration](#3-security-group--firewall-configuration)
4. [Installing Docker & Docker Compose](#4-installing-docker--docker-compose)
5. [Cloning the Repository & Project Structure](#5-cloning-the-repository--project-structure)
6. [Environment Variables Configuration](#6-environment-variables-configuration)
7. [Starting the Application](#7-starting-the-application)
8. [Domain Configuration (DNS)](#8-domain-configuration-dns)
9. [Enabling HTTPS with Let's Encrypt & Certbot](#9-enabling-https-with-lets-encrypt--certbot)
10. [Optional: AWS S3 Production File Storage](#10-optional-aws-s3-production-file-storage)
11. [CI/CD Deployment with GitHub Actions](#11-cicd-deployment-with-github-actions)
12. [Monitoring, Health Checks & Log Management](#12-monitoring-health-checks--log-management)
13. [Service Lifecycle Management](#13-service-lifecycle-management)
14. [PostgreSQL Backup & Restoration](#14-postgresql-backup--restoration)
15. [Troubleshooting & FAQs](#15-troubleshooting--faqs)

---

## 1. Architecture Overview

```text
               Public Internet (HTTPS / Port 443 & HTTP / Port 80)
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Nginx Reverse Proxy     │
                        │  (SSL Termination & Rate) │
                        └─────────────┬─────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
      /api/* requests                                  /* requests
              │                                               │
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│   Node.js / Express API   │                   │    React + Vite Client    │
│  (JWT, Multer, REST API)  │                   │      (Static Nginx)       │
└─────────────┬─────────────┘                   └───────────────────────────┘
              │
      ┌───────┴───────────────┐
      │                       │
      ▼                       ▼
┌──────────────┐     ┌──────────────────────┐
│  PostgreSQL  │     │ Storage Provider:    │
│  15 Database │     │ • Local Volume       │
│  (Persistent)│     │ • AWS S3 Bucket      │
└──────────────┘     └──────────────────────┘
```

---

## 2. Prerequisites & EC2 Instance Setup

### Recommended AWS EC2 Instance Specs

* **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type (64-bit x86)
* **Instance Type**: `t3.small` or `t3.medium` (Minimum: 2 vCPUs, 2 GB RAM; Recommended: 4 GB RAM)
* **Storage**: 30+ GB gp3 SSD
* **Elastic IP**: Recommended to attach an AWS Elastic IP to preserve IP address across reboots.

---

## 3. Security Group & Firewall Configuration

Configure the AWS Security Group attached to your EC2 instance with the following inbound rules:

| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `Your_IP/32` (or Bastion) | Administrative SSH Access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web Traffic & Certbot Challenges |
| **HTTPS**| TCP | `443`| `0.0.0.0/0` | Secure SSL Web Traffic |

> ⚠️ **Security Warning**: Never open port `5432` (PostgreSQL) or `5000` (Backend API) to `0.0.0.0/0`. In production, these services communicate internally inside the Docker network.

---

## 4. Installing Docker & Docker Compose

Connect to your EC2 instance via SSH:

```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Update packages and install the latest Docker Engine and Docker Compose plugin:

```bash
# Update repository index
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker packages
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker on boot and add ubuntu user to docker group
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Apply group changes without logging out
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 5. Cloning the Repository & Project Structure

Prepare deployment folder:

```bash
sudo mkdir -p /opt/voxen
sudo chown -R $USER:$USER /opt/voxen
cd /opt/voxen

# Clone repository
git clone https://github.com/<your-username>/voxen-cloud-services.git .
```

---

## 6. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
nano .env
```

Set the production variables:

```env
NODE_ENV=production
PORT=5000
APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# PostgreSQL Credentials
POSTGRES_USER=docuser
POSTGRES_PASSWORD=GENERATE_A_STRONG_RANDOM_PASSWORD
POSTGRES_DB=docmanager

# JWT Secret (Generate a 64+ char random string using: openssl rand -hex 32)
JWT_SECRET=YOUR_64_CHAR_HEX_SECRET_STRING_HERE

# Max Upload Size (10MB default = 10485760 bytes)
MAX_FILE_SIZE=10485760

# Storage Provider Strategy
STORAGE_PROVIDER=local
UPLOAD_DIR=/app/uploads

# AWS S3 Cloud Storage (Optional - see Section 10)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Container Registry
DOCKER_REGISTRY=ghcr.io/<your-username>
IMAGE_TAG=latest
```

---

## 7. Starting the Application

Build and run all services in detached mode:

```bash
# For local building on VM:
docker compose up --build -d

# Verify all containers are running and healthy:
docker compose ps
```

Expected output:
```text
NAME              IMAGE              COMMAND                  SERVICE      STATUS                    PORTS
voxen-postgres    postgres:15-alpine "docker-entrypoint.s…"   postgres     Up (healthy)              0.0.0.0:5432->5432/tcp
voxen-backend     voxen-backend      "docker-entrypoint.s…"   backend      Up (healthy)              5000/tcp
voxen-frontend    voxen-frontend     "docker-entrypoint.s…"   frontend     Up                        80/tcp
voxen-nginx       nginx:alpine       "/docker-entrypoint.…"   nginx        Up                        0.0.0.0:80->80/tcp
```

---

## 8. Domain Configuration (DNS)

In your DNS provider (e.g., AWS Route 53, Cloudflare, Namecheap, GoDaddy):

1. Create an **A Record**:
   * Name: `@` (or `voxen.yourdomain.com`)
   * Value: `<YOUR-EC2-PUBLIC-IP>`
   * TTL: `300` seconds
2. Create a **CNAME Record**:
   * Name: `www`
   * Value: `yourdomain.com`

Verify propagation:
```bash
dig +short yourdomain.com
```

---

## 9. Enabling HTTPS with Let's Encrypt & Certbot

Run standalone Certbot or use the webroot method with Nginx:

```bash
# Install Certbot
sudo apt install -y certbot

# Stop Nginx temporarily to obtain the initial certificate
docker compose stop nginx

# Request certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email

# Certificates will be stored in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Edit `nginx/default.conf` to enable the SSL block:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Restart Nginx:
```bash
docker compose up -d nginx
```

### Auto-Renewal Cron Job
Add automated renewal to `crontab`:
```bash
sudo crontab -e
```
Add line:
```text
0 3 * * * certbot renew --post-hook "cd /opt/voxen && docker compose restart nginx" >> /var/log/certbot-renew.log 2>&1
```

---

## 10. Optional: AWS S3 Production File Storage

To scale file storage beyond local disk space, configure AWS S3:

1. **Create an S3 Bucket** in the AWS Console (e.g., `voxen-production-storage`).
2. **Block Public Access**: Keep all public access blocked. Files are securely served through Voxen Cloud Services backend authorization checks.
3. **Create IAM Policy & User**:
   Attach the following policy to an IAM user:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::voxen-production-storage",
           "arn:aws:s3:::voxen-production-storage/*"
         ]
       }
     ]
   }
   ```
4. **Update `.env`**:
   ```env
   STORAGE_PROVIDER=s3
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=voxen-production-storage
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalrXUtn...
   ```
5. **Restart Backend**:
   ```bash
   docker compose restart backend
   ```

---

## 11. CI/CD Deployment with GitHub Actions

The repository includes `.github/workflows/deploy.yml` which automatically:
1. Runs tests on pull requests and pushes to `main`.
2. Builds Docker images and pushes to GitHub Container Registry (GHCR).
3. Connects via SSH to your AWS EC2 instance, pulls updated images, restarts containers, and validates `/api/health`.

### Configure GitHub Repository Secrets

Go to **Repository Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **New repository secret**:

| Secret Name | Value Example | Description |
| :--- | :--- | :--- |
| `SSH_HOST` | `54.210.12.34` | Public IP or DNS of your EC2 instance |
| `SSH_USER` | `ubuntu` | SSH username (default for Ubuntu AMI) |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY...` | Contents of your EC2 `.pem` private key |
| `SSH_PORT` | `22` | SSH port |

---

## 12. Monitoring, Health Checks & Log Management

### Check Service Health
```bash
curl -i http://localhost/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Voxen Cloud Services API",
  "database": "connected",
  "databaseLatency": "2ms",
  "timestamp": "2026-09-25T14:30:00.000Z",
  "uptime": "1200s",
  "environment": "production",
  "storageProvider": "local"
}
```

### View Live Logs
```bash
# View logs from all services:
docker compose logs -f

# View backend API logs:
docker compose logs -f backend

# View Nginx access & error logs:
docker compose logs -f nginx

# View PostgreSQL logs:
docker compose logs -f postgres
```

### Resource Monitoring
```bash
# Live CPU and Memory usage per container:
docker stats
```

---

## 13. Service Lifecycle Management

```bash
# View container status
docker compose ps

# Restart a specific service (e.g. backend)
docker compose restart backend

# Stop all containers
docker compose stop

# Start all containers
docker compose start

# Graceful shutdown (preserves volumes)
docker compose down

# Rebuild containers after code update
docker compose up --build -d
```

---

## 14. PostgreSQL Backup & Restoration

### Backup Database
Run an automated dump to a compressed `.sql.gz` file:

```bash
# Create backups directory
mkdir -p /opt/voxen/backups

# Execute backup
docker compose exec -T postgres pg_dump -U docuser -d docmanager | gzip > /opt/voxen/backups/voxen_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database
```bash
# Restore from backup
gunzip < /opt/voxen/backups/voxen_backup_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U docuser -d docmanager
```

### Automated Nightly Backup Cron
Add to crontab (`crontab -e`):
```text
0 2 * * * cd /opt/voxen && docker compose exec -T postgres pg_dump -U docuser -d docmanager | gzip > /opt/voxen/backups/voxen_backup_$(date +\%Y\%m\%d).sql.gz && find /opt/voxen/backups/ -type f -name "*.sql.gz" -mtime +14 -delete
```

---

## 15. Troubleshooting & FAQs

### Database Connection Failure on Startup
* Verify Postgres container is healthy: `docker compose ps postgres`
* Check logs: `docker compose logs postgres`
* The backend includes automatic retry logic with exponential backoff on startup.

### File Upload 413 "Payload Too Large"
* Verify `client_max_body_size 50M;` is active in `nginx/nginx.conf`.
* Verify `MAX_FILE_SIZE` in `.env` is sufficiently high.

### CORS Errors in Browser
* Set `CORS_ORIGIN=https://yourdomain.com` in `.env` matching your frontend domain.

---

🎉 **Your Voxen Cloud Services system is now fully deployed and production-ready!**
