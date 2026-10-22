# Kích hoạt native cho đúng agent

Entrypoint dành cho agent cài quà là [install-9b.cjs](../install-9b.cjs), dùng cùng Node của host. Nó cài và bật skill trong một lệnh, nên khách không phải tự kích hoạt.

Helper chuyên trách [activate-9b.cjs](../activate-9b.cjs) chỉ nhận workspace/agent đã đăng ký và bản skill có dấu sở hữu đúng. Nó đọc trạng thái hiệu lực, kế thừa danh sách cũ và thêm contentlab cho chính agent bằng native CLI config set có kiểm giá trị cũ. Không sửa defaults, tools, policy, model, channels, credentials hoặc agent khác. Đọc lại config và hash ngữ nghĩa các phần ngoài phạm vi để kiểm. Không có fallback ghi JSON trực tiếp nếu native không ghi được.

--help của cả hai file cho agent xem đúng tham số. Đường dẫn/ID phải từ runtime và config host thực; khách không nhập các tham số kỹ thuật. Không suy agent/workspace từ cwd hoặc dùng tên lab của người tặng.

Sau configured:true, đọc SKILL đã cài để mở menu trong lượt hiện tại. Native skill snapshot cập nhật ở lượt tiếp theo cùng chat; /contentlab chọn rõ bộ quà tặng. Kiểm snapshot có contentlab và PNG attachment thật trước khi công bố chatVerified. Đăng ký file hay allowlist riêng lẻ không thay được kiểm chat. Không gọi model lồng vào phiên đang bận, restart app hoặc tắt quyền khác để ép refresh.

Hướng dẫn đọc hồ sơ: dùng native tìm và đọc nội dung, rồi onboarding assess; tổng số tài liệu/ảnh không đủ để nhận là hồ sơ hoàn chỉnh.
