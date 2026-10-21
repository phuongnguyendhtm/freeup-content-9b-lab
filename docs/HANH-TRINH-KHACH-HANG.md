# Hành trình cài đặt và sử dụng Content Gọn

**Thiết kế cập nhật ngày 21/10/2026. Các đoạn chat dưới đây là minh họa trải nghiệm cần xây.**

## 1. Nhận link GitHub và gửi một câu trong 9B

Trang nhận quà cung cấp link, câu sao chép và hướng dẫn ngắn. Sau khi có bộ cài thực, khách gửi:

> Cài bộ Content Gọn từ [link GitHub quà tặng]. Sau khi cài, kiểm tra hồ sơ doanh nghiệp, Tri thức và ảnh đã có; hướng dẫn tôi bổ sung phần còn thiếu rồi đưa tôi đến menu làm content thử.

Khách không phải tải ZIP, cài Git, chép thư mục, sửa API key hoặc deploy Apps Script. Cần có 9B đã cài và khởi tạo. Repo lab hiện chưa có installer; đây là mô tả luồng đích.

## 2. Cài skill và chuyển sang kiểm tra chủ động

Installer xác định host, agent, release và kho riêng; chỉ báo đã cài khi có receipt và inventory hợp lệ. Cài xong, hệ thống tự kiểm dữ liệu, không đợi khách nhớ lệnh thiết lập.

Nếu host cần kết thúc lượt chat để cài nền, fallback là “Đã bắt đầu cài; gửi Tiếp tục ở lượt mới”. Chỉ công bố tự tiếp tục hoàn toàn sau khi kiểm được callback phù hợp; không giữ chat chạy để chờ chính Gateway rảnh.

## 3. Đọc hồ sơ và Tri thức đang có

Xác định đúng doanh nghiệp, rồi đọc các nguồn liên quan: hồ sơ, tài liệu Tri thức, giọng/bài mẫu đã xác nhận và ảnh doanh nghiệp.

Kiểm thương hiệu, USP, sản phẩm, khách hàng và vấn đề, mục tiêu marketing, giọng/xưng hô, cách trình bày, màu/logo/font/phong cách, ảnh và nguyên liệu cần cho định dạng được chọn.

Tên file không quyết định đủ hay thiếu. Tài liệu khác tên nhưng đủ nội dung vẫn dùng được; file mang tên đúng nhưng còn trống chưa đủ. Ví dụ trong mẫu không phải dữ kiện khách hàng.

## 4. Chỉ gửi link mẫu phù hợp phần thiếu

Đối chiếu dữ kiện thiếu với [mười mẫu](../templates/knowledge/README.md), gửi đúng link và chỉ rõ mục cần hoàn thiện. Ví dụ khi đã có sản phẩm và khách hàng:

> Tôi đã đọc hồ sơ hiện có. Anh/chị cần bổ sung hai phần:
>
> 1. **Công ty và nhận diện:** mục USP, màu và logo/phong cách.
> 2. **Giọng điệu:** cách xưng hô và một vài câu mẫu.
>
> Hãy mở hai link tôi gửi, chỉ điền phần còn thiếu rồi tải bản đã điền vào **Tri thức** của 9BizClaw, đúng doanh nghiệp. Khi xong, nhắn **Tôi đã hoàn tất** để tôi đọc lại và chuyển bước.

Không bắt hoàn thành cả mười file. Nhà sáng lập cần khi làm personal brand; Bán hàng và CSKH cần khi loại nội dung sử dụng dữ kiện tương ứng. Nếu khách muốn, AI hỗ trợ soạn bằng dữ liệu thật rồi xin xác nhận; không bịa USP, thành tích hay ưu đãi.

## 5. Nhận câu hoàn tất và đọc lại

Khách nhắn **Tôi đã hoàn tất**. Hệ thống nhớ đang chờ gì, tìm tài liệu mới/cập nhật, đọc nội dung đúng doanh nghiệp và kiểm lại những trường đang thiếu.

File đang lập chỉ mục hoặc chưa đọc được thì báo rõ, giữ tiến độ và cho cách tiếp tục. Còn thiếu một mục thì chỉ hỏi mục đó. Không quay lại bộ câu hỏi ban đầu. Câu báo hoàn tất là tín hiệu kiểm tra, không phải bằng chứng dữ liệu đã đủ.

## 6. Kiểm ảnh và chuẩn bị B-roll nhạc

Ảnh đúng người/sản phẩm đã ở Hình ảnh doanh nghiệp được dùng lại. Nếu thiếu, hướng dẫn khách tải ảnh chân dung, sản phẩm hoặc hoạt động của họ vào phần đó; không tạo thêm kho ảnh gốc bắt tải lại.

Hệ thống tạo các thư mục thuộc máy/workspace khách và trả **đường dẫn thật**:

- Video B-roll: clip công việc, hoạt động, sản phẩm, bối cảnh.
- Nhạc nền: các bản nhạc khách được phép dùng.
- Giọng đọc: file thu âm nếu chọn dùng giọng sẵn có.

Trong 9B desktop, trả đường dẫn và mở thư mục nếu host hỗ trợ. Trên điện thoại, dùng thư mục Drive của khách nếu họ chọn kết nối; đường dẫn ổ đĩa không phải link tải từ xa.

> Tôi đã tìm thấy ảnh của anh/chị. Nếu muốn làm video B-roll, hãy đặt clip vào thư mục Video B-roll bên dưới và nhạc vào thư mục Nhạc nền. Tải xong nhắn **Tôi đã hoàn tất**. Chưa có clip/nhạc vẫn có thể thử bài viết và ảnh.

Sau câu hoàn tất, quét lại file thực, định dạng, khả năng đọc và thời lượng khi cần. Thư mục đã tạo nhưng rỗng chưa được tính là có media. Chi tiết ở [Media và menu](MEDIA-VA-MENU.md).

## 7. Hiện menu ảnh để chọn content làm thử

Khi hồ sơ và tài nguyên cần thiết đã được kiểm, 9B gửi **một ảnh menu thật**, kèm số và tên lựa chọn:

| Số | Kiểu content |
|---|---|
| 1 | Bài viết |
| 2 | Bài kèm ảnh đơn |
| 3 | Ảnh cá nhân kèm câu quan điểm |
| 4 | Ảnh minh họa insight |
| 5 | Carousel hoặc album hướng dẫn |
| 6 | Infographic |
| 7 | Video B-roll có chữ |
| 8 | Video có giọng thuyết minh |
| 9 | Chuỗi bình luận |

Các ô có hình minh họa và một dòng dễ hiểu, thể hiện phần sẵn sàng và phần cần bổ sung theo dữ liệu/công cụ thật. Thiếu clip chỉ ảnh hưởng nhánh cần clip; không bắt tất cả khách nạp nhạc/voice để thử ảnh.

Khách trả lời:

> Chọn 5. Làm carousel sáu trang về ba lỗi khi tư vấn, dùng màu và ảnh tôi đã có.

AI phối hợp viết và media, kiểm file rồi trả bản mẫu. Chưa có chủ đề thì gợi ý vài chủ đề phù hợp để chọn. Menu ảnh là hướng dẫn chọn số/tên; không giả có nút bấm nếu host chưa hỗ trợ.

## 8. Duyệt mẫu và lưu lựa chọn

Khách xem bài và ảnh/video thật, góp ý rồi duyệt. “Từ nay dùng kiểu này” mới lưu phong cách lâu dài; sửa một bài không tự thay hồ sơ chung.

Không cần phát sinh một bước bắt nhập lại màu/font/giọng đã xác nhận trong Tri thức. Thông tin mới có thể được lưu thành tài liệu bổ sung theo yêu cầu khách và snapshot content có nguồn.

## 9. Sử dụng qua chat và ba trang tính

| Trang | Việc của khách |
|---|---|
| 00. Nguồn tham khảo | Thêm nguồn muốn nghiên cứu, bật/tắt và ghi chủ đề ưu tiên |
| 01. Ý tưởng | Xem và chọn ý muốn làm, thêm yêu cầu |
| 02. Bài viết & lịch đăng | Xem chữ/media, sửa, duyệt, chọn tài khoản/giờ và xem kết quả |

Hồ sơ nằm trong Tri thức 9B, không có tab Thiết lập. Đăng chỉ thực hiện cho đúng thành phẩm và phạm vi đã được khách duyệt; tải file tự đăng là lựa chọn khi chưa nối kênh. Google chưa nối vẫn làm bài mẫu trong chat/local, nối sau đối chiếu ID để tránh trùng.

## 10. Quay lại và tiếp tục

Lưu trạng thái onboarding: doanh nghiệp, nguồn đã đọc, trường thiếu, mẫu đã gửi, đang chờ Tri thức hay media và bước tiếp theo. Khách nhắn Tiếp tục/Tôi đã hoàn tất thì khôi phục đúng bước, đọc lại phần thay đổi.

Khi đổi chiến dịch, kiểm dữ kiện mới liên quan, không bắt hoàn thiện lại mọi hồ sơ.

**Tình trạng hiện tại:** đã tách mẫu và cập nhật đặc tả. Installer, tự kiểm Tri thức, gửi link theo thiếu, tạo thư mục máy khách, tiếp tục onboarding và menu ảnh cần được xây/kiểm trước khi công bố hoạt động.
