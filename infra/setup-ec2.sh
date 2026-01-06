#!/bin/bash

# Script to setup EC2 instance for AI Service deployment
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e

echo "🚀 Starting EC2 setup for AI Service..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Install Nginx
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    echo "✅ Nginx installed successfully"
else
    echo "✅ Nginx already installed"
fi

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/ai-service
sudo mkdir -p /opt/ai-service/data/chroma_db
sudo mkdir -p /opt/ai-service/data/app_data
sudo chown -R $USER:$USER /opt/ai-service

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

# Start Docker service
echo "🐳 Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Start Nginx service
echo "🌐 Starting Nginx service..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installations
echo ""
echo "✅ Setup completed!"
echo ""
echo "📋 Verification:"
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker-compose --version
echo ""
echo "Nginx version:"
nginx -v
echo ""
echo "⚠️  IMPORTANT: Please log out and log back in for Docker group permissions to take effect!"
echo "⚠️  Or run: newgrp docker"
echo ""
echo "📝 Next steps:"
echo "1. Copy your AI service code to /opt/ai-service"
echo "2. Copy .env file to /opt/ai-service/infra/.env"
echo "3. Copy chroma_db and data directories if needed"
echo "4. Run: cd /opt/ai-service/infra && docker-compose up -d"
echo "5. Copy nginx config: sudo cp infra/nginx/ai-service.conf /etc/nginx/sites-available/"
echo "6. Enable site: sudo ln -s /etc/nginx/sites-available/ai-service.conf /etc/nginx/sites-enabled/"
echo "7. Test nginx: sudo nginx -t"
echo "8. Reload nginx: sudo systemctl reload nginx"

