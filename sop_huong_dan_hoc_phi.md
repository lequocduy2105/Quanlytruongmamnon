# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## QUẢN LÝ HỌC PHÍ VÀ THU PHÍ HÀNG THÁNG
*Dành cho: Bộ phận Kế toán và Ban Giám Hiệu Trường Mầm Non*

---

### MỤC TIÊU QUY TRÌNH
Quy trình này hướng dẫn nhân viên Kế toán mầm non thực hiện thiết lập các mức thu, phát hành hóa đơn học phí hàng tháng, ghi nhận thanh toán và đối soát số liệu cuối kỳ trên phần mềm quản lý một cách chính xác, nhanh chóng, đảm bảo tính minh bạch và tránh sai sót số liệu.

---

### BƯỚC 1: THIẾT LẬP BẢNG GIÁ ĐẦU NĂM / ĐẦU THÁNG (Tab "Cấu Hình Học Phí")

Trước khi phát hành hóa đơn cho bất kỳ tháng nào, Kế toán cần đảm bảo danh sách các khoản thu đã được cấu hình chính xác theo quy định của nhà trường.

#### 1. Các loại khoản thu chính:
*   **Khoản thu cố định theo tháng (Ví dụ: Học phí cơ bản, Phí dịch vụ đưa đón định kỳ):**
    *   Là khoản tiền học sinh đóng đều đặn mỗi tháng, không thay đổi theo số ngày đi học thực tế.
    *   *Ví dụ hiện tại:* Học phí cơ bản là **1.500.000 đ / tháng**.
*   **Khoản thu biến đổi theo ngày thực tế (Ví dụ: Tiền ăn hàng ngày):**
    *   Là khoản tiền tính dựa trên số ngày đi học thực tế của trẻ. Cuối tháng sẽ đối chiếu với sổ điểm danh của giáo viên để tính toán lại.
    *   *Ví dụ hiện tại:* Tiền ăn hàng ngày là **25.000 đ / ngày**.
*   **Khoản thu một lần hoặc thu theo quý (Ví dụ: Phí cơ sở vật chất, Phí dã ngoại):**
    *   Khoản thu chỉ xuất hiện vào đầu năm học, đầu quý hoặc khi có sự kiện đặc biệt.
    *   *Ví dụ hiện tại:* Phí cơ sở vật chất Q2/2026 là **200.000 đ / lần**.

#### 2. Cách thêm mức phí mới:
1.  Truy cập vào màn hình **Quản lý Tài chính**, chọn thẻ (tab) **Cấu Hình Học Phí**.
2.  Nhấn nút **`+ Thêm Mức Phí`** ở góc phải màn hình.
3.  Điền đầy đủ thông tin vào hộp thoại hiện lên:
    *   *Tên mức phí:* Ghi rõ ràng, dễ hiểu (ví dụ: *"Tiền ăn lớp chất lượng cao"*, *"Học phí tháng 5/2026"*).
    *   *Loại phí:* Lựa chọn nhóm phí tương ứng (Học phí, Tiền ăn, Cơ sở vật chất, hoặc Khác).
    *   *Số tiền:* Nhập số tiền cụ thể bằng Đồng Việt Nam.
    *   *Chu kỳ thu:* Chọn **Hàng tháng (cố định)**, **Theo ngày thực tế**, hoặc **Thu một lần**.
    *   *Ngày áp dụng:* Chọn ngày bắt đầu mức phí có hiệu lực.
4.  Nhấn **Lưu** để hệ thống ghi nhận.
5.  *Chỉnh sửa/Xóa:* Sử dụng biểu tượng bút chì ✏️ để sửa thông tin hoặc biểu tượng thùng rác 🗑️ để xóa mức phí cũ nếu không còn áp dụng.

---

### BƯỚC 2: PHÁT HÀNH HÓA ĐƠN HÀNG THÁNG (Tab "Hóa Đơn")

Vào đầu mỗi tháng (thường từ ngày 01 đến ngày 05), Kế toán thực hiện phát hành hóa đơn học phí hàng loạt cho toàn trường.

#### 1. Thời điểm thực hiện:
*   Chỉ bấm nút phát hành hóa đơn khi Giáo viên chủ nhiệm các lớp đã **hoàn thành điểm danh hoàn toàn** và khóa sổ điểm danh của tháng trước đó.

#### 2. Cơ chế tự động trừ tiền ăn thông minh:
Khi bạn bấm nút phát hành hóa đơn, hệ thống sẽ thực hiện hai việc cùng lúc:
*   **Thu trước cho tháng mới:** Tính toán học phí cố định và tạm thu tiền ăn cho toàn bộ số ngày học dự kiến của tháng mới.
*   **Khấu trừ tiền ăn tháng cũ:** Hệ thống tự động kiểm tra sổ điểm danh tháng trước của từng học sinh. Nếu học sinh có những ngày nghỉ học **được giáo viên xác nhận là "Vắng có phép"**, hệ thống sẽ tự động nhân số ngày nghỉ đó với đơn giá tiền ăn (25.000 đ/ngày) và **trừ trực tiếp** vào tổng tiền của hóa đơn tháng này dưới dạng mục "Hoàn trả tiền ăn".
    > *Ví dụ:* Học sinh nghỉ 3 ngày có phép trong tháng 4. Khi tạo hóa đơn tháng 5, em đó sẽ tự động được trừ: $3 \text{ ngày} \times 25.000 \text{ đ} = 75.000 \text{ đ}$ vào hóa đơn mới.

#### 3. Các bước phát hành:
1.  Tại màn hình **Quản lý Tài chính**, chọn bộ lọc tháng cần phát hành (ví dụ: *May 2026*).
2.  Nhấn nút **`Tạo Hóa Đơn Tháng Này`** (nút màu xanh đậm ở góc phải phía trên).
3.  Hệ thống sẽ hiển thị thông báo xác nhận và tiến hành chạy tính toán tự động cho tất cả học sinh đang học tại trường.
4.  Sau khi chạy xong, danh sách hóa đơn của từng học sinh theo từng lớp sẽ hiển thị đầy đủ bên dưới tab **Hóa Đơn**.

---

### BƯỚC 3: THU TIỀN VÀ GẠCH NỢ (Tab "Hóa Đơn")

Sau khi hóa đơn được phát hành, phụ huynh sẽ nhận được thông báo học phí trên ứng dụng điện thoại dành cho phụ huynh. Kế toán theo dõi và ghi nhận thanh toán bằng hai cách:

#### Cách 1: Thanh toán không tiền mặt (VietQR / Chuyển khoản ngân hàng)
*   Phụ huynh mở ứng dụng phụ huynh, quét mã **VietQR** hiển thị trên hóa đơn hoặc thực hiện chuyển khoản.
*   Mỗi hóa đơn có một mã QR chứa nội dung chuyển khoản riêng biệt duy nhất. Khi phụ huynh thanh toán thành công qua ngân hàng, hệ thống sẽ tự động đối soát và chuyển trạng thái hóa đơn sang **Đã Thanh Toán** (Màu xanh lá) mà Kế toán không cần thao tác thủ công.

#### Cách 2: Thu tiền mặt tại quầy (Kế toán gạch nợ thủ công)
Trong trường hợp phụ huynh nộp tiền mặt trực tiếp tại văn phòng kế toán trường:
1.  Tại tab **Hóa Đơn**, chọn Lớp của học sinh đó.
2.  Tìm đúng tên học sinh cần nộp tiền trong danh sách.
3.  Nhấn nút **Ghi Nhận Thanh Toán** (hoặc biểu tượng nút chức năng thu tiền ở cột Hành Động bên phải dòng thông tin học sinh).
4.  Nhập thông số thu tiền:
    *   *Số tiền thu:* Mặc định là tổng số tiền còn nợ (Kế toán có thể sửa nếu phụ huynh đóng trước một phần).
    *   *Phương thức:* Chọn **Tiền mặt**.
    *   *Ghi chú:* Ghi tên người nộp hoặc thông tin xác nhận nếu cần.
5.  Bấm **Xác nhận**. Trạng thái hóa đơn của học sinh sẽ lập tức chuyển từ **Chờ Thu** (Màu cam) sang **Đã Thanh Toán** (Màu xanh lá) hoặc **Một Phần** (Màu vàng) nếu chỉ mới đóng một ít.

---

### BƯỚC 4: ĐỐI SOÁT CUỐI THÁNG VÀ GIỤC NỢ (Tab "Tổng Hợp")

Cuối tháng, Kế toán và Ban Giám Hiệu sử dụng tab **Tổng Hợp** để nắm bắt bức tranh tài chính tổng thể và đôn đốc các trường hợp chậm đóng học phí.

#### 1. Đọc hiểu các chỉ số tổng quan trên màn hình:
*   **Tổng Hóa Đơn:** Tổng số tiền nhà trường cần thu trong tháng.
*   **Đã Thu:** Số tiền thực tế đã vào tài khoản/két sắt của trường tính đến thời điểm hiện tại.
*   **Còn Nợ:** Số tiền học phí chưa thu được của tháng hiện tại.
*   **Quá Hạn:** Số lượng hóa đơn đã quá ngày hạn định thanh toán nhưng phụ huynh vẫn chưa đóng tiền.
*   **Tỷ lệ thu học phí (%):** Chỉ số phần trăm trực quan giúp Ban giám hiệu biết tiến độ thu tiền đã đạt bao nhiêu phần trăm kế hoạch (ví dụ: đã thu được 80% tổng số cần thu).

#### 2. Quy trình xử lý hóa đơn quá hạn & Giục nợ:
1.  Kế toán truy cập tab **Tổng Hợp** để xem nhanh số lượng học sinh nằm trong nhóm **Quá Hạn** (ô màu đỏ).
2.  Quay lại tab **Hóa Đơn**, lọc danh sách hóa đơn theo trạng thái **Quá Hạn**.
3.  Kế toán có thể xem chi tiết thông tin liên hệ của phụ huynh (số điện thoại Ba/Mẹ) trực tiếp bằng cách bấm vào tên học sinh để gọi điện nhắc nhở, hoặc gửi thông báo nhắc đóng phí trực tiếp qua ứng dụng.
4.  Đối với các hóa đơn quá hạn lâu ngày, Ban Giám Hiệu có thể xuất báo cáo danh sách nợ phí từ phần mềm để có phương án xử lý theo quy định của nhà trường.

---
*Chúc các cô vận hành hệ thống quản lý học phí trơn tru và hiệu quả!*
