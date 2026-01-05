# Learnify - Nền tảng E-Learning

<div align="center">

![Learnify Logo](frontend/public/logo.png)

**Nền tảng học tập trực tuyến hiện đại với AI hỗ trợ**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-ea2845)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-green)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.x-blue)](https://www.python.org/)

</div>

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy dự án](#-chạy-dự-án)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

## 🎯 Giới thiệu

**Learnify** là một nền tảng học tập trực tuyến toàn diện được thiết kế để hỗ trợ người học trong việc luyện thi các chứng chỉ quốc tế như IELTS, TOEIC, HSK. Nền tảng tích hợp công nghệ AI để tạo lộ trình học tập cá nhân hóa, hệ thống flashcard với spaced repetition, và các tính năng xã hội để tăng cường trải nghiệm học tập.

### Đặc điểm nổi bật

- 🎓 **Quản lý khóa học**: Hệ thống quản lý khóa học với modules và lessons chi tiết
- 🤖 **AI-Powered**: Tạo lộ trình học tập tự động dựa trên mục tiêu và trình độ của người học
- 💳 **Thanh toán đa nền tảng**: Hỗ trợ Stripe, VNPay, và Momo
- 📚 **Flashcard System**: Hệ thống flashcard thông minh với thuật toán spaced repetition
- 📊 **Thống kê chi tiết**: Theo dõi tiến độ học tập theo ngày và theo từng dạng câu hỏi
- 💬 **Tính năng xã hội**: Posts, comments, likes, và chat real-time
- 🧪 **Làm bài thi**: Hệ thống làm bài thi với chấm điểm tự động
- 👥 **Quản lý bạn bè**: Kết bạn và theo dõi tiến độ của bạn bè

## ✨ Tính năng

### Cho người học
- ✅ Đăng ký và đăng nhập tài khoản
- ✅ Duyệt và tìm kiếm khóa học
- ✅ Xem chi tiết khóa học, modules, và lessons
- ✅ Thanh toán và đăng ký khóa học
- ✅ Học trực tuyến với video player
- ✅ Làm bài thi và xem kết quả
- ✅ Học từ vựng với flashcard
- ✅ Theo dõi tiến độ học tập
- ✅ Tạo và tương tác với posts
- ✅ Chat real-time với bạn bè
- ✅ Quản lý danh sách bạn bè

### Cho quản trị viên
- ✅ Quản lý người dùng
- ✅ Quản lý khóa học, modules, và lessons
- ✅ Quản lý bài thi và câu hỏi
- ✅ Xem thống kê tổng quan
- ✅ Quản lý thanh toán và enrollments
- ✅ Tạo khóa học với AI hỗ trợ

## 🛠 Công nghệ sử dụng

### Frontend
- **Framework**: Next.js 15.5.5 (App Router)
- **UI Library**: Ant Design 5.27.5
- **Styling**: Tailwind CSS 4.1.17
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Video Player**: Plyr
- **Charts**: Ant Design Charts

### Backend
- **Framework**: NestJS 11.0.1
- **Database**: MongoDB với Mongoose
- **Authentication**: Passport.js (JWT, Local)
- **File Upload**: Cloudinary, Multer
- **Payment**: Stripe, VNPay, Momo
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **API Documentation**: Swagger

### AI Service
- **Framework**: FastAPI
- **AI/ML**: LangChain, Groq
- **Vector Database**: ChromaDB
- **Embeddings**: Sentence Transformers
- **Document Processing**: PyPDF2, BeautifulSoup4

### Tools & Utilities
- **Language**: TypeScript, Python
- **Package Manager**: npm, pip
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier

## 📁 Cấu trúc dự án

```
E-learning/
├── frontend/                 # Next.js Frontend Application
│   ├── app/                 # App Router pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── auth/           # Authentication pages
│   │   ├── courses/        # Course pages
│   │   ├── flashcards/     # Flashcard pages
│   │   ├── my-courses/     # User's enrolled courses
│   │   ├── posts/          # Social posts
│   │   ├── chats/          # Chat pages
│   │   ├── statistics/     # Statistics pages
│   │   └── tests/          # Test pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and helpers
│   ├── service/            # API service layer
│   ├── styles/             # CSS modules
│   └── public/             # Static assets
│
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── users/     # User management
│   │   │   ├── courses/   # Course management
│   │   │   ├── enrollments/ # Enrollment management
│   │   │   ├── payments/   # Payment processing
│   │   │   ├── flashcards/ # Flashcard system
│   │   │   ├── posts/     # Social posts
│   │   │   ├── chats/     # Chat system
│   │   │   ├── tests/     # Test management
│   │   │   ├── results/   # Test results
│   │   │   └── statistics/ # Statistics
│   │   ├── auth/           # Auth guards & strategies
│   │   ├── mail/           # Email templates
│   │   └── utils/          # Utilities
│   └── dist/               # Compiled JavaScript
│
├── AI/                      # AI Service (FastAPI)
│   ├── src/
│   │   ├── features/       # AI features
│   │   ├── database/       # Database utilities
│   │   ├── utils/          # AI utilities
│   │   └── config/         # Configuration
│   ├── data/               # Training data
│   └── chroma_db/          # Vector database
│
├── Crawl_Ielts_Test/        # Web Scraper (Scrapy)
│   ├── Crawl_Ielts_Test/
│   │   └── spiders/        # Scrapy spiders
│   └── export/             # Exported data
│
└── README.md               # This file
```

## 💻 Yêu cầu hệ thống

### Frontend & Backend
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **MongoDB**: >= 6.0

### AI Service
- **Python**: >= 3.9
- **pip**: >= 23.x

### Khuyến nghị
- **RAM**: >= 8GB
- **Disk Space**: >= 10GB
- **OS**: Linux, macOS, hoặc Windows

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd E-learning
```

### 2. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 3. Cài đặt Backend

```bash
cd backend
npm install
```

### 4. Cài đặt AI Service

```bash
cd AI
pip install -r requirements.txt
```

### 5. Cài đặt MongoDB

Đảm bảo MongoDB đã được cài đặt và đang chạy. Bạn có thể sử dụng MongoDB Atlas hoặc MongoDB local.

## ⚙️ Cấu hình

### Backend Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/elearning

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=8000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# VNPay
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/result

# Momo
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn
MOMO_RETURN_URL=http://localhost:3000/payment/result
```

### Frontend Environment Variables

Tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### AI Service Environment Variables

Tạo file `.env` trong thư mục `AI/`:

```env
# Groq API
GROQ_API_KEY=your-groq-api-key

# Vector Database
VECTORDB_PATH=./chroma_db

# Server
PORT=8000
```

## 🚀 Chạy dự án

### Development Mode

#### 1. Chạy MongoDB
```bash
# Nếu dùng MongoDB local
mongod
```

#### 2. Chạy Backend
```bash
cd backend
npm run start:dev
```
Backend sẽ chạy tại: `http://localhost:8000`

#### 3. Chạy Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000`

#### 4. Chạy AI Service (Optional)
```bash
cd AI
python app.py
# hoặc với Docker
docker build -t ai-schedule .
docker run -d -p 8000:8000 --name ai-schedule-container ai-schedule
```
AI Service sẽ chạy tại: `http://localhost:8000` (nếu backend chạy port khác)

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
npm start
```

#### Build Backend
```bash
cd backend
npm run build
npm run start:prod
```

## 📚 API Documentation

Sau khi chạy backend, truy cập Swagger UI tại:
```
http://localhost:8000/api
```

### Các module chính:

- **Auth**: `/auth/*` - Đăng ký, đăng nhập, xác thực
- **Users**: `/users/*` - Quản lý người dùng
- **Courses**: `/courses/*` - Quản lý khóa học
- **Enrollments**: `/enrollments/*` - Quản lý đăng ký khóa học
- **Payments**: `/payments/*` - Xử lý thanh toán
- **Flashcards**: `/flashcards/*` - Hệ thống flashcard
- **Posts**: `/posts/*` - Quản lý posts
- **Chats**: `/chats/*` - Hệ thống chat
- **Tests**: `/tests/*` - Quản lý bài thi
- **Statistics**: `/statistics/*` - Thống kê

Xem thêm chi tiết trong file `PAYMENT_SYSTEM_GUIDE.md` để biết cách tích hợp hệ thống thanh toán.

## 🌐 Deployment

### Frontend (Vercel)

1. Kết nối repository với Vercel
2. Cấu hình environment variables
3. Deploy tự động khi push code

### Backend (Docker)

```bash
cd backend
docker build -t elearning-backend .
docker run -d -p 8000:8000 --env-file .env elearning-backend
```

### MongoDB (MongoDB Atlas)

1. Tạo cluster trên MongoDB Atlas
2. Lấy connection string
3. Cập nhật `MONGODB_URI` trong `.env`

### AI Service (Docker)

```bash
cd AI
docker build -t ai-schedule .
docker run -d -p 8000:8000 --env-file .env ai-schedule
```

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Code Style

- Sử dụng ESLint và Prettier
- Tuân thủ TypeScript best practices
- Viết comments cho code phức tạp
- Viết tests cho các tính năng mới

## 📝 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

## 📞 Liên hệ

Nếu có bất kỳ câu hỏi nào, vui lòng tạo issue trong repository.

---

<div align="center">

**Made with ❤️ by Learnify Team**

[Documentation](./docs) • [Issues](https://github.com/your-repo/issues) • [Changelog](./CHANGELOG.md)

</div>

