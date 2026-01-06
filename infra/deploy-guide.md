# Hướng dẫn Deploy AI Service lên AWS EC2

Hướng dẫn chi tiết từng bước để deploy phần AI lên AWS EC2 với Docker và Nginx.

## Yêu cầu

- Tài khoản AWS
- SSH client (trên Windows: PuTTY hoặc WSL, trên Mac/Linux: Terminal)
- Domain name (tùy chọn, có thể dùng IP)

## Bước 1: Tạo EC2 Instance

### 1.1. Đăng nhập AWS Console

1. Đăng nhập vào [AWS Console](https://console.aws.amazon.com)
2. Chọn region gần bạn nhất (ví dụ: `ap-southeast-1` cho Singapore)

### 1.2. Tạo EC2 Instance

1. Vào **EC2 Dashboard** → Click **Launch Instance**
2. Cấu hình như sau:

   **Name và tags:**
   - Name: `ai-service` (hoặc tên bạn muốn)

   **Application and OS Images:**
   - Amazon Machine Image (AMI): **Ubuntu Server 22.04 LTS** (Free tier eligible)

   **Instance type:**
   - Chọn **t3.medium** hoặc **t3.large** (đủ RAM cho ML models)
   - ⚠️ **Lưu ý:** t3.micro/t3.small có thể không đủ RAM cho ML models

   **Key pair:**
   - Nếu chưa có: Click **Create new key pair**
     - Name: `ai-service-key`
     - Key pair type: RSA
     - Private key file format: `.pem` (cho Linux/Mac) hoặc `.ppk` (cho Windows PuTTY)
   - Download key file và lưu an toàn (không share công khai!)

   **Network settings:**
   - VPC: Default VPC (hoặc chọn VPC của bạn)
   - Subnet: Chọn subnet bất kỳ
   - Auto-assign Public IP: **Enable**
   - Firewall (security groups): **Create security group**
     - Security group name: `ai-service-sg`
     - Description: `Security group for AI service`
     - Inbound rules:
       - SSH (22): My IP (hoặc Anywhere-IPv4 nếu cần)
       - HTTP (80): Anywhere-IPv4
       - HTTPS (443): Anywhere-IPv4 (tùy chọn, nếu có SSL sau)

   **Configure storage:**
   - Volume 1: **20 GiB** (gp3)
   - Delete on termination: Uncheck (nếu muốn giữ data khi terminate instance)

3. Click **Launch Instance**

### 1.3. Lấy thông tin kết nối

1. Đợi instance chạy (Status check: 2/2 checks passed)
2. Copy **Public IPv4 address** (ví dụ: `54.123.45.67`)
3. Lưu lại để SSH và truy cập sau

## Bước 2: Kết nối SSH vào EC2

### Trên Linux/Mac:

```bash
# Di chuyển đến thư mục chứa key file
cd ~/Downloads  # hoặc thư mục bạn lưu key

# Set quyền cho key file (quan trọng!)
chmod 400 ai-service-key.pem

# SSH vào EC2
ssh -i ai-service-key.pem ubuntu@YOUR_PUBLIC_IP
# Thay YOUR_PUBLIC_IP bằng Public IPv4 address của bạn
```

### Trên Windows (PowerShell hoặc WSL):

```bash
# Trong PowerShell hoặc WSL
ssh -i "C:\path\to\ai-service-key.pem" ubuntu@YOUR_PUBLIC_IP
```

### Trên Windows (PuTTY):

1. Mở PuTTYgen, load file `.pem` và convert sang `.ppk`
2. Mở PuTTY, nhập:
   - Host: `ubuntu@YOUR_PUBLIC_IP`
   - Connection → SSH → Auth → Credentials: chọn file `.ppk`

## Bước 3: Setup môi trường trên EC2

### 3.1. Chạy script setup tự động

```bash
# Tạo thư mục và download script
mkdir -p ~/setup
cd ~/setup

# Download script (hoặc copy từ máy local)
# Nếu có Git:
git clone YOUR_REPO_URL
cd E-learning/infra

# Hoặc upload file setup-ec2.sh lên EC2 bằng scp:
# Từ máy local:
# scp -i ai-service-key.pem infra/setup-ec2.sh ubuntu@YOUR_PUBLIC_IP:~/setup-ec2.sh

# Chạy script
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### 3.2. Hoặc setup thủ công

Nếu không dùng script, chạy các lệnh sau:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

# Logout và login lại để áp dụng Docker group
exit
# SSH lại vào
```

## Bước 4: Upload code lên EC2

### Cách 1: Clone từ Git (khuyến nghị)

```bash
# Trên EC2
cd /opt
sudo git clone YOUR_REPO_URL ai-service
sudo chown -R $USER:$USER ai-service
cd ai-service
```

### Cách 2: Upload bằng SCP

Từ máy local:

```bash
# Upload toàn bộ thư mục AI và infra
scp -i ai-service-key.pem -r AI infra ubuntu@YOUR_PUBLIC_IP:/opt/ai-service/

# Hoặc upload từ thư mục gốc của project
cd /path/to/E-learning
scp -i ai-service-key.pem -r AI infra ubuntu@YOUR_PUBLIC_IP:/opt/ai-service/
```

### Cách 3: Sử dụng rsync (hiệu quả hơn)

```bash
rsync -avz -e "ssh -i ai-service-key.pem" \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  AI/ infra/ ubuntu@YOUR_PUBLIC_IP:/opt/ai-service/
```

## Bước 5: Cấu hình Environment Variables

```bash
# Trên EC2
cd /opt/ai-service/infra

# Copy template và chỉnh sửa
cp env.example .env
nano .env  # hoặc vi .env
```

Chỉnh sửa các giá trị trong `.env`:

```env
# Bắt buộc
MONGGO_URL=mongodb+srv://username:password@cluster.mongodb.net/E-Learning
OPENAI_API_KEY=your_groq_api_key_here
VECTORDB_PATH=./chroma_db
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# Tùy chọn
MONGODB_DB_NAME=E-Learning
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

Lưu file: `Ctrl+X`, `Y`, `Enter`

## Bước 6: Copy ChromaDB và Data (nếu có)

Nếu bạn đã có sẵn `chroma_db` và `data` trên máy local:

```bash
# Từ máy local - tạo thư mục trước
ssh -i ai-service-key.pem ubuntu@YOUR_PUBLIC_IP "mkdir -p /opt/ai-service/infra/data/chroma_db /opt/ai-service/infra/data/app_data"

# Copy chroma_db
scp -i ai-service-key.pem -r AI/chroma_db/* ubuntu@YOUR_PUBLIC_IP:/opt/ai-service/infra/data/chroma_db/

# Copy data directory
scp -i ai-service-key.pem -r AI/data/* ubuntu@YOUR_PUBLIC_IP:/opt/ai-service/infra/data/app_data/
```

Hoặc trên EC2, tạo thư mục trống (sẽ được tạo tự động khi chạy):

```bash
mkdir -p /opt/ai-service/infra/data/chroma_db
mkdir -p /opt/ai-service/infra/data/app_data
```

## Bước 7: Deploy với Docker Compose

```bash
cd /opt/ai-service/infra

# Build và chạy container
docker-compose up -d --build

# Xem logs để kiểm tra
docker-compose logs -f

# Kiểm tra container đang chạy
docker-compose ps
```

**Lưu ý:** Lần đầu build có thể mất 15-30 phút do download ML dependencies lớn.

## Bước 8: Cấu hình Nginx

```bash
# Copy nginx config
sudo cp /opt/ai-service/infra/nginx/ai-service.conf /etc/nginx/sites-available/ai-service.conf

# Tạo symbolic link để enable site
sudo ln -s /etc/nginx/sites-available/ai-service.conf /etc/nginx/sites-enabled/

# Xóa default site (tùy chọn)
sudo rm /etc/nginx/sites-enabled/default

# Test cấu hình nginx
sudo nginx -t

# Nếu OK, reload nginx
sudo systemctl reload nginx
```

## Bước 9: Kiểm tra và Test

### 9.1. Kiểm tra Docker container

```bash
# Xem logs
docker-compose logs ai-service

# Kiểm tra container đang chạy
docker ps

# Test API trực tiếp từ container
curl http://localhost:8000/
```

### 9.2. Kiểm tra Nginx

```bash
# Test nginx config
sudo nginx -t

# Xem nginx logs
sudo tail -f /var/log/nginx/ai-service-access.log
sudo tail -f /var/log/nginx/ai-service-error.log

# Test từ bên ngoài (từ máy local)
curl http://YOUR_PUBLIC_IP/
```

### 9.3. Test API endpoints

Từ máy local hoặc browser:

```bash
# Health check
curl http://YOUR_PUBLIC_IP/

# Test generate schedule (nếu có)
curl -X POST http://YOUR_PUBLIC_IP/generate_schedule \
  -H "Content-Type: application/json" \
  -d '{"your": "data"}'
```

## Bước 10: Cấu hình Domain (Tùy chọn)

Nếu bạn có domain name:

1. **Cấu hình DNS:**
   - Vào DNS provider (Cloudflare, Namecheap, etc.)
   - Tạo A record:
     - Name: `@` hoặc `ai` (cho ai.yourdomain.com)
     - Type: A
     - Value: `YOUR_PUBLIC_IP`
     - TTL: 3600

2. **Cập nhật Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/ai-service.conf
```

Thay đổi:
```nginx
server_name _;  # Thành
server_name ai.yourdomain.com;  # hoặc yourdomain.com
```

Reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

3. **Test domain:**
```bash
curl http://ai.yourdomain.com/
```

## Quản lý và Monitoring

### Xem logs

```bash
# Docker logs
docker-compose logs -f ai-service

# Nginx logs
sudo tail -f /var/log/nginx/ai-service-access.log
sudo tail -f /var/log/nginx/ai-service-error.log
```

### Restart services

```bash
# Restart Docker container
cd /opt/ai-service/infra
docker-compose restart

# Restart Nginx
sudo systemctl restart nginx
```

### Update code

```bash
cd /opt/ai-service
git pull  # hoặc upload code mới

cd infra
docker-compose up -d --build
```

### Kiểm tra disk space

```bash
df -h
du -sh /opt/ai-service/infra/data/*
```

## Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker-compose logs ai-service

# Kiểm tra .env file
cat infra/.env

# Test build lại
docker-compose build --no-cache
```

### Nginx 502 Bad Gateway

```bash
# Kiểm tra container có chạy không
docker ps

# Kiểm tra port 8000
curl http://localhost:8000/

# Kiểm tra nginx config
sudo nginx -t
```

### Out of memory

```bash
# Kiểm tra RAM
free -h

# Xem container resource usage
docker stats
```

Nếu thiếu RAM, upgrade instance type lên t3.large hoặc t3.xlarge.

### Port đã được sử dụng

```bash
# Kiểm tra port 8000
sudo netstat -tulpn | grep 8000

# Kill process nếu cần
sudo kill -9 PID
```

## Bảo mật

1. **Chỉ mở port cần thiết** trong Security Group
2. **Không commit .env file** lên Git
3. **Sử dụng SSH key** thay vì password
4. **Cập nhật hệ thống định kỳ:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```
5. **Setup SSL/HTTPS** sau khi có domain (Let's Encrypt)

## Chi phí ước tính

- EC2 t3.medium: ~$0.0416/giờ (~$30/tháng)
- EC2 t3.large: ~$0.0832/giờ (~$60/tháng)
- EBS 20GB: ~$2/tháng
- Data transfer: ~$0.09/GB (outbound)

**Tổng:** ~$32-62/tháng tùy instance type

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs` và `sudo tail -f /var/log/nginx/ai-service-error.log`
2. Security Group: đảm bảo port 80 và 22 đã mở
3. Firewall: `sudo ufw status`
4. Container status: `docker ps -a`

