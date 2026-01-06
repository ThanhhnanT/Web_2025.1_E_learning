# Setup HTTPS với Self-Signed Certificate (Không cần domain)

Hướng dẫn tạo self-signed certificate để có HTTPS mà không cần domain.

## Bước 1: Tạo Self-Signed Certificate

```bash
# Tạo thư mục cho certificates
sudo mkdir -p /etc/nginx/ssl

# Tạo certificate (valid 365 ngày)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt

# Khi được hỏi, nhập thông tin:
# Country Name: VN (hoặc để trống)
# State: (để trống)
# City: (để trống)
# Organization: (để trống)
# Common Name: 3.1.6.249 (hoặc IP của bạn)
# Email: (để trống)
```

## Bước 2: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/e-learning
```

Thay thế toàn bộ bằng:

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name _;

    # Self-signed certificates
    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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
        proxy_set_header X-Forwarded-Proto $scheme;
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
        proxy_set_header X-Forwarded-Proto $scheme;
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
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

## Bước 3: Test và Reload

```bash
# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Mở port 443 trong firewall
sudo ufw allow 443/tcp
```

## Bước 4: Test HTTPS

```bash
# Test từ server
curl -k https://localhost/

# Test từ máy local (sẽ có cảnh báo)
curl -k https://3.1.6.249/
```

## Lưu ý

⚠️ **Self-signed certificate sẽ hiện cảnh báo trên browser:**
- Chrome/Firefox sẽ báo "Not Secure" hoặc "Your connection is not private"
- Cần click "Advanced" → "Proceed to site" để tiếp tục
- Không phù hợp cho production/public

✅ **Phù hợp cho:**
- Development/Testing
- Internal network
- API testing với curl/Postman

## Mở port 443 trong AWS Security Group

1. AWS Console → EC2 → Security Groups
2. Chọn Security Group của instance
3. Inbound rules → Add rule:
   - Type: HTTPS
   - Port: 443
   - Source: 0.0.0.0/0 (hoặc IP cụ thể)

## Nếu muốn HTTPS thực sự (production)

Cần mua domain (rẻ nhất ~$10-15/năm) hoặc dùng free domain từ:
- Freenom (.tk, .ml, .ga, .cf)
- Cloudflare (có thể dùng domain miễn phí)

Sau đó setup Let's Encrypt như hướng dẫn trong `setup-https.md`.

