# Kích hoạt native cho đúng agent

Entrypoint dành cho agent cài quà là [install-9b.cjs](../install-9b.cjs), dùng cùng Node của host: --prepare cài/kiểm file → công cụ openclaw thực hiện lệnh config có kiểu → --finalize xác minh. Khách chỉ gửi một yêu cầu; không tự kích hoạt. System prompt host yêu cầu cấu hình qua openclaw thì không dùng exec --apply để thay thế.

Prepare trả kế hoạch thêm contentlab cho đúng agent và toàn bộ danh sách cũ. Công cụ host hiện không có CAS giữa đọc/ghi, nên không thêm các cờ --expect-* vào message; chạy prepare mới nếu có thay đổi xen giữa. Finalize kiểm dấu sở hữu, inventory, danh sách mong đợi và hash cấu hình ngoài phạm vi. Helper [activate-9b.cjs](../activate-9b.cjs) giữ cho người vận hành dùng native CLI ngoài chat; agent trong chat phải dùng công cụ cấu hình host. Không sửa defaults, tools, policy, model, channels, credentials hoặc agent khác; không có fallback ghi JSON trực tiếp khi bị từ chối.

--help của cả hai file cho agent xem đúng tham số. Đường dẫn/ID phải từ runtime và config host thực; khách không nhập các tham số kỹ thuật. Không suy agent/workspace từ cwd hoặc dùng tên lab của người tặng.

Sau configured:true, đọc SKILL đã cài để mở menu trong lượt hiện tại. Native skill snapshot cập nhật ở lượt tiếp theo cùng chat; /contentlab chọn rõ bộ quà tặng. Kiểm snapshot có contentlab và PNG attachment thật trước khi công bố chatVerified. Đăng ký file hay allowlist riêng lẻ không thay được kiểm chat. Không gọi model lồng vào phiên đang bận, restart app hoặc tắt quyền khác để ép refresh.

Hướng dẫn đọc hồ sơ: dùng native tìm và đọc nội dung, rồi onboarding assess; tổng số tài liệu/ảnh không đủ để nhận là hồ sơ hoàn chỉnh.
