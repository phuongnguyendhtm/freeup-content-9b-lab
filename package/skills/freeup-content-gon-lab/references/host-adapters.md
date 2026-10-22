# Adapter theo môi trường

Xác định host từ phiên thật; không coi tên model là tên nền tảng. Dùng Node >=22 hiện có. Tìm đường dẫn tuyệt đối của SKILL.md đã nạp để định vị scripts/contentlab.cjs; không giữ nguyên {baseDir} hoặc biến host khác khi gọi lệnh. --workspace luôn là thư mục dữ liệu/dự án của khách, không phải thư mục skill.

## 9BizClaw/OpenClaw

9B dùng Tri thức và Hình ảnh doanh nghiệp qua [9b-native-tools.md](9b-native-tools.md). OpenClaw chỉ dùng tool/schema thực có trong phiên; tool chuyên biệt 9B không có thì chuyển sang tài liệu/ảnh khách đã cấp, không khai có tool đó.

## Claude Code/Codex

Đọc tài liệu và thư mục ảnh khách đã cấp trong workspace hoặc connector đang nối. Dùng scope helper để tạo khóa local theo workspace/agent khi không có native businessId; không coi đây là ID doanh nghiệp của 9B. Chuẩn hóa nguồn tài liệu thật thành kind knowledge, tool read_local_document hoặc connected_document_read; content là nội dung vừa đọc đầy đủ cho các trường đang đánh giá, readAt là thời điểm đọc thật. Ghi đường dẫn/ID và phiên bản/hash của tài liệu trong revision; dữ liệu không có bằng chứng vẫn thiếu. confirmed_user_message chỉ cho thông tin chủ thực sự xác nhận. Không tự tạo hồ sơ mẫu của người tặng.

Đọc/xem ảnh thực, dùng ID asset connector hoặc ID local ổn định theo file/hash. Inventory ảnh local đã quét có thể dùng kind media_catalog, tool trusted_local_media_catalog, content JSON có items và các trường id, mimeType, mediaStatus, sizeBytes, origin từ file thật. Đây là adapter local, không giả kết quả company_media_search. Giữ đúng doanh nghiệp/sản phẩm và nguồn, chỉ confirmedMatch sau xem/xác nhận.

## Menu/attachment

Helper menu trả mediaPath. 9B/OpenClaw dùng MEDIA: khi kênh hỗ trợ. Claude/Codex dùng attachment/view-image/link file được host hỗ trợ; không tự gửi MEDIA: như cú pháp chung. Khi môi trường không thể hiển thị ảnh, giao PNG thực và menu chữ, nêu đúng giới hạn. Menu luôn dùng ảnh đóng gói.

## Nộp hồ sơ và Sheet

9B nộp vào Tri thức; host khác nộp vào thư mục tài liệu/connector đã chọn của chính khách. Tôi đã hoàn tất luôn kích hoạt đọc lại, không tự đủ. Sheet dùng [mẫu bắt buộc](sheet-template.md) qua connector của phiên; không có connector thì giao XLSX. Không tự sửa native profile/ảnh/thư mục account ngoài phạm vi khách đã cấp.

Claude web/Cowork chỉ gọi cài tài khoản thành công sau native enable/receipt thực; filesystem copy không thay được bước đó.
