---
name: install-contentlab-gift
description: "Nhận và cài FreeUp Content Gọn từ GitHub cho 9BizClaw/OpenClaw, Claude hoặc Codex. Trên 9B dùng install-9b.cjs để cài và kích hoạt đúng agent hiện tại, mở menu và kiểm hồ sơ có nguồn."
---

# Nhận quà FreeUp Content Gọn

Trên 9B, bắt đầu tại [CAI-TRONG-9B.md](CAI-TRONG-9B.md): chạy bộ tải Node đã ghim để nhận ZIP nhị phân nguyên vẹn. Công cụ đọc web chỉ đọc văn bản, không lấy ZIP qua ngữ cảnh model. Agent tự tải/kiểm/giải nén rồi cài/kích hoạt trong một yêu cầu; không bắt khách tự cung cấp ZIP hoặc gõ lệnh kỹ thuật.

Trước khi nhận là không cài được, làm bước 0 trong INSTALL.md: kiểm công cụ thật và thử thao tác chỉ đọc theo schema. Không bắt buộc tool tên “cài skill”; khả năng chạy lệnh/ghi file đã được cấp có thể thực hiện bộ cài. Không nhầm giới hạn của phiên cấu hình trung gian với phiên chủ hiện tại. Thiếu quyền thật thì báo đúng phần thiếu, không tự nâng quyền hoặc chuyển sang đường khác để né từ chối.

Đọc [INSTALL.md](INSTALL.md), lấy bản raw hiện tại nếu HTML cũ/bị cắt. Khi chủ yêu cầu cài từ link, tự làm phần kỹ thuật. **9B/OpenClaw:** install-9b.cjs --prepare → lệnh config có kiểu qua công cụ openclaw của host → --finalize cho workspace agent đã đăng ký hiện tại. Không dùng exec --apply thay công cụ cấu hình bắt buộc. Không bắt khách chọn thư mục, chạy lệnh thứ hai hoặc đổi agent; không tự dùng content-gon-test của người tặng. Giữ nguyên quyền/cấu hình khác và dừng nếu native từ chối.

Root SKILL này chỉ hướng dẫn cài/cập nhật. Sau configured thật, đọc SKILL sản xuất đã cài, chạy onboarding init → đọc tài liệu/ảnh thật → assess → setup. Hiển thị customerMessage với câu hỏi đúng phần thiếu, mẫu cần điền và cả ba đường dẫn B-roll/nhạc/giọng, rồi menu trong cùng lượt. Không kết luận đủ từ đếm tài liệu hoặc từ trạng thái bài chữ. Cập nhật giữ tiến độ và tiếp tục thiết lập ngay. Lượt chọn tiếp theo cùng chat dùng snapshot đã cập nhật. Mẫu Sheet trong reference là bắt buộc. Claude/Codex dùng adapter của host, Claude web/Cowork cần enable skill tài khoản.
