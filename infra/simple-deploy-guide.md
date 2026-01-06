# Hướng dẫn Deploy AI và Backend lên EC2 (Đơn giản - Không Docker)

Hướng dẫn deploy cả AI service (FastAPI) và Backend (NestJS) trực tiếp trên EC2, không dùng Docker.

## Bước 1: Setup EC2 Instance

### Tạo EC2 Instance
- Ubuntu 22.04 LTS
- Instance type: t3.medium hoặc t3.large (đủ RAM)
- Storage: 20GB
- Security Group: mở port 22 (SSH), 80 (HTTP)

### SSH vào EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

## Bước 2: Cài đặt Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Cài Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài Python 3.11 (hoặc dùng Python 3.10)
# Cách 1: Cài Python 3.11 từ deadsnakes PPA
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Cách 2: Hoặc dùng Python 3.10 có sẵn (đơn giản hơn)
# sudo apt-get install -y python3.10 python3.10-venv python3-pip

# Cài build tools cho Python packages
sudo apt-get install -y build-essential cmake g++ gcc libopenblas-dev liblapack-dev pkg-config

# Cài PM2 (process manager)
sudo npm install -g pm2

# Cài Nginx
sudo apt-get install -y nginx

# Cấu hình firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable
```

## Bước 3: Upload Code

### Clone repository
```bash
cd /opt
sudo git clone YOUR_REPO_URL e-learning
sudo chown -R $USER:$USER e-learning
cd e-learning
```

### Hoặc upload bằng SCP (từ máy local)
```bash
scp -i your-key.pem -r . ubuntu@YOUR_EC2_IP:/opt/e-learning/
```

## Bước 4: Setup Backend (NestJS)

```bash
cd /opt/e-learning/backend

# Cài dependencies
npm install

# Build
npm run build

# Tạo file .env
nano .env
```

**Nội dung file .env:**
```env
PORT=3000
NODE_ENV=production
MONGGO_URL=mongodb+srv://username:password@cluster.mongodb.net/E-Learning
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
MAILDEV_INCOMING_USER=your_email@gmail.com
MAILDEV_INCOMING_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
MAIL_SENDER_NAME=Learnify
```

**Chạy Backend với PM2:**
```bash
cd /opt/e-learning/backend
pm2 start npm --name "backend" -- run start:prod
pm2 save
pm2 startup
```

## Bước 5: Setup AI Service (FastAPI)

```bash
cd /opt/e-learning/AI

# Tạo virtual environment
# Nếu dùng Python 3.11:
python3.11 -m venv venv
# Hoặc nếu dùng Python 3.10:
# python3.10 -m venv venv

source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Cài dependencies (có thể mất 15-30 phút)
pip install -r requirements.txt

# Tạo file .env
nano .env
```

**Nội dung file .env:**
```env
MONGGO_URL=mongodb+srv://username:password@cluster.mongodb.net/E-Learning
MONGODB_DB_NAME=E-Learning
OPENAI_API_KEY=your_groq_api_key_here
VECTORDB_PATH=./chroma_db
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

**Chạy AI Service với PM2:**
```bash
cd /opt/e-learning/AI
source venv/bin/activate
pm2 start uvicorn --name "ai-service" -- app:app --host 0.0.0.0 --port 8000
pm2 save
```

**Hoặc tạo script start:**
```bash
cd /opt/e-learning/AI
nano start.sh
```

Nội dung `start.sh`:
```bash
#!/bin/bash
cd /opt/e-learning/AI
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

```bash
chmod +x start.sh
pm2 start start.sh --name "ai-service"
pm2 save
```

## Bước 6: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/e-learning
```

**Nội dung:**
```nginx
server {
    listen 80;
    server_name _;

    # Timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Body size
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/e-learning-access.log;
    error_log /var/log/nginx/e-learning-error.log;

    # Backend API (NestJS) - port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Swagger API docs
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # AI Service (FastAPI) - port 8000
    location /ai/ {
        rewrite ^/ai/(.*) /$1 break;
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Face Recognition
    location /face-recognition/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }
}
```

**Enable và reload:**
```bash
sudo ln -s /etc/nginx/sites-available/e-learning /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Xóa default nếu có
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 7: Kiểm tra

```bash
# Kiểm tra PM2 processes
pm2 list
pm2 logs

# Test Backend
curl http://localhost:3000/
curl http://localhost/api

# Test AI Service
curl http://localhost:8000/
curl http://localhost/ai/

# Test qua Nginx
curl http://YOUR_EC2_IP/
curl http://YOUR_EC2_IP/api
curl http://YOUR_EC2_IP/ai/
```

## Quản lý Services

### PM2 Commands
```bash
# Xem danh sách
pm2 list

# Xem logs
pm2 logs backend
pm2 logs ai-service
pm2 logs  # Tất cả

# Restart
pm2 restart backend
pm2 restart ai-service
pm2 restart all

# Stop
pm2 stop backend
pm2 stop ai-service

# Delete
pm2 delete backend
pm2 delete ai-service

# Monitor
pm2 monit
```

### Update Code
```bash
cd /opt/e-learning

# Pull code mới
git pull

# Update Backend
cd backend
npm install
npm run build
pm2 restart backend

# Update AI Service
cd ../AI
source venv/bin/activate
pip install -r requirements.txt
pm2 restart ai-service
```

## Troubleshooting

### Backend không chạy
```bash
# Xem logs
pm2 logs backend

# Kiểm tra .env
cat backend/.env

# Test chạy thủ công
cd backend
npm run start:prod
```

### AI Service không chạy
```bash
# Xem logs
pm2 logs ai-service

# Kiểm tra .env
cat AI/.env

# Test chạy thủ công
cd AI
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Nginx 502 Bad Gateway
```bash
# Kiểm tra services có chạy không
pm2 list
curl http://localhost:3000/
curl http://localhost:8000/

# Kiểm tra nginx config
sudo nginx -t
sudo tail -f /var/log/nginx/e-learning-error.log
```

### Port đã được sử dụng
```bash
# Kiểm tra port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill process
sudo kill -9 PID
```

## Cấu trúc Routing

- `http://YOUR_EC2_IP/` → Backend (NestJS) - port 3000
- `http://YOUR_EC2_IP/api` → Swagger docs - port 3000
- `http://YOUR_EC2_IP/socket.io/` → WebSocket - port 3000
- `http://YOUR_EC2_IP/ai/` → AI Service (FastAPI) - port 8000
- `http://YOUR_EC2_IP/face-recognition/` → Face Recognition - port 8000

## Lưu ý

1. **PM2 auto-start:** Đã chạy `pm2 save` và `pm2 startup` để tự động start khi reboot
2. **Virtual environment:** AI service cần activate venv trước khi chạy
3. **Disk space:** Đảm bảo có đủ 20GB+ cho ML models
4. **RAM:** Tối thiểu 4GB RAM cho cả 2 services

