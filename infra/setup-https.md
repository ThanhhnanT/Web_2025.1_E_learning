# Hướng dẫn Setup HTTPS cho Backend và AI Service

Hướng dẫn cấu hình HTTPS (SSL/TLS) sử dụng Let's Encrypt (miễn phí).

## Yêu cầu

- Domain name đã trỏ về EC2 IP (A record)
- EC2 instance đã cài Nginx
- Port 80 và 443 đã mở trong Security Group

## Bước 1: Cấu hình DNS

1. Vào DNS provider (Cloudflare, Namecheap, GoDaddy, etc.)
2. Tạo A record:
   - Name: `@` (hoặc `www` cho www.yourdomain.com)
   - Type: A
   - Value: `3.1.6.249` (EC2 Public IP)
   - TTL: 3600

3. Đợi DNS propagate (5-30 phút)
4. Kiểm tra:
   ```bash
   nslookup yourdomain.com
   ping yourdomain.com
   ```

## Bước 2: Cài đặt Certbot

```bash
# Cài Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Kiểm tra
certbot --version
```

## Bước 3: Cấu hình Nginx (tạm thời cho HTTP)

```bash
# Backup config hiện tại
sudo cp /etc/nginx/sites-available/e-learning /etc/nginx/sites-available/e-learning.backup

# Chỉnh sửa config để thêm server_name
sudo nano /etc/nginx/sites-available/e-learning
```

Thêm `server_name` vào:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Thêm dòng này
    
    # ... phần còn lại giữ nguyên
}
```

```bash
# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 4: Tạo SSL Certificate với Certbot

```bash
# Chạy Certbot (tự động cấu hình Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Hoặc chỉ domain chính
sudo certbot --nginx -d yourdomain.com
```

Certbot sẽ:
- Tạo SSL certificate
- Tự động cấu hình Nginx
- Setup auto-renewal

**Lưu ý:** Nhập email để nhận thông báo renewal.

## Bước 5: Kiểm tra

```bash
# Test HTTPS
curl https://yourdomain.com/
curl https://yourdomain.com/api

# Kiểm tra certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Bước 6: Auto-renewal (tự động gia hạn)

Certbot đã setup auto-renewal, nhưng có thể test:

```bash
# Test renewal
sudo certbot renew --dry-run

# Kiểm tra timer
sudo systemctl status certbot.timer
```

## Cấu hình thủ công (nếu Certbot không tự động)

Nếu Certbot không tự động cấu hình, copy config mẫu:

```bash
# Copy config HTTPS
sudo cp /opt/ai-service/infra/nginx/e-learning-https.conf /etc/nginx/sites-available/e-learning-https

# Chỉnh sửa domain name
sudo nano /etc/nginx/sites-available/e-learning-https
# Thay yourdomain.com bằng domain thực tế

# Enable
sudo ln -s /etc/nginx/sites-available/e-learning-https /etc/nginx/sites-enabled/

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

## Cập nhật Backend .env

Sau khi có HTTPS, cập nhật backend nếu cần:

```bash
cd /opt/ai-service/backend
nano .env
```

Thêm (nếu cần):
```env
# Frontend URL (nếu cần CORS)
FRONTEND_URL=https://yourdomain.com

# AI Service URL (vẫn dùng localhost vì cùng server)
AI_SERVICE_URL=http://localhost:8000
```

## Cập nhật Frontend API URL

Nếu frontend cũng deploy, cập nhật API URL:

```typescript
// frontend/lib/api.ts hoặc helper/api.tsx
const API_URL = 'https://yourdomain.com';
```

## Troubleshooting

### Certificate không tạo được

```bash
# Kiểm tra DNS
nslookup yourdomain.com

# Kiểm tra port 80 có mở không
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Lỗi "Failed to obtain certificate"

- Đảm bảo domain đã trỏ đúng IP
- Đảm bảo port 80 đã mở
- Đợi DNS propagate (có thể mất vài phút)

### Renewal không hoạt động

```bash
# Check logs
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

## Security Group trên AWS

Đảm bảo mở:
- Port 80 (HTTP) - cho Let's Encrypt verification
- Port 443 (HTTPS) - cho HTTPS traffic

## Lưu ý

- Let's Encrypt certificate có hiệu lực 90 ngày
- Certbot tự động renew mỗi 60 ngày
- Nếu không có domain, có thể dùng self-signed certificate (chỉ cho dev/test)

## Self-signed Certificate (cho dev/test, không cần domain)

```bash
# Tạo self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt

# Tạo thư mục
sudo mkdir -p /etc/nginx/ssl

# Cấu hình Nginx dùng self-signed cert
# (sửa path trong nginx config)
```

**Lưu ý:** Self-signed certificate sẽ hiện cảnh báo trên browser, chỉ dùng cho dev/test.

