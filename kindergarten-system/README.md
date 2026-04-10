# 🎓 Atelier Management System — Kindergarten Quality & Health Platform

**Tech Stack:** ReactJS + NestJS Microservices + MySQL

---

## 📁 Cấu Trúc Dự Án

```
huynhhoangthinh/
├── database-setup/          # Docker MySQL + init SQL
├── backend-workspace/       # NestJS Monorepo (4 services)
│   └── apps/
│       ├── api-gateway/     # Port 3000 — HTTP gateway + JWT + RBAC
│       ├── auth-service/    # Port 3001 — User authentication + bcrypt
│       ├── academic-service/ # Port 3002 — Classes, students, assessments
│       └── health-service/  # Port 3003 — Health records + BMI
└── frontend-web/            # ReactJS + Vite + TailwindCSS (Port 5173)
```

---

## 🚀 Hướng Dẫn Chạy

### Bước 1 — Khởi động Database (MySQL)
```bash
cd database-setup
docker-compose up -d

# Kiểm tra database chạy thành công
docker logs kindergarten_mysql
```

### Bước 2 — Cài đặt Backend Dependencies (lần đầu)
```bash
cd backend-workspace
npm install
```

### Bước 3 — Khởi động các Microservices (4 terminal riêng)
```bash
# Terminal 1: Auth Service
cd backend-workspace
npx nest start auth-service --watch

# Terminal 2: Academic Service
npx nest start academic-service --watch

# Terminal 3: Health Service
npx nest start health-service --watch

# Terminal 4: API Gateway
npx nest start api-gateway --watch
```

### Bước 4 — Khởi động Frontend
```bash
cd frontend-web
npm install    # (lần đầu)
npm run dev
```

Truy cập: **http://localhost:5173**

---

## 🔑 Tài Khoản Demo

| Role | Email | Mật khẩu |
|------|-------|----------|
| ADMIN | admin@school.com | password123 |
| TEACHER | teacher@school.com | password123 |
| PARENT | parent@school.com | password123 |

---

## 🔐 Phân Quyền (RBAC)

| Route | Role |
|-------|------|
| /admin/* | ADMIN |
| /teacher/* | TEACHER |
| /parent/* | PARENT |

---

## 🏗️ Kiến Trúc API (API Gateway - Port 3000)

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | /api/login | Public | Đăng nhập, trả JWT |
| GET | /api/admin/dashboard | ADMIN | Tổng quan hệ thống |
| GET | /api/academic/classes | ADMIN, TEACHER | Danh sách lớp học |
| POST | /api/health/vitals | TEACHER | Nhập chỉ số sức khoẻ |
| POST | /api/academic/assessments | TEACHER | Đánh giá kỹ năng học sinh |
| POST | /api/feedback | PARENT | Gửi đánh giá giáo viên |
| GET | /api/parent/student/:id/records | PARENT | Hồ sơ con (chỉ con mình) |

---

## ⚙️ Biến Môi Trường (backend-workspace/.env)

```env
JWT_SECRET=KMS_AtlierManagement_SuperSecretKey_2024!
JWT_EXPIRES_IN=8h
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=dev_kms_2024
DB_NAME=kindergarten_db
```
