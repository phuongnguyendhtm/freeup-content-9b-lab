# Bản 0.2.0 — tiêu chí phân phối

Bản cài dành cho khách chỉ có hướng dẫn vận hành, tài nguyên thương hiệu và mẫu sạch; tài liệu nghiên cứu/đối chiếu phát triển không đóng gói.

Bộ cài nhận --host openclaw, 9bizclaw, claude hoặc codex; --host auto nhận diện bằng dấu hiệu phiên. Claude Code dùng .claude/skills/contentlab, Codex dùng .agents/skills/contentlab; hai host còn lại dùng workspace/skills. Có ZIP skill tự chứa cho Claude web/Cowork, nơi việc bật skill thuộc luồng tài khoản.

Mẫu Sheet đã ghim trong references/sheet-template.md và JSON với Google ID, XLSX và hai SHA256. Helper sheet template kiểm file; bind/ingest/setup-plan từ chối provenance sai/thiếu. Không còn createBody để agent tạo spreadsheet trắng.

**111 kiểm thử đạt, 0 lỗi, 0 bỏ qua** trên Windows/Node 24. Đã cài cùng gói đầy đủ vào bốn layout host ở workspace cô lập, chạy menu/reference từ bản đã cài, kiểm cài lại không nhân đôi, từ chối provenance sai và mẫu XLSX bị thay đổi. Kiểm render PNG/MP4 thật dùng renderer riêng. Đây là kiểm bộ cài và helper cho bốn layout; chưa công bố đã thử UI hoặc account enable của Claude/Codex. Bộ công cụ nội dung kế thừa luồng đã chạy thực trên Windows/9B. Cài thành công vào thư mục không tự chứng minh kết nối Google hoặc quyền đăng đã có; phải đọc lại bằng host.

Đăng/worker nền mặc định tắt. Việc khách chỉ gửi link cần agent có quyền đọc GitHub, đọc hướng dẫn và chạy/cài skill theo nền tảng.
