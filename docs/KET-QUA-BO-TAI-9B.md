# Bản sửa bộ tải và luồng cài 9B — 22/10/2026

Hướng dẫn chính thức: [CAI-TRONG-9B.md](../CAI-TRONG-9B.md). Runtime vẫn là 0.3.0; phần sửa là bộ tải thực thi bằng Node trong luồng cài, không đổi byte ZIP đã phát hành hoặc quyền chung của 9B.

Lỗi khách gặp: dùng công cụ đọc web lấy ZIP khiến kết quả nhị phân bị cắt trước bước kiểm hash. Bộ tải mới nhận byte trực tiếp bằng HTTPS của Node, kiểm kích thước/SHA256, kiểm manifest của mọi tệp và tự giải nén UTF-8. Agent không chép ZIP/base64 qua ngữ cảnh model, không cần Git/npm/Python/tar và không yêu cầu khách tự tải tệp. Bộ tải được lấy từ commit cố định và được kiểm SHA256 trước khi chạy.

Đã xác minh:

- **151/151 kiểm thử đạt trên Node v22.22.3**, không bỏ qua. Gồm bộ cài, kích hoạt, onboarding, template, sản xuất/QA/export và renderer; 9 kiểm thử mới kiểm bộ tải, bản tải bị cắt/sai hash, chuyển hướng HTTPS, manifest, tên tiếng Việt, đường dẫn nguy hiểm và symlink ZIP.
- Chạy nguyên đoạn khởi động trong hướng dẫn bằng Node 22: tải đủ **1.954.330 byte**, SHA256 `a4da860a5a5a0922cd78f51f490595959dbbe033a3b559eab7b20d33489aa4a4`; manifest hợp lệ, tên XLSX tiếng Việt được giữ nguyên.
- Thử trên agent 9B mới qua CLI với model/công cụ thật, chỉ gửi đúng câu cài kèm link CAI-TRONG-9B.md: bộ tải tạo download receipt hợp lệ; prepare cài đúng workspace; công cụ openclaw ghi danh sách skill mục tiêu; finalize xác nhận installed/configured.
- Hash cấu hình ngoài danh sách skill của agent thử không đổi. Không sửa policy, quyền chạy lệnh, defaults, model, kênh hoặc credential để làm kiểm thử vượt qua.
- Agent tìm/đọc Tri thức, chạy assess cho nhánh bài chữ, kiểm kê thư viện ảnh và trả attachment PNG menu trong chính yêu cầu cài ban đầu.
- Lượt tiếp theo cùng hội thoại có contentlab trong native snapshot. Gửi riêng `1` được nhận đúng Bài viết; lượt này không báo lỗi công cụ. Đây là lựa chọn nội dung bình thường, không phải câu lệnh kích hoạt thứ hai.

Trong lượt cài thật có một lỗi mở ảnh qua view_image; agent đã báo có ảnh nhưng chưa xác minh đúng người/sản phẩm. Lỗi đó không thuộc bước tải/cài/kích hoạt và không được coi là ảnh đã qua kiểm. Chưa nghiệm thu đầy đủ sản xuất ảnh/video native hoặc hiển thị trong giao diện chat desktop trong lượt này. Thử CLI/backend không chứng minh phần mềm đã được cài trên máy khách từ xa.

Node của host cần từ 22 trở lên và phiên chủ có công cụ thực thi/ghi tệp cùng quyền cấu hình phù hợp. Nếu host yêu cầu phê duyệt, agent trình đúng phê duyệt đó; bộ tải không tự cấp thêm quyền. Log, hồ sơ, ID tài liệu, ảnh và thông tin xác thực được giữ ngoài repo/gói phát hành.
