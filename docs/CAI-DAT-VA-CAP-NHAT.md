# Cài, cập nhật và nơi lưu dữ liệu

Trên 9BizClaw/OpenClaw, agent dùng [install-9b.cjs](../install-9b.cjs) theo [INSTALL.md](../INSTALL.md). Một lệnh điều phối cài file, kiểm hash, kích hoạt contentlab bằng native CLI cho đúng workspace/agent và xuất menu/reference mẫu. Không yêu cầu khách mở thư mục, chạy kích hoạt riêng hoặc tạo agent mới. Cài lại cùng agent giữ hồ sơ/thành phẩm và không nhân đôi.

Skill ở workspace/skills/freeup-content-gon-lab; dữ liệu ở workspace/freeup-content-gon-lab-data; phần khách sử dụng ở workspace/Nội dung của tôi. Workspace lấy từ đăng ký host, không phải thư mục vendor, cwd hay file ZIP. Claude Code/Codex dùng thư mục skill của dự án.

Bộ cài chỉ thêm contentlab cho agent mục tiêu, giữ defaults/tools/policy/model/kênh/credential và agent khác. Không ghi config JSON trực tiếp. Nếu native từ chối, dừng và báo phần chưa hoàn tất; không tìm cách đổi quyền hoặc lách cửa chặn.

configured chỉ xác nhận native allowlist; chatVerified cần snapshot/attachment thật của lượt chat tiếp theo. Lượt cài đọc SKILL đã cài để phục vụ ngay; lượt chọn tiếp theo cùng chat nhận snapshot mới, không cần restart Gateway hay tạo chat khác.

Gỡ bằng install.cjs --uninstall-lab với đúng host/workspace; chỉ lưu trữ skill thuộc bộ cài, giữ dữ liệu và cấu hình khác. Đối chiếu native allowlist khi chủ thực sự muốn gỡ hoàn toàn, không tự xóa skill khác.
