# Impexina Office Software – Production Deployment Guide (Linux)

This document describes the **production-grade Linux setup** for the Impexina internal office software.
The system is designed for **20–30 internal users**, accessible **only from the office network**, and deployed on a **single Linux server**.

---

## 🧱 Architecture Overview

Office Users  
→ Office Router (Allowed IP)  
→ Internet  
→ Static Public IP (Linux Server)  
→ Nginx (Reverse Proxy + IP Restriction)  
→ Frontend (Next.js – Port 3000)  
→ Backend (Node.js – Port 4000)  
→ PostgreSQL (Localhost only)

---

## 🖥️ Server Requirements

- OS: Ubuntu 22.04 LTS
- Static Public IP (VPS / Dedicated Server)
- Domain name (e.g. app.company.com, api.company.com)
- Office router public IP (for access restriction)

---

## 🔐 Security Principles

- Office IP–restricted access (Firewall + Nginx)
- PostgreSQL bound to localhost only
- HTTPS via Let’s Encrypt
- No root SSH login
- SSH key-based authentication
- Process management via PM2

---

## 👤 Initial Server Setup

### Update system
```bash
sudo apt update && sudo apt upgrade -y
timedatectl set-timezone Asia/Kolkata
```

### Create deploy user
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## 🔐 Secure SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart ssh
```

---

## 🔥 Firewall (Office-Only Access)

Replace OFFICE_IP with your office router public IP.

```bash
sudo ufw reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow from OFFICE_IP to any port 22
sudo ufw allow from OFFICE_IP to any port 80
sudo ufw allow from OFFICE_IP to any port 443

sudo ufw enable
sudo ufw status
```

---

## 🧰 Install Core Packages

```bash
sudo apt install -y git curl build-essential nginx postgresql postgresql-contrib
```

---

## 🟢 Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

## 🚀 Install PM2

```bash
sudo npm install -g pm2
pm2 startup
```

---

## 🗄️ PostgreSQL Setup

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE impexina;
CREATE USER impexina_user WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE impexina TO impexina_user;
\q
```

Lock PostgreSQL to localhost:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

```conf
listen_addresses = 'localhost'
```

```bash
sudo systemctl restart postgresql
```

---

## 📁 Project Structure

```bash
mkdir -p ~/apps
cd ~/apps
git clone <BACKEND_REPO_URL> backend
git clone <FRONTEND_REPO_URL> frontend
```

---

## ⚙️ Backend Setup

```bash
cd ~/apps/backend
npm install
nano .env
```

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://impexina_user:STRONG_PASSWORD@localhost:5432/impexina
JWT_SECRET=CHANGE_THIS_SECRET
```

```bash
npx prisma generate
npx prisma db push
pm2 start src/server.js --name impexina-api
```

---

## 🌐 Frontend Setup

```bash
cd ~/apps/frontend
npm install
npm run build
pm2 start "npm start" --name impexina-frontend
pm2 save
```

---

## 🌍 Nginx Reverse Proxy

Frontend:
```nginx
server {
    listen 80;
    server_name app.company.com;

    allow OFFICE_IP;
    deny all;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Backend:
```nginx
server {
    listen 80;
    server_name api.company.com;

    allow OFFICE_IP;
    deny all;

    location / {
        proxy_pass http://localhost:4000;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 HTTPS (Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.company.com -d api.company.com
```

---

## 📜 Logs & Monitoring

```bash
pm2 logs
pm2 install pm2-logrotate
```

---

## ✅ Production Checklist

- Static server IP
- Office-only firewall
- HTTPS enabled
- PostgreSQL local-only
- PM2 auto-start enabled
- SSH secured
- No dev mode in production

---

## 🏁 Notes

This setup is intended for **internal office use only**.
For dynamic office IPs, use **WireGuard VPN** for secure access.
