# Infrastructure Configuration cho AI Service

Thư mục này chứa các file cấu hình để deploy AI Service lên AWS EC2 với Docker và Nginx.

## Cấu trúc thư mục

```
infra/
├── docker-compose.yml      # Docker Compose configuration
├── env.example             # Template cho environment variables
├── setup-ec2.sh           # Script tự động setup EC2
├── deploy-guide.md        # Hướng dẫn deploy chi tiết
├── nginx/
│   └── ai-service.conf    # Nginx reverse proxy configuration
└── README.md              # File này
```

## Quick Start

1. **Đọc hướng dẫn chi tiết:** Xem [deploy-guide.md](./deploy-guide.md)

2. **Setup EC2:**
   ```bash
   # Upload script lên EC2
   scp -i your-key.pem setup-ec2.sh ubuntu@YOUR_EC2_IP:~/
   
   # SSH vào EC2 và chạy
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

3. **Deploy application:**
   ```bash
   # Upload code lên EC2
   scp -i your-key.pem -r ../AI infra ubuntu@YOUR_EC2_IP:/opt/ai-service/
   
   # SSH vào EC2
   cd /opt/ai-service/infra
   cp env.example .env
   nano .env  # Chỉnh sửa các giá trị cần thiết
   
   # Chạy Docker Compose
   docker-compose up -d --build
   
   # Cấu hình Nginx
   sudo cp nginx/ai-service.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/ai-service.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Files mô tả

### docker-compose.yml
Cấu hình Docker Compose để chạy AI service với:
- Build từ Dockerfile trong thư mục `../AI`
- Mount volumes cho chroma_db và data để persist
- Mount .env file cho environment variables
- Health check tự động
- Auto-restart policy

### nginx/ai-service.conf
Cấu hình Nginx reverse proxy:
- Listen trên port 80 (HTTP)
- Proxy requests đến Docker container (port 8000)
- Timeout settings phù hợp cho AI processing
- Logging configuration

### env.example
Template cho file `.env` với các biến môi trường cần thiết:
- MongoDB connection string
- API keys (Groq, Google, etc.)
- Vector database path
- Embedding model configuration

### setup-ec2.sh
Script tự động cài đặt:
- Docker và Docker Compose
- Nginx
- Firewall configuration
- Tạo thư mục cần thiết

### deploy-guide.md
Hướng dẫn chi tiết từng bước:
- Tạo EC2 instance
- Setup môi trường
- Deploy application
- Cấu hình Nginx
- Troubleshooting

## Lưu ý quan trọng

1. **File .env:** Không commit file `.env` lên Git! Chỉ commit `env.example`
2. **ChromaDB data:** Đảm bảo copy `chroma_db` vào `infra/data/chroma_db` trước khi chạy
3. **Disk space:** Cần ít nhất 20GB cho ML models và dependencies
4. **RAM:** Khuyến nghị t3.medium (4GB RAM) trở lên
5. **Build time:** Lần đầu build có thể mất 15-30 phút

## Kiểm tra sau khi deploy

```bash
# Kiểm tra container
docker-compose ps
docker-compose logs -f

# Test API
curl http://localhost:8000/
curl http://YOUR_EC2_IP/

# Kiểm tra Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/ai-service-access.log
```

## Troubleshooting

Xem phần Troubleshooting trong [deploy-guide.md](./deploy-guide.md) để biết cách xử lý các lỗi thường gặp.

