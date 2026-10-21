# Hành trình cài đặt và sử dụng Content Gọn

**Thiết kế cập nhật ngày 22/10/2026. Đã tạo và mở kiểm menu v2 thực, 1672 × 941, nhãn ô 2 đúng “Bài đăng kèm sản phẩm”. Các đoạn chat và tích hợp 9B dưới đây là trải nghiệm cần xây/kiểm.**

Khách có thể nhắn **“hệ thống content”** ở bất kỳ thời điểm nào trong chat 9B để mở ngay ảnh menu ngang và chọn số/tên. Không dùng việc chưa hoàn tất thiết lập để chặn xem menu. Chỉ sau khi khách chọn định dạng mới hỏi phần còn thiếu cần cho công việc đó; mở menu không tự sản xuất nội dung.

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

## 6. Kiểm ảnh và chuẩn bị tài nguyên

Ảnh đúng người/sản phẩm đã ở Hình ảnh doanh nghiệp được dùng lại. Nếu thiếu, hướng dẫn khách tải ảnh chân dung, sản phẩm hoặc hoạt động của họ vào phần đó; không tạo thêm kho ảnh gốc bắt tải lại.

Sau cài, hệ thống tạo các thư mục thuộc máy/workspace khách, dùng tên tiếng Việt và trả **đường dẫn thật**:

```text
<workspace khách>/Nội dung của tôi/
  Tài nguyên của tôi/
    Video cảnh quay/
    Nhạc nền/
    Giọng đọc/
    Ảnh bổ sung/                 (tùy chọn)
    Logo và nhận diện/           (khi cần)
  Hồ sơ cần hoàn thiện/
  Nội dung đã tạo/
    <ngày>/<loại> - <tiêu đề>/
```

**Video cảnh quay** chứa clip công việc, hoạt động, sản phẩm và bối cảnh. **Nhạc nền** chứa nhạc khách được phép dùng; **Giọng đọc** chứa file thu âm nếu chọn giọng sẵn có. **Ảnh bổ sung** và **Logo và nhận diện** chỉ bổ sung khi cần; **Hình ảnh doanh nghiệp** trong 9B vẫn là nguồn ảnh chính. **Hồ sơ cần hoàn thiện** giữ mẫu/bản đang điền, sau đó khách đưa tài liệu hoàn thiện vào **Tri thức**.

Cấu trúc trên là đặc tả, chưa phải thư mục đã được tạo. Chỉ sau khi cài, xác định đúng workspace và kiểm tồn tại mới gửi đường dẫn tuyệt đối thật cho khách; không dùng đường dẫn ổ D: của người hướng dẫn hoặc giữ nguyên biến `<workspace khách>` trong kết quả.

Trong 9B desktop, trả đường dẫn và mở thư mục nếu host hỗ trợ. Trên điện thoại, dùng thư mục Drive của khách nếu họ chọn kết nối; đường dẫn ổ đĩa không phải link tải từ xa.

> Tôi đã tìm thấy ảnh của anh/chị. Nếu muốn làm video cảnh quay có chữ, hãy đặt clip vào thư mục **Video cảnh quay** bên dưới và nhạc vào **Nhạc nền** nếu muốn dùng nhạc. Tải xong nhắn **Tôi đã hoàn tất**. Chưa có clip/nhạc vẫn có thể thử bài viết và ảnh.

Sau câu hoàn tất, quét lại file thực, định dạng, khả năng đọc và thời lượng khi cần. Thư mục đã tạo nhưng rỗng chưa được tính là có media. Chi tiết ở [Media và menu](MEDIA-VA-MENU.md).

## 7. Mở menu ngang và chọn content làm thử

Khi thiết lập ban đầu đã được kiểm, 9B tự gửi **ảnh menu ngang thật đã kiểm**. Khi khách chủ động nhắn **“hệ thống content”**, 9B cũng gửi ngay chính menu này, kể cả lúc onboarding còn thiếu. Menu dùng logo FreeUp và linh vật cáo Mía đã được chọn; tệp đích cho bản cập nhật là [he-thong-content-ngang-v2.png](../assets/menu/he-thong-content-ngang-v2.png). Chỉ gửi sau khi v2 tồn tại, mở đọc được và đã kiểm nhãn ô 2 là **“Bài đăng kèm sản phẩm”**, đủ chín định dạng như bảng dưới. V1 là bản nháp 1672 × 941 có nhãn ô 2 cũ, không dùng cho đặc tả mới. Nếu v2 chưa sẵn sàng, nói rõ chưa gửi được ảnh và dùng bảng chữ đúng nhãn để khách chọn, không nhận là đã gửi ảnh v2. Luồng gửi trong chat chưa được cài đặt/kiểm chứng.

Giữ đủ **chín định dạng riêng**, kèm số và tên để chọn:

| Số | Kiểu content |
|---|---|
| 1 | Bài viết |
| 2 | Bài đăng kèm sản phẩm |
| 3 | Ảnh cá nhân + quan điểm |
| 4 | Ảnh minh họa insight |
| 5 | Carousel / album |
| 6 | Infographic / sơ đồ |
| 7 | Video B-roll có chữ |
| 8 | Video có giọng đọc |
| 9 | Chuỗi bình luận |

**0 — Làm theo lịch** là lối tắt bổ sung bên cạnh chín định dạng. Không gộp ô 1–9, không tính lối tắt này thành một định dạng thay thế.

Các ô có hình minh họa và tên dễ hiểu. Trạng thái sẵn sàng/cần bổ sung được ghi thêm trong chat theo dữ liệu và công cụ thực. Dùng lại tệp ảnh menu; không tạo một ảnh mới mỗi lần khách mở. Phải gửi ảnh thực hoặc asset ID có thể hiển thị, kèm danh sách chữ; nếu kênh không hỗ trợ ảnh thì dùng chữ và nói rõ giới hạn đó.

Mở menu không tự tạo nội dung. Khách chọn số hoặc tên rồi hệ thống bắt đầu đúng nhánh, kiểm nguồn đã có và chỉ hỏi phần thiếu cần cho nhánh đó. Không chờ khách hoàn thành mọi hồ sơ, clip, nhạc hay giọng đọc để thử bài viết/ảnh. Chữ số đơn lẻ chỉ có nghĩa là lựa chọn khi hội thoại đang ở ngữ cảnh menu hoặc đang chờ chọn định dạng; không tự kích hoạt sản xuất từ một chữ số ngoài ngữ cảnh.

Khách trả lời:

> Chọn 5. Làm carousel sáu trang về ba lỗi khi tư vấn, dùng màu và ảnh tôi đã có.

AI giữ lựa chọn 5, chỉ hỏi chủ đề/dữ kiện còn thiếu cho carousel, phối hợp viết và media, kiểm file rồi trả bản mẫu. Chưa có chủ đề thì gợi ý vài chủ đề phù hợp để chọn. Menu ảnh là hướng dẫn chọn số/tên; không giả có nút bấm nếu host chưa hỗ trợ.

Nếu khách chọn **2 — Bài đăng kèm sản phẩm**, tiếp tục theo yêu cầu thành **bài bán hàng kèm ảnh sản phẩm** hoặc **banner sản phẩm/ưu đãi kèm bài đăng**. Chỉ hỏi chọn nhánh khi yêu cầu chưa rõ; đây là hai cách làm trong cùng ô 2. Dùng ảnh sản phẩm thật của khách từ **Hình ảnh doanh nghiệp**, đúng doanh nghiệp/biến thể và giữ ID nguồn gốc. Ảnh thành phẩm phải giữ đúng hình dáng, màu, bao bì, nhãn và nhận diện sản phẩm; không tự thay bằng sản phẩm tưởng tượng.

Đọc [T03 — Sản phẩm và dịch vụ](../templates/knowledge/03-san-pham-va-dich-vu.md) cùng dữ kiện chào bán đã xác nhận để kiểm tên, lợi ích có căn cứ, giá nếu bài nhắc giá và CTA. Với ưu đãi, kiểm điều kiện và thời hạn còn hợp lệ tại ngày đăng dự kiến; thiếu thông tin hoặc hết hạn thì hỏi đúng phần đó. Không tự bịa giá, công dụng, cam kết kết quả, ưu đãi hay hạn chót.

Mặc định, **mọi định dạng có hình/video đều là bộ bài hoàn chỉnh để duyệt và đăng**, gồm caption/bài đăng phù hợp và media tương ứng: bài sản phẩm/banner, ảnh cá nhân kèm góc nhìn/quote, ảnh insight, carousel/album, infographic/sơ đồ và video. Chữ với media phải cùng thông điệp và dữ kiện. Chỉ khi khách nói rõ **chỉ làm ảnh** mới tạo tác vụ ảnh lẻ riêng; không dùng nhánh này để bỏ qua kiểm tra caption của bài đăng hoàn chỉnh.

## 8. Duyệt mẫu và lưu lựa chọn

Khách xem bài và ảnh/video thật, góp ý rồi duyệt. “Từ nay dùng kiểu này” mới lưu phong cách lâu dài; sửa một bài không tự thay hồ sơ chung.

Giao thành phẩm tại **Nội dung của tôi/Nội dung đã tạo/<ngày>/<loại> - <tiêu đề>/** bằng file phù hợp: **Bài viết.txt**, **Xem bài.html**, **Ảnh 01.png**, **Video.mp4**, **Phụ đề.srt**. Với nhánh có hình/video, mặc định luôn có caption/bài đăng trong **Bài viết.txt**, media phù hợp và bản **Xem bài.html** để duyệt trọn bài. Ngoại lệ ảnh lẻ chỉ áp dụng theo yêu cầu rõ ràng của khách. Chỉ giao những file đã tạo và kiểm được cho định dạng đó, kèm đường dẫn thực trên máy khách hoặc link đã kiểm quyền.

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

Tên thư mục tiếng Việt áp dụng cho phần khách nhìn thấy trong đặc tả. Tên package, khóa dữ liệu, script, database, runtime và `node_modules` giữ nguyên; kho hệ thống `freeup-content-gon-lab-data` có thể nằm riêng. Chưa di chuyển hay đổi tên thư mục 9B đang hoạt động.

**Tình trạng hiện tại:** đã tách mẫu và cập nhật đặc tả; v2 đã được tạo và mở kiểm đúng nhãn; v1 là ảnh nháp có nhãn ô 2 cũ. Installer, tự kiểm Tri thức, gửi link theo thiếu, tạo thư mục máy khách, tiếp tục onboarding và tích hợp mở/gửi menu trong chat 9B còn cần được xây/kiểm trước khi công bố hoạt động. Thay đổi hiện tại chỉ ở đặc tả, không sửa skill/runtime.
