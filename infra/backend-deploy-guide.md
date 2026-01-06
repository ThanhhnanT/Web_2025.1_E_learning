# Hướng dẫn Deploy Backend NestJS lên EC2 (không dùng Docker)

Hướng dẫn deploy backend NestJS trực tiếp trên EC2 mà không cần Docker.

## Yêu cầu

- EC2 instance đã setup (cùng instance với AI service hoặc instance riêng)
- Node.js và npm đã cài đặt
- Nginx đã cài đặt

## Bước 1: Cài đặt Node.js

```bash
# Cài đặt Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra version
node --version
npm --version
```

## Bước 2: Upload code Backend lên EC2

### Cách 1: Clone từ Git

```bash
cd /opt
sudo git clone YOUR_REPO_URL backend-service
sudo chown -R $USER:$USER backend-service
cd backend-service/backend
```

### Cách 2: Upload bằng SCP

Từ máy local:

```bash
scp -i your-key.pem -r backend ubuntu@YOUR_EC2_IP:/opt/backend-service/
```

Trên EC2:

```bash
cd /opt/backend-service/backend
```

## Bước 3: Cài đặt Dependencies

```bash
cd /opt/backend-service/backend

# Cài đặt dependencies
npm install

# Build project (cho production)
npm run build
```

## Bước 4: Cấu hình Environment Variables

```bash
# Tạo file .env
nano .env
```

Các biến môi trường cần thiết:

```env
# Server
PORT=3000
NODE_ENV=production

# MongoDB
MONGGO_URL=mongodb+srv://username:password@cluster.mongodb.net/E-Learning

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Email (Gmail)
MAILDEV_INCOMING_USER=your_email@gmail.com
MAILDEV_INCOMING_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
MAIL_SENDER_NAME=Learnify

# Cloudinary (nếu dùng)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (nếu dùng)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# VNPay/Momo (nếu dùng)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
```

## Bước 5: Cài đặt PM2 (Process Manager)

PM2 giúp quản lý Node.js process, tự động restart khi crash, và chạy background.

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Kiểm tra
pm2 --version
```

## Bước 6: Chạy Backend với PM2

### Development mode (với watch):

```bash
cd /opt/backend-service/backend

# Chạy với PM2
pm2 start npm --name "backend" -- run start:dev

# Hoặc production mode (sau khi build)
pm2 start npm --name "backend" -- run start:prod
```

### Hoặc tạo ecosystem file (khuyến nghị):

```bash
cd /opt/backend-service/backend
nano ecosystem.config.js
```

Nội dung:

```javascript
module.exports = {
  apps: [{
    name: 'backend',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/opt/backend-service/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Chạy với ecosystem file:

```bash
pm2 start ecosystem.config.js
```

### PM2 commands hữu ích:

```bash
# Xem danh sách processes
pm2 list

# Xem logs
pm2 logs backend

# Restart
pm2 restart backend

# Stop
pm2 stop backend

# Delete
pm2 delete backend

# Monitor
pm2 monit

# Save PM2 configuration (để auto-start khi reboot)
pm2 save
pm2 startup
```

## Bước 7: Cấu hình Nginx Reverse Proxy

```bash
# Tạo nginx config
sudo nano /etc/nginx/sites-available/backend-service
```

Nội dung:

```nginx
server {
    listen 80;
    server_name _;  # Hoặc domain name của bạn

    # Increase timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/backend-access.log;
    error_log /var/log/nginx/backend-error.log;

    # Backend API
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

    # WebSocket support (cho Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Swagger API docs
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/backend-service /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Bước 8: Cấu hình Firewall

```bash
# Mở port 3000 (nếu cần truy cập trực tiếp, không qua nginx)
sudo ufw allow 3000/tcp

# Hoặc chỉ mở port 80 (qua nginx)
sudo ufw allow 80/tcp
```

## Bước 9: Kiểm tra

```bash
# Kiểm tra PM2 process
pm2 list
pm2 logs backend

# Test API trực tiếp
curl http://localhost:3000/

# Test qua Nginx
curl http://YOUR_EC2_IP/

# Test Swagger
curl http://YOUR_EC2_IP/api
```

## Quản lý và Monitoring

### Xem logs

```bash
# PM2 logs
pm2 logs backend

# Nginx logs
sudo tail -f /var/log/nginx/backend-access.log
sudo tail -f /var/log/nginx/backend-error.log
```

### Restart services

```bash
# Restart backend
pm2 restart backend

# Restart nginx
sudo systemctl restart nginx
```

### Update code

```bash
cd /opt/backend-service
git pull

cd backend
npm install
npm run build
pm2 restart backend
```

## Troubleshooting

### Backend không start

```bash
# Kiểm tra logs
pm2 logs backend

# Kiểm tra .env file
cat .env

# Test chạy thủ công
npm run start:dev
```

### Port 3000 đã được sử dụng

```bash
# Kiểm tra process đang dùng port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Nginx 502 Bad Gateway

```bash
# Kiểm tra backend có chạy không
pm2 list
curl http://localhost:3000/

# Kiểm tra nginx config
sudo nginx -t
```

### Out of memory

```bash
# Kiểm tra RAM
free -h

# Xem PM2 memory usage
pm2 monit

# Restart với memory limit
pm2 restart backend --max-memory-restart 1G
```

## Production Best Practices

1. **Sử dụng production mode:**
   ```bash
   npm run build
   pm2 start npm --name "backend" -- run start:prod
   ```

2. **Setup log rotation:**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

3. **Monitor với PM2:**
   ```bash
   pm2 install pm2-server-monit
   ```

4. **Auto-start khi reboot:**
   ```bash
   pm2 save
   pm2 startup
   ```

5. **Cấu hình SSL/HTTPS** (khi có domain):
   - Sử dụng Let's Encrypt với Certbot
   - Cập nhật nginx config để dùng HTTPS

## Cấu hình Domain (Tùy chọn)

Nếu có domain:

1. **Cấu hình DNS:**
   - Tạo A record: `api.yourdomain.com` → `YOUR_EC2_IP`

2. **Cập nhật Nginx config:**
   ```nginx
   server_name api.yourdomain.com;
   ```

3. **Setup SSL:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

## So sánh với Docker

**Ưu điểm không dùng Docker:**
- Đơn giản hơn, không cần build image
- Dễ debug và development
- Ít tốn disk space hơn
- Restart nhanh hơn

**Nhược điểm:**
- Phải quản lý Node.js version và dependencies
- Khó scale horizontal
- Phụ thuộc vào môi trường hệ thống

