# Hướng dẫn cấu hình Email trên Render

## Vấn đề thường gặp

Khi deploy lên Render, email có thể không gửi được do:
1. **Thiếu biến môi trường**: Các biến môi trường email chưa được cấu hình
2. **Gmail App Password**: Gmail yêu cầu App Password thay vì password thông thường
3. **Firewall/Network**: Render có thể chặn kết nối SMTP
4. **Timeout**: Kết nối SMTP có thể bị timeout

## Các biến môi trường cần thiết

Trên Render Dashboard, vào **Environment** và thêm các biến sau:

### Bắt buộc:
```bash
MAILDEV_INCOMING_USER=your-email@gmail.com
MAILDEV_INCOMING_PASS=your-app-password
```

### Tùy chọn:
```bash
MAIL_SENDER_NAME=Learnify
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
FRONTEND_URL=https://your-frontend-domain.com
```

## Cách lấy Gmail App Password

1. Đăng nhập vào [Google Account](https://myaccount.google.com/)
2. Vào **Security** → **2-Step Verification** (bật nếu chưa có)
3. Vào **App passwords** (có thể cần tìm trong Security)
4. Chọn **Mail** và **Other (Custom name)**
5. Nhập tên: `Render Email Service`
6. Copy password 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
7. Dán vào biến môi trường `MAILDEV_INCOMING_PASS` (bỏ khoảng trắng)

## Kiểm tra cấu hình

Sau khi deploy, kiểm tra logs trên Render:

### Logs thành công:
```
📧 Email Configuration:
   - SMTP Host: smtp.gmail.com
   - SMTP Port: 465
   - User: ✅ Set
   - Password: ✅ Set
   - Sender Name: Learnify
```

### Logs lỗi:
```
⚠️  WARNING: Email credentials are missing. Email sending will fail!
   Please set MAILDEV_INCOMING_USER and MAILDEV_INCOMING_PASS environment variables.
```

### Khi gửi email thành công:
```
✅ Registration email sent successfully to: user@example.com
✅ Payment success email sent to: user@example.com
✅ Enrollment email sent to: user@example.com
```

### Khi gửi email thất bại:
```
❌ Failed to send registration email to user@example.com: [error details]
```

## Troubleshooting

### 1. Email không gửi được

**Kiểm tra:**
- ✅ Biến môi trường đã được set trên Render
- ✅ Đã dùng App Password (không phải password thông thường)
- ✅ Gmail 2-Step Verification đã bật
- ✅ Kiểm tra logs trên Render để xem lỗi cụ thể

**Lỗi thường gặp:**
- `Invalid login`: Dùng App Password thay vì password thông thường
- `Connection timeout`: Kiểm tra firewall/network trên Render
- `Authentication failed`: Kiểm tra lại App Password

### 2. Email gửi chậm

- Render có thể có network latency
- SMTP timeout đã được set 60 giây
- Nếu vẫn chậm, có thể dùng email service khác (SendGrid, Mailgun, etc.)

### 3. Thay đổi email service

Nếu muốn dùng email service khác (SendGrid, Mailgun, AWS SES), cập nhật trong `app.module.ts`:

```typescript
transport: {
  host: 'smtp.sendgrid.net', // hoặc host của service khác
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: configService.get<string>('SENDGRID_API_KEY'),
  },
}
```

## Cấu trúc email templates

Email templates nằm trong `src/mail/templates/`:
- `register.hbs` - Email đăng ký
- `payment-success.hbs` - Email thanh toán thành công
- `payment-failed.hbs` - Email thanh toán thất bại
- `enrollment-success.hbs` - Email đăng ký khóa học
- `course-completion.hbs` - Email hoàn thành khóa học

## Testing

Để test email trên local:
1. Set các biến môi trường trong `.env`
2. Chạy `npm run start:dev`
3. Kiểm tra logs để xem email có được gửi không
4. Kiểm tra inbox (và spam folder)

## Lưu ý

- ⚠️ **KHÔNG** commit file `.env` lên Git
- ⚠️ **KHÔNG** dùng password thông thường của Gmail
- ✅ Luôn dùng App Password cho production
- ✅ Kiểm tra logs thường xuyên để phát hiện lỗi sớm
- ✅ Email có thể vào spam folder, hãy kiểm tra

