# 🎓 Hướng Dẫn Chạy Dự Án - Kindergarten Management System

> **Tổng quan:** Hệ thống quản lý mầm non gồm Backend NestJS Microservices + Frontend ReactJS (Vite) + Database MySQL.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
D:\huynhhoangthinh\
├── backend-workspace\          ← Backend NestJS Monorepo (4 microservices)
│   ├── apps\
│   │   ├── auth-service\       ← Xử lý đăng nhập / JWT (Port 3001)
│   │   ├── academic-service\   ← Quản lý lớp, học sinh, giáo viên (Port 3002)
│   │   ├── health-service\     ← Quản lý y tế, thuốc, sức khoẻ (Port 3003)
│   │   └── api-gateway\        ← Cổng giao tiếp chính (Port 3000) ← FRONTEND GỌI VÀO ĐÂY
│   └── .env                    ← Cấu hình mật khẩu DB, cổng, JWT...
├── frontend-web\               ← Frontend ReactJS + Vite + TailwindCSS (Port 5173)
├── database-setup\
│   └── init.sql                ← Script tạo DB + seed dữ liệu mẫu
└── kindergarten-system\
    └── HUONG_DAN_CHAY_DU_AN.md ← File này
```

---

## ⚙️ YÊU CẦU PHẦN MỀM CÀI TRƯỚC

| Phần mềm       | Phiên bản | Kiểm tra bằng lệnh       |
|----------------|-----------|--------------------------|
| Node.js        | ≥ 18.x    | `node -v`                |
| npm            | ≥ 9.x     | `npm -v`                 |
| MySQL Server   | ≥ 8.0     | Kiểm tra XAMPP / MySQL   |
| MySQL Workbench| Mới nhất  | Giao diện quản lý DB     |

---

## 📋 PHẦN 1: CÀI ĐẶT DATABASE (CHỈ LÀM 1 LẦN ĐẦU)

### Bước 1.1 — Mở MySQL Workbench và kết nối

1. Mở **MySQL Workbench**.
2. Nhấn nút **`+`** cạnh chữ *MySQL Connections* để tạo kết nối mới.
3. Điền thông tin:
   - **Connection Name**: `Loom_And_Leaf` (hoặc tên bất kỳ)
   - **Hostname**: `127.0.0.1`
   - **Port**: `3306`
   - **Username**: `root`
4. Nhấn **Test Connection** → Nhập mật khẩu MySQL của máy bạn → **OK**.
5. Bấm vào kết nối vừa tạo để vào giao diện làm việc chính.

### Bước 1.2 — Kiểm tra mật khẩu trong file `.env`

Mở file: `D:\huynhhoangthinh\backend-workspace\.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456        ← ĐỔI THÀNH MẬT KHẨU MySQL THỰC TẾ CỦA MÁY BẠN
DB_NAME=kindergarten_db

AUTH_SERVICE_PORT=3001
ACADEMIC_SERVICE_PORT=3002
HEALTH_SERVICE_PORT=3003
API_GATEWAY_PORT=3000

JWT_SECRET=KMS_AtlierManagement_SuperSecretKey_2024!
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Quan trọng:** `DB_PASSWORD` phải khớp với mật khẩu MySQL thật của máy bạn, nếu không backend sẽ không kết nối được.

### Bước 1.3 — Chạy script tạo Database và dữ liệu mẫu

1. Trong MySQL Workbench, chọn **File → Open SQL Script...**
2. Mở file: `D:\huynhhoangthinh\database-setup\init.sql`
3. Nhấn biểu tượng **⚡ Tia Chớp** (Execute All) để chạy toàn bộ script.
4. Xem cửa sổ **Output** bên dưới:
   - ✅ Dấu tích xanh = thành công
   - ❌ Dấu X đỏ = có lỗi (thường do sai mật khẩu kết nối hoặc DB đã tồn tại)

> 💡 Script này sẽ tự động tạo database `kindergarten_db`, tất cả các bảng, và chèn dữ liệu mẫu (giáo viên, học sinh, lịch học, v.v.)

### Bước 1.4 — Tạo bảng `typeorm_metadata` (BẮT BUỘC)

Sau khi chạy `init.sql` xong, tiếp tục chạy thêm đoạn SQL sau ngay trên Workbench để tránh lỗi khi khởi động backend:

```sql
USE kindergarten_db;

CREATE TABLE IF NOT EXISTS `typeorm_metadata` (
  `type`     varchar(255) NOT NULL,
  `database` varchar(255) DEFAULT NULL,
  `schema`   varchar(255) DEFAULT NULL,
  `table`    varchar(255) DEFAULT NULL,
  `name`     varchar(255) DEFAULT NULL,
  `value`    text         DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> Bảng này được TypeORM yêu cầu để quản lý metadata schema. Nếu thiếu, backend sẽ báo lỗi `Table 'kindergarten_db.typeorm_metadata' doesn't exist`.

---

## 🚀 PHẦN 2: CÀI ĐẶT VÀ CHẠY BACKEND (MỖI NGÀY LẶP LẠI BƯỚC 2.2)

### Bước 2.1 — Cài đặt thư viện (CHỈ LÀM 1 LẦN ĐẦU)

Mở **Command Prompt / PowerShell / Terminal** và chạy:

```bash
cd D:\huynhhoangthinh\backend-workspace
npm install
```

Đợi đến khi hiện `added xxx packages` là xong.

### Bước 2.2 — Khởi động 4 Microservices (THỨCỰ BẮT BUỘC)

> Cần mở **4 tab terminal riêng biệt**, tất cả đều trỏ vào `D:\huynhhoangthinh\backend-workspace`

#### 🔐 Tab 1 — Auth Service (Đăng nhập & JWT)
```bash
cd D:\huynhhoangthinh\backend-workspace
npx nest start auth-service --watch
```
✅ Thành công khi thấy: `[Nest] LOG [NestApplication] Nest application successfully started`
> Cổng: `http://localhost:3001`

#### 📚 Tab 2 — Academic Service (Lớp, học sinh, giáo viên)
```bash
cd D:\huynhhoangthinh\backend-workspace
npx nest start academic-service --watch
```
✅ Thành công khi thấy: `Nest application successfully started`
> Cổng: `http://localhost:3002`

#### 🏥 Tab 3 — Health Service (Y tế, thuốc, sức khoẻ)
```bash
cd D:\huynhhoangthinh\backend-workspace
npx nest start health-service --watch
```
✅ Thành công khi thấy: `Nest application successfully started`
> Cổng: `http://localhost:3003`

#### 🌐 Tab 4 — API Gateway (⚠️ Chạy CUỐI CÙNG sau 3 service trên)
```bash
cd D:\huynhhoangthinh\backend-workspace
npx nest start api-gateway --watch
```
✅ Thành công khi thấy: `Nest application successfully started`
> **Cổng chính:** `http://localhost:3000` ← Frontend kết nối vào đây

---

## 💻 PHẦN 3: CÀI ĐẶT VÀ CHẠY FRONTEND (MỖI NGÀY LẶP LẠI BƯỚC 3.2)

### Bước 3.1 — Cài đặt thư viện (CHỈ LÀM 1 LẦN ĐẦU)

Mở một **tab terminal mới** (Tab 5):
```bash
cd D:\huynhhoangthinh\frontend-web
npm install
```

### Bước 3.2 — Khởi động Frontend

```bash
cd D:\huynhhoangthinh\frontend-web
npm run dev
```

Terminal sẽ hiện:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Nhấn giữ **Ctrl + Click** vào link `http://localhost:5173` để mở trên trình duyệt.

---

## 👥 PHẦN 4: TÀI KHOẢN ĐĂNG NHẬP MẪU

Giao diện sẽ hiện trang **Đăng Nhập**. Dùng một trong 3 tài khoản sau:

| Vai trò          | Email                   | Mật khẩu      | Quyền truy cập                              |
|------------------|-------------------------|---------------|---------------------------------------------|
| 🏫 **Hiệu Trưởng / Admin** | `admin@school.com`  | `password123` | Toàn bộ hệ thống, báo cáo, quản lý nhân sự |
| 👩‍🏫 **Giáo viên**          | `teacher@school.com` | `password123` | Lớp mình phụ trách, điểm danh, đánh giá   |
| 👨‍👩‍👧 **Phụ huynh**          | `parent@school.com`  | `password123` | Thông tin con, thông báo, hoá đơn học phí  |

> 💡 Bạn cũng có thể click thẳng vào nút **"TÀI KHOẢN DEMO"** bên dưới form đăng nhập để tự động điền.

---

## 🗂️ TỔNG HỢP CỔNG DỊCH VỤ

| Dịch vụ          | Địa chỉ                    | Mô tả                        |
|------------------|----------------------------|------------------------------|
| Frontend         | http://localhost:**5173**  | Giao diện web người dùng     |
| API Gateway      | http://localhost:**3000**  | Cổng API chính (Frontend gọi)|
| Auth Service     | http://localhost:**3001**  | Đăng nhập, JWT               |
| Academic Service | http://localhost:**3002**  | Học sinh, lớp, giáo viên     |
| Health Service   | http://localhost:**3003**  | Y tế, thuốc, sức khoẻ        |
| MySQL Database   | localhost:**3306**         | Cơ sở dữ liệu                |

---

## ⚡ LỊCH TRÌNH HÀNG NGÀY (SAU KHI ĐÃ CÀI ĐẶT ĐẦY ĐỦ)

Mỗi ngày muốn code tiếp, chỉ cần làm:

1. Đảm bảo MySQL Server đang chạy (kiểm tra XAMPP/MySQL service)
2. Mở **4 tab terminal** → chạy 4 lệnh backend theo thứ tự Tab 1 → 2 → 3 → 4
3. Mở **1 tab terminal nữa** → `npm run dev` trong `frontend-web`
4. Mở trình duyệt vào `http://localhost:5173`

---

## 🛠️ XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Lỗi: `Access denied for user 'root'@'localhost'`
**Nguyên nhân:** Sai mật khẩu MySQL trong file `.env`
**Cách sửa:** Mở `D:\huynhhoangthinh\backend-workspace\.env` → Sửa `DB_PASSWORD=` thành mật khẩu đúng của MySQL máy bạn.

---

### ❌ Lỗi: `Table 'kindergarten_db.typeorm_metadata' doesn't exist`
**Nguyên nhân:** Thiếu bảng TypeORM metadata
**Cách sửa:** Chạy SQL ở **Bước 1.4** trong MySQL Workbench.

---

### ❌ Lỗi: `DataTypeNotSupportedError: Data type "Object" in "EntityName.columnName"`
**Nguyên nhân:** Một column TypeORM thiếu `type` tường minh (VD: `varchar`, `int`)
**Cách sửa:** Liên hệ dev để sửa entity file tương ứng.

---

### ❌ Lỗi: `EADDRINUSE: address already in use :::3000`
**Nguyên nhân:** Đã có service đang dùng cổng đó
**Cách sửa:** Mở Task Manager → tìm `node.exe` → End Task. Hoặc dùng lệnh:
```bash
netstat -ano | findstr :3000
taskkill /PID <ID_TÌM_ĐƯỢC> /F
```

---

### ❌ Lỗi: `Cannot GET /api/...` hoặc `Network Error` trên Frontend
**Nguyên nhân:** API Gateway chưa chạy hoặc đã crash
**Cách sửa:** Kiểm tra Tab 4 (api-gateway), restart nếu cần.

---

### ❌ Webpack build lỗi TypeScript trên terminal backend
**Nguyên nhân:** Lỗi type trong entity/source code
**Cách sửa:** Đọc dòng lỗi (màu đỏ), sửa file được chỉ định.

---

## 📝 GHI CHÚ QUAN TRỌNG

- **Database chỉ cần setup 1 lần** — Sau đó MySQL tự chạy ngầm, không cần mở Workbench mỗi ngày.
- **Thứ tự chạy Backend bắt buộc:** auth → academic → health → api-gateway
- **Frontend chỉ cần 1 tab terminal** và chạy sau khi backend đã up.
- Mỗi khi thêm entity/column mới vào backend → cần chạy SQL `ALTER TABLE` thủ công trên Workbench (vì `synchronize: false`).
- File `.env` không được commit lên Git (đã có trong `.gitignore`).
