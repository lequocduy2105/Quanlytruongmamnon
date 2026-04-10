# BÁO CÁO TỔNG HỢP TOÀN TẬP DỰ ÁN 
## TRANG WEB QUẢN LÝ CHẤT LƯỢNG ĐÀO TẠO & SỨC KHỎE TRƯỜNG MẦM NON

---

## PHẦN I: TỔNG QUAN VÀ MỤC TIÊU DỰ ÁN

### 1. Giới thiệu dự án
Dự án được xây dựng với mục tiêu định nghĩa lại khuôn khổ số hóa của môi trường giáo dục mầm non. Vượt qua giới hạn của việc "quản lý thông tin học sinh" hay "giữ trẻ" truyền thống, hệ thống hoạt động như một nền tảng **"Giám sát, Đánh giá chất lượng dạy học và Chăm sóc sức khỏe toàn diện"**. Điểm nhấn đột phá là hệ thống vòng tròng khép kín: Đo lường sức khoẻ – Chấm điểm năng lực đa chiều – Lấy ý kiến đánh giá trực tiếp từ phụ huynh.

### 2. Thông tin Công nghệ áp dụng (Tech Stack)
Hệ thống được ứng dụng các công nghệ tiêu chuẩn Enterprise mới nhất, được cấu trúc theo mô hình **Client - Server (RESTful API)**:
- **Hệ sinh thái:** 100% Nền tảng Web (Web-based Application). Giao diện tối ưu Responsive cho mọi kích cỡ thiết bị di động, tablet của Phụ huynh lẫn màn hình máy tính của Ban Giám Hiệu. Không sử dụng Native App để tránh gánh nặng duy trì bảo hành tải App.
- **Frontend (Client-side):** ReactJS. Tạo ra một Single Page Application (SPA) mượt mà, tốc độ phản hồi tính bằng mili-giây.
- **Backend (Server-side):** NestJS. Framework Node.js cung cấp kiến trúc mã nguồn module hóa chặt chẽ, bảo mật nâng cao và hiệu suất chịu tải vượt trội cho các truy vấn dữ liệu theo thời gian thực (Real-time).
- **Cơ sở dữ liệu (Database):** MySQL quản trị qua TypeORM thao tác trên tập dữ liệu Relationship phức tạp.

---

## PHẦN II: PHÂN TÍCH ĐỐI TƯỢNG VÀ PHÂN QUYỀN (ROLES IN THE SYSTEM)

Hệ thống hoạt động trên một trang web duy nhất thông qua cơ chế **Phân Quyền Theo Vai Trò (Role-Based Access Control)**. 

### 1. Ban Giám Hiệu (BGH / Admin) - *Nhà Quản trị Học Thuật*
- **Quyền hạn:** Cao nhất.
- **Chức năng:** Là người đứng đầu khởi tạo khung chuẩn (Các chương trình học, các lớp, chứng chỉ). Phân công giáo viên chủ nhiệm. Giám sát toàn cục chất lượng bằng các thông số, nắm bắt biểu đồ đánh giá/khiếu nại của Phụ huynh để kịp thời điều chỉnh rủi ro.

### 2. Giáo Viên (Teacher) - *Nhà Đánh Giá Trực Tiếp*
- **Quyền hạn:** Thao tác trên không gian lớp học được cấp quyền.
- **Chức năng:** Nắm vai trò nhập liệu nòng cốt. Đo lường chỉ số sinh trắc (sức khoẻ). Chấm điểm khách quan các hệ kỹ năng của bé. Thiết lập các nhật ký thiếu sót, khuyết điểm trong từng kỳ học và phát hành báo cáo.

### 3. Phụ Huynh (Parent) - *Người Thụ Hưởng & Giám Khảo Khách Quan*
- **Quyền hạn:** Theo dõi học sinh theo định danh được mã hoá. 
- **Chức năng:** Đọc các chỉ số y tế, bảng điểm năng lực của con mình. Khác với mô hình cũ, Phụ huynh được trao quyền lực lớn là đánh giá (**Rating**) chất lượng cơ sở vật chất và chuyên môn của giáo viên sau khi nhận phiếu báo cáo.

---

## PHẦN III: PHÂN TÍCH MODULE VÀ CÁC CHỨC NĂNG CỐT LÕI

Hệ thống xoay quanh 4 Phân hệ (Modules) chính:

### MODULE 1: Quản Trị Hệ Thống Dạy Học (Course & Class Management)
- **Tạo Khóa đào tạo:** Không lưu trữ tĩnh, cho phép lập các môn học Kỹ năng (Theo chuẩn Giáo dục sớm: Kỹ năng Sinh Tồn, Nhận Thức Toán Tư Duy, Lớp Năng Khiếu vẽ).
- **Phân bổ nhân sự:** Gắn Profile năng lực của một Giáo viên với một Lớp Tín Chỉ. Tự động tính toán sĩ số giới hạn để không gây quá tải chất lượng.

### MODULE 2: Quản Lý Khối Y Tế & Thể Chất (Health Tracker)
- Hằng tháng/Hệ kỳ, Giáo viên cập nhật các chỉ số sinh học của bé: Cân nặng, chiều cao, nhịp tim.
- Liên kết với thuật toán vẽ **Line Chart (Biểu đồ phát triển)** bên Frontend để phụ huynh dễ dàng so sánh cân nặng của trẻ với quy chuẩn BMI toàn cầu.
- Log lưu trữ Bệnh sử (Dị ứng hải sản, Ghi chú bệnh nền) – Cảnh báo đỏ tránh các hậu quả y tế tại trường.

### MODULE 3: Đánh Giá Năng Lực Học Sinh (Assessment & Deficiency Log)
- Chuyển đổi tư duy "bài kiểm tra 10 điểm" thành "Đánh giá xếp hạng Thang Kỹ Năng". 
- Giáo viên thao tác trên UI để kéo Slider (Thang trượt) chấm điểm các kỹ năng sau khóa dạy.
- Trình tạo lập bảng ghi chú **Sự thiếu sót (Deficiencies)**: Báo lại ngay nếu trẻ "tự kỉ nhẹ", "tiếp thu chậm ngôn ngữ", "kỹ năng đi giày dép chưa có" để thiết lập cầu nối giáo dục giữa nhà trường - gia đình.

### MODULE 4: Sổ Liên Lạc Điện Tử Thuận Nghịch (Two-way Review & Feedback)
Phân hệ làm nên giá trị cốt lõi nhất của hệ thống:
- **Giáo Viên "Chấm" Học sinh:** Báo cáo năng lực tự động sinh ra và đẩy về tài khoản của ba mẹ.
- **Ba Mẹ "Chấm" Nhà Trường:** Tính năng "Khóa màn hình". Hệ thống ép Phụ huynh phải làm Form Review (Chấm sao và Ghi nhận xét) về Giáo viên đó mới mở khóa các tính năng khác tiếp theo.
- **Data Tự Động:** Backend NestJS gom kết quả từ hàng ngàn ba mẹ để xuất lại KPI cho Ban Giám Hiện (Đánh giá chung giáo viên đó trong tháng đạt mấy sao).

---

## PHẦN IV: LUỒNG HOẠT ĐỘNG (WORKFLOW) - CHU KỲ KIỂM ĐỊNH

| Bước Bước | Đối tượng thực thi | Hành động trên Web App |
| :---: | :--- | :--- |
| **1.** Khởi tạo học kỳ | **Ban Giám Hiệu** | Xây dựng Học kỳ chuẩn bị khai giảng. Config Môn học "Làm quen với Chữ cái" và giao cô Lê Thị A làm chủ nhiệm. |
| **2.** Chăm sóc Y tế | **Giáo Viên** | Thứ Tư đầu tháng, cô A cập nhật chỉ số Thể chất, Nhịp tim của lớp lên hệ thống theo các công cụ đo bằng tay. |
| **3.** Đánh giá năng lực | **Giáo Viên** | Chiều Thứ 6, cô A mở Dashboard. Chấm bé Hoàng đạt 8 điểm Kỹ năng Giao tiếp. Cô ghi File Log: "Hoàng hơi chậm chữ O, ba mẹ cần lưu ý". |
| **4.** Xử lý & Phân phối | **Server (NestJS)** | Máy chủ ghi nhận dữ liệu, tạo một bản Record học tập điện tử. Push một Alert sang Web của Bố bé Hoàng. |
| **5.** Đọc & Cấp quyền | **Phụ Huynh** | Tối T6, Bố bé Hoàng mở Web trên điện thoại di động đọc Record. Thấy cô A quan sát con mình rất tỉ mỉ. |
| **6.** Phản hồi ngược (Rating)| **Phụ Huynh** | Màn hình Pop-up yêu cầu Bố đánh giá. Bố chấm cô A "5 Cực sao", ghi note "Cô dạy chu đáo". Bấm Submit. |
| **7.** Giám sát Toàn diện | **Ban Giám Hiệu** | Sáng Thứ 2 tuần tới. BGH mở web, hệ thống Chart đánh giá tự động chấm điểm hiệu suất của cô A lọt Top 1 của trường nhờ những phản hồi xịn xò. |

---

## PHẦN V: Ý NGHĨA KINH TẾ (SELLING POINTS ĐÁNH VÀO NHU CẦU THỰC TẾ)

Là mô hình kết hợp sức mạnh của một dự án Cực kỳ hiện đại (React/NestJS) vào cấu trúc cực kỳ Thực tiễn (Quản lý Sức khoẻ/Sự lo âu). Sự phối kết hợp này đáp ứng bài toán cao nhất của chủ đầu tư Trường học:
1. **Minh bạch là Vũ Khí Marketing Cốt Lõi:** Thay vì những lời hứa suông từ tờ rơi tuyển sinh, hệ thống cung cấp dữ liệu số hóa, điểm số hóa. Việc Ba mẹ có quyền Chấm Điểm ngược lại giáo viên tạo ra cảm giác "Sức mạnh nằm trong tay Khách hàng", bảo chứng niềm tin tuyệt đối cho một môi trường Dân lập học phí cao.
2. **Kịp Thời Nhận Diện Khủng Hoảng:** Đa số các cuộc tẩy chay / phốt nhà trường mầm non liên can tới Bạo Hành hoặc bỏ bê. Vì có hệ thống Log Thiếu sót + Đánh giá Review định kỳ, nhà trường "Bắt mạch" được sự không hài lòng của Giáo viên hay Phụ huynh ngay từ lúc nó chưa nổ ra bên ngoài. **Nắm thế chủ động quản trị rủi ro.**
3. **Kiến Trúc Micro-Service Rút Gọn của NestJS:** Hệ thống viết ra không dành riêng cho 1 trường làng. Database có sức mạnh Scale-up (Nhân bản) thành chuỗi các viện mầm non khác nhau nhưng vẫn đồng bộ dữ liệu vào 1 con server mẹ duy nhất. Chữ "Professional" (Chuyên nghiệp) nằm ở cấu trúc mã nguồn API.
