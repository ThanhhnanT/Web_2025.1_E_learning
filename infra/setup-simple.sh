#!/bin/bash

# Script setup đơn giản cho AI và Backend trên EC2
# Chạy: bash setup-simple.sh

set -e

echo "🚀 Starting setup for E-Learning services..."

# Update system
echo "📦 Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed"
fi

# Install Python 3.11
echo "📦 Installing Python 3.11..."
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Install build tools
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential cmake g++ gcc libopenblas-dev liblapack-dev pkg-config

# Install PM2
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/e-learning
sudo chown -R $USER:$USER /opt/e-learning

echo ""
echo "✅ Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Upload code to /opt/e-learning"
echo "2. Setup Backend:"
echo "   cd /opt/e-learning/backend"
echo "   npm install && npm run build"
echo "   nano .env  # Configure environment variables"
echo "   pm2 start npm --name 'backend' -- run start:prod"
echo ""
echo "3. Setup AI Service:"
echo "   cd /opt/e-learning/AI"
echo "   python3.11 -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo "   nano .env  # Configure environment variables"
echo "   pm2 start uvicorn --name 'ai-service' -- app:app --host 0.0.0.0 --port 8000"
echo ""
echo "4. Configure Nginx:"
echo "   sudo cp /opt/e-learning/infra/nginx/e-learning.conf /etc/nginx/sites-available/"
echo "   sudo ln -s /etc/nginx/sites-available/e-learning.conf /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "5. Save PM2:"
echo "   pm2 save"
echo "   pm2 startup"

