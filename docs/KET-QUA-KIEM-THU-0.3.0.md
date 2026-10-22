# Kết quả kiểm thử 0.3.0 — 22/10/2026

Bản phát hành: [v0.3.0](https://github.com/phuongnguyendhtm/freeup-content-9b-lab/releases/tag/v0.3.0), tag trỏ commit e0920b89d71e5c963c320130764a050f10d90589.

**142/142 kiểm thử tự động đạt, không bỏ qua.** Bộ cài ZIP được kiểm qua bốn adapter OpenClaw, 9BizClaw, Claude Code và Codex; menu, manifest và mẫu Sheet đúng hash. Đây là kiểm adapter local; Claude web/Cowork vẫn cần enable của tài khoản.

Thử bằng model và công cụ 9B thật trên Windows, trong agent thử riêng không gắn kênh:

1. Một câu cài từ GitHub: agent tải/kiểm gói, cài đúng workspace, thêm contentlab qua công cụ cấu hình openclaw, rồi finalize xác minh. Danh sách kế thừa 167 skill được giữ và thêm đúng một tên; hash cấu hình ngoài phạm vi không đổi.
2. Agent thực sự tìm/đọc tài liệu Tri thức và chạy onboarding assess có nguồn. Đã đủ đầu vào cho nhánh bài chữ; không dùng số lượng tài liệu để tự kết luận.
3. 9B trả attachment PNG menu. Ngay lượt tiếp theo cùng hội thoại, native snapshot có contentlab; gửi riêng số 1 được nhận đúng Bài viết.
4. Gửi chủ đề: tạo nháp, qua QA và xuất Bài viết.txt cùng Xem bài.html. File thực tồn tại, hash nội dung khớp; chưa phê duyệt hoặc đăng ra ngoài.
5. Cài lại bằng đúng [link hướng dẫn v0.3.0](https://github.com/phuongnguyendhtm/freeup-content-9b-lab/blob/v0.3.0/INSTALL.md): thành công, không lỗi công cụ được báo, trả menu và XLSX ba trang; giữ dữ liệu đã tạo.

Link ZIP được tải ẩn danh và đối chiếu SHA256:

`a4da860a5a5a0922cd78f51f490595959dbbe033a3b559eab7b20d33489aa4a4`

Lượt cài đầu từng gặp cache tài liệu main và giải nén Unicode bằng tar, rồi tự phục hồi. Hướng dẫn phát hành đã ghim phiên bản và yêu cầu Expand-Archive/.NET trên Windows; lượt cài lại bằng link ghim không báo lỗi công cụ.

Phạm vi thử thật là native agent qua CLI và attachment backend, chưa đánh giá giao diện chat desktop. Nhánh ảnh/video có kiểm thử helper/renderer PNG/FFmpeg; chưa nghiệm thu đầy đủ tạo ảnh/video bằng dịch vụ native trong cuộc chat này. Sẵn sàng bài chữ không đồng nghĩa mọi sản phẩm/chân dung/clip đã được xác minh. Quyền và năng lực thực của host vẫn được tôn trọng; host yêu cầu duyệt thì chủ duyệt.

Log, nội dung hồ sơ, ảnh, ID tài liệu và thông tin xác thực của doanh nghiệp được giữ ngoài repo/gói phát hành.
