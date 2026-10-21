# Chuẩn bị ảnh B-roll nhạc và menu content

**Đặc tả trải nghiệm và dữ liệu, chưa tạo thư mục trên máy khách hoặc ảnh menu thực.**

## Ảnh trong Hình ảnh doanh nghiệp

Tìm ảnh đúng doanh nghiệp và vai trò: logo, người sáng lập, sản phẩm, hoạt động. Mở/đọc metadata cần thiết để chọn đúng người và ảnh. Nếu có thì dùng ID gốc; không yêu cầu tải lại và không nhập lại vì khách gửi cùng ảnh lần nữa.

Thiếu ảnh thì hướng dẫn vào **Hình ảnh doanh nghiệp** trong 9B, tải ảnh của họ và ghi mô tả dễ tìm. Chân dung nên rõ mặt; sản phẩm đúng biến thể; ảnh hoạt động có bối cảnh phù hợp. Chỉ hỏi đúng loại ảnh thiếu cho công việc.

## Thư mục B-roll và âm thanh

Sau cài, tạo ở kho riêng trong workspace của chính khách:

```text
<workspace khách>/freeup-content-gon-lab-data/media-input/
  broll/
  music/
  voice/
```

Đây là cấu trúc đề xuất, không phải đường dẫn có thể gửi nguyên văn cho khách. Khi chạy phải resolver sang đường dẫn tuyệt đối thật, tạo và kiểm tồn tại trước khi gửi. Không dùng đường dẫn máy người tặng hay chuỗi <workspace khách> làm kết quả đã tạo.

- broll: video công việc, hoạt động, sản phẩm, cảnh minh họa của doanh nghiệp.
- music: nhạc nền được phép dùng trong nội dung của khách.
- voice: thu âm của khách nếu họ muốn dùng giọng sẵn có.

Ảnh nguồn tiếp tục ở Hình ảnh doanh nghiệp. Không giả định thư viện đó đã hỗ trợ video/audio; chỉ tích hợp khi capability/schema thực được kiểm.

Thông điệp sau khi tạo:

> Đây là thư mục **Video B-roll** và **Nhạc nền** trên máy anh/chị. Mở đường dẫn bên dưới và thả file vào đúng thư mục. Xong nhắn **Tôi đã hoàn tất** để tôi kiểm tra.

Đường dẫn local dùng trên máy chạy 9B. Khi khách làm từ điện thoại, có thể tạo thư mục Drive thuộc tài khoản họ nếu họ chọn dùng Google; trả link có quyền tải lên phù hợp và kiểm quyền thực. Không chia sẻ công khai thư mục doanh nghiệp để giải quyết lỗi truy cập.

## Kiểm file thực

Quét danh sách file theo thư mục; kiểm loại file bằng metadata/nội dung phù hợp, khả năng đọc, thời lượng và âm thanh đối với clip. File cloud chưa đồng bộ về máy hoặc shortcut chưa tải không được coi là clip sẵn sàng. Giữ metadata nguồn, brand, loại tài nguyên và tình trạng quyền dùng.

Nếu chỉ có B-roll mà không có nhạc, cho lựa chọn video không nhạc. Nếu chưa có voice thì chỉ nhánh voice chờ cấu hình/thu âm. Không bịa là đã render nếu chỉ có kịch bản hoặc receipt trống.

## Menu ảnh sau thiết lập

Một ảnh menu có chín ô, mỗi ô gồm số, tên, ví dụ trực quan và trạng thái theo công cụ/nguồn đang có:

1. Bài viết.
2. Bài kèm ảnh đơn.
3. Ảnh cá nhân kèm câu quan điểm.
4. Ảnh minh họa insight.
5. Carousel hoặc album hướng dẫn.
6. Infographic.
7. Video B-roll có chữ.
8. Video có giọng thuyết minh.
9. Chuỗi bình luận.

Thiết kế menu là tài sản hướng dẫn của quà tặng; bài thật dùng nhận diện khách. Không dùng chân dung/ảnh riêng của người tặng làm tài nguyên mặc định cho học viên.

Ảnh menu tĩnh có thể dùng chung, kèm chú thích trạng thái trong chat cho từng khách; không cần tốn lượt tạo ảnh mới mỗi lần mở. Gửi tệp ảnh thực hoặc asset ID có thể hiển thị, kèm danh sách chữ để vẫn dùng được nếu kênh không hỗ trợ ảnh.

Ảnh là bảng chọn bằng số/tên trong chat. Chỉ gọi là nút bấm nếu host thực có thành phần tương tác. Tình trạng chưa sẵn sàng ghi rõ cần thêm gì; không che các lựa chọn chữ/ảnh chỉ vì video thiếu clip.

## Chọn và sản xuất thử

Ví dụ: “Chọn 7, video B-roll 20 giây về buổi làm việc, dùng clip tôi đã nạp và nhạc nhẹ.”

Đọc yêu cầu, kiểm hồ sơ/clip/nhạc thực, viết thông điệp, render và QA rồi giao file thật. Thiếu chủ đề thì đề xuất vài chủ đề; thiếu tài nguyên thì quay đúng bước cần bổ sung, giữ phong cách và lựa chọn. Sau mẫu, lưu sở thích lâu dài chỉ khi khách yêu cầu.
