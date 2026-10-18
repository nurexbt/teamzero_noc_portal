# TeamZero Solutions Portal — Ubuntu Deployment & Installation Guide

Complete, step-by-step production deployment guide for the **TeamZero Solutions NOC & Customer Management Portal** on **Ubuntu 20.04, 22.04, and 24.04 LTS**.

---

## 📋 Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (compiled to static production bundle in `dist/`, served by Nginx).
- **Backend API**: Node.js Express daemon running on port `5001`, managed by **PM2**.
- **Database**: MySQL 8.0+ storing customers, devices, NMS portals, roles, and RBAC permissions.
- **Web Server & Reverse Proxy**: **Nginx** handles incoming HTTP/HTTPS traffic on ports 80/443, serves the Vite SPA frontend, and proxies `/api/*` requests to Express on `127.0.0.1:5001`.

---

## ⚡ Option 1: Quick 1-Command Automated Deployment

If you are deploying on a fresh Ubuntu server, run the automated installation script included in the repository:

```bash
# 1. Clone your repository (or upload project files to /var/www/teamzero)
sudo mkdir -p /var/www/teamzero
cd /var/www/teamzero
# (Clone or copy project files here)

# 2. Make the deployment script executable and run it
chmod +x deploy_ubuntu.sh
./deploy_ubuntu.sh
```

The script will automatically:
1. Update apt repositories and install Node.js 22 LTS, Nginx, MySQL Server, and PM2.
2. Install npm dependencies and build the Vite frontend (`dist/`).
3. Start the Express API with PM2 and configure auto-restart on boot.
4. Configure and activate the Nginx reverse proxy.
5. Perform an API health check.

---

## 🛠️ Option 2: Step-by-Step Manual Installation

Follow these steps for full control over your server configuration.

### Step 1: Update System Packages & Install Base Tools

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw nginx mysql-server build-essential
```

---

### Step 2: Install Node.js 22 LTS & PM2

The application requires Node.js >= 20.19.0 or Node.js >= 22.x:

```bash
# Add NodeSource official Node.js 22 LTS repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should show v22.x.x
npm -v

# Install PM2 process manager globally
sudo npm install -g pm2
```

---

### Step 3: Configure MySQL Database

1. Ensure MySQL is running and enabled on boot:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

2. Open the MySQL interactive shell:
```bash
sudo mysql
```

3. Create the database and dedicated database user (replace `'YourStrongPassword123!'` with your secure password):
```sql
CREATE DATABASE IF NOT EXISTS teamzero_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'teamzero_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourStrongPassword123!';
-- If using MySQL 8.4+: IDENTIFIED BY 'YourStrongPassword123!';

GRANT ALL PRIVILEGES ON teamzero_portal.* TO 'teamzero_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

4. Import the initial database schema and seed data:
```bash
cd /var/www/teamzero
mysql -u teamzero_user -p'YourStrongPassword123!' teamzero_portal < database/schema.sql
```

> **Default Seed Data Created**:
> - Roles: `Super Admin` (all permissions, system role), `Network Admin`, `NOC Operator`, `Read-Only`.
> - Super Admin account: Username: **`admin`** | Password: **`admin`** (first login prompts for password change).

---

### Step 4: Clone Code & Configure Environment Variables

1. Set appropriate directory permissions:
```bash
sudo chown -R $USER:$USER /var/www/teamzero
cd /var/www/teamzero
```

2. Create/edit the production `.env` file:
```bash
nano .env
```

3. Paste your production database credentials:
```env
PORT=5001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=teamzero_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=teamzero_portal
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

### Step 5: Install Dependencies & Build Frontend

```bash
# Install NPM dependencies
npm install

# Compile TypeScript and build production assets into /dist
npm run build
```

Verify that the `dist/` directory was generated and contains `index.html` and the `assets/` folder.

---

### Step 6: Start Backend API with PM2

Start the Express API server under PM2 process management to ensure it stays online and automatically recovers from crashes or reboots:

```bash
# Start backend API process
pm2 start server/index.js --name "teamzero-api"

# Configure PM2 to restart automatically on system boot
pm2 startup systemd
# (Run the sudo env PATH=... command printed on screen by the command above if prompted)

# Save the current PM2 process list
pm2 save
```

Verify the API is running locally:
```bash
curl http://127.0.0.1:5001/api/health
# Response: {"status":"healthy","database":"connected","timestamp":...}
```

---

### Step 7: Configure Nginx as Reverse Proxy

1. Create a new Nginx virtual host configuration:
```bash
sudo nano /etc/nginx/sites-available/teamzero
```

2. Paste the following configuration (replace `/var/www/teamzero` with your actual project directory if different, and `your_domain_or_ip` with your domain or server IP):

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Static Frontend SPA
    root /var/www/teamzero/dist;
    index index.html;

    # Gzip compression for high performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Route all frontend client-side routes to index.html (React Router support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

3. Enable the site and test the Nginx configuration:
```bash
# Enable the configuration
sudo ln -sf /etc/nginx/sites-available/teamzero /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl restart nginx
```

---

### Step 8: Configure Firewall (UFW)

Allow SSH, HTTP, and HTTPS traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

### Step 9: (Recommended) Secure with SSL / HTTPS (Let's Encrypt)

If you have a domain pointed to your Ubuntu server IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically obtain an SSL certificate, configure Nginx for HTTPS, and schedule automatic certificate renewal.

---

## 🔑 Default Administrator Credentials

| Parameter | Value |
| :--- | :--- |
| **Portal URL** | `http://<YOUR_SERVER_IP>` or `https://<YOUR_DOMAIN>` |
| **Username** | `admin` |
| **Password** | `admin` |
| **Role** | Super Admin (Full Access) |

> ⚠️ **First Login**: You will be immediately prompted to set a new password on your first login.

---

## 🖥️ Client Workstation Setup (1-Click WinBox Launch)

When your NOC engineers or operators use the web portal to connect to MikroTik devices via Winbox:
1. The portal generates `winbox://` protocol links with pre-filled device IP, username, and password.
2. For 1-click launch from the browser on Windows operator workstations:
   - Copy the [`tools/register-winbox-protocol.reg`](file:///d:/teamuser%20portal/free-react-tailwind-admin-dashboard-main/tools/register-winbox-protocol.reg) file from the repository to the operator's PC.
   - Ensure `winbox64.exe` is located in `C:\Users\<User>\Downloads\winbox64.exe` (or update the path in the `.reg` file).
   - Double-click `register-winbox-protocol.reg` and confirm to register the protocol handler in Windows.
3. Clicking **Open** in the customer device table will immediately pop open MikroTik Winbox and connect directly to the router.

---

## 📊 Maintenance & Operational Commands

### Manage Backend API (PM2)
```bash
# View running status and memory usage
pm2 status

# View live real-time logs
pm2 logs teamzero-api

# Restart backend after code changes
pm2 restart teamzero-api

# Stop backend
pm2 stop teamzero-api
```

### Manage Web Server (Nginx)
```bash
# Test Nginx configuration syntax
sudo nginx -t

# Reload configuration without downtime
sudo systemctl reload nginx

# View Nginx access & error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updating the Application
When pulling updates or making code modifications in the future:
```bash
cd /var/www/teamzero
git pull

# Rebuild frontend
npm install
npm run build

# Restart backend
pm2 restart teamzero-api

# Reload Nginx
sudo systemctl reload nginx
```
