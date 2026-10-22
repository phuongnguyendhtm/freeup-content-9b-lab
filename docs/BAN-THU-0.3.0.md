# FreeUp Content Gọn 0.3.0

Khách gửi một yêu cầu cài trong chat điều khiển 9B có quyền chủ. Agent dùng workspace đã đăng ký hiện tại, không yêu cầu khách mở thư mục kỹ thuật. Luồng cài: install-9b.cjs --prepare → lệnh config có kiểu qua công cụ openclaw của host → --finalize → đọc skill đã cài, kiểm hồ sơ và mở menu.

Prepare/finalize không ghi cấu hình host; finalize đối chiếu đúng danh sách skill, inventory và hash các phần cấu hình ngoài phạm vi. Không đổi tools/policy/defaults/model/kênh/credential hoặc agent khác. Full Access có thể xử lý trong một lượt; host yêu cầu duyệt thì chủ duyệt qua giao diện chính thức, agent không tự approve. Native từ chối thì dừng, không thử đường ghi khác.

Kiểm thử tự động bằng Node đi kèm 9B: **142/142 đạt, không bỏ qua**. Bao gồm cài/nâng cấp, workspace/agent, danh sách kế thừa 167 skill, prepare/finalize, từ chối quyền, thay đổi đồng thời, menu, onboarding/đọc lại, template Sheet, sản xuất/QA/export và renderer PNG/FFmpeg thật. Gói ZIP cũng được cài thử qua bốn adapter OpenClaw, 9BizClaw, Claude Code, Codex; kiểm menu và hash XLSX/reference. Claude web/Cowork cần luồng enable tài khoản của nền tảng.

Gói khách hiện tại không chứa thông tin của nguồn tham khảo bên ngoài hoặc hồ sơ/ảnh/credential của người tặng. Mẫu Sheet ghim đúng ba trang. Các bài ảnh/video có caption và media thực; publisher/lịch nền mặc định tắt.

Cài file và configured:true không thay bằng chứng chat: lượt cài đọc skill trực tiếp để dùng ngay; lượt chọn tiếp theo cùng hội thoại phải nạp contentlab trong snapshot. Hồ sơ chỉ được kết luận từ tài liệu đã đọc và onboarding assess có nguồn, không từ số lượng file. Dữ liệu kiểm thử doanh nghiệp được giữ ngoài gói phân phối.
