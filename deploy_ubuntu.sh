#!/usr/bin/env bash
# ==============================================================================
# TeamZero Solutions Portal — Automated Ubuntu Setup & Deployment Script
# Supports: Ubuntu 20.04 / 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "============================================================"
echo " Starting TeamZero Solutions Portal Deployment on Ubuntu"
echo "============================================================"

# 1. Update system packages
echo "--> [1/7] Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl git unzip nginx build-essential mysql-server

# 2. Install Node.js 22 LTS if not already installed
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
    echo "--> [2/7] Installing Node.js 22.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 3. Install PM2 globally
echo "--> [3/7] Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Install NPM dependencies & Build Frontend
echo "--> [4/7] Installing project dependencies and building frontend..."
npm install
npm run build

# 5. Start / Restart Backend API with PM2
echo "--> [5/7] Starting backend API daemon via PM2..."
pm2 describe teamzero-api > /dev/null 2>&1 && pm2 restart teamzero-api || pm2 start server/index.js --name "teamzero-api"
pm2 save

# 6. Verify Nginx Configuration
echo "--> [6/7] Setting up Nginx..."
NGINX_CONF="/etc/nginx/sites-available/teamzero"
CURRENT_DIR=$(pwd)

if [ ! -f "$NGINX_CONF" ]; then
    sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name _;

    root $CURRENT_DIR/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOF

    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/teamzero
    sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t && sudo systemctl restart nginx

# 7. Check API Health
echo "--> [7/7] Checking API status..."
sleep 2
curl -s http://127.0.0.1:5001/api/health || true

echo ""
echo "============================================================"
echo " Deployment Complete!"
echo " Portal is live on: http://$(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo "============================================================"
