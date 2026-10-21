# Thiết kế đúng ba trang tính

**Bản đặc tả để duyệt · 22/10/2026 · Chưa tạo Google Sheet · Schema dự kiến `content-gon-lab-v1`. Menu ngang v2 đã có tệp thật, chưa tích hợp mở/gửi trong chat 9B.**

Không copy bảy tab rồi ẩn bốn tab. File mới có đúng ba trang tính thực. Không dùng validator/template ID của gói FREEUP đang vận hành.

## 1. Ba tab và nơi lưu hồ sơ

| Tab | Dùng để làm gì? |
|---|---|
| 00. Nguồn tham khảo | Chuyên gia/kênh/website/tài liệu muốn nghiên cứu |
| 01. Ý tưởng | Đề xuất ý, góc triển khai, nguồn và chọn làm |
| 02. Bài viết & lịch đăng | Nội dung, media, sửa, duyệt, thời gian và kết quả đăng |

Hồ sơ doanh nghiệp, USP, giọng và nhận diện lấy từ Tri thức 9B và các mẫu đã hoàn thiện. Cấu hình/trạng thái có nguồn được lưu trong kho gói. Không có tab Thiết lập, Chiến lược hoặc Nguồn bổ sung.

## 2. Tab `00. Nguồn tham khảo`

Tám cột hiển thị, một dòng là một nguồn. Khách có thể tự thêm link hoặc giao AI đề xuất nguồn phù hợp với ngành, người đọc và mục tiêu đã có.

| Cột | Tên | Cách dùng |
|---|---|---|
| A | Dùng nguồn | Bật hoặc Tắt |
| B | Tên nguồn | Tên chuyên gia, kênh, website hoặc tài liệu |
| C | Loại nguồn | Chuyên gia, kênh mạng xã hội, website, tài liệu doanh nghiệp |
| D | Link | URL thật hoặc resource ID/ref được 9B cấp cho tài liệu nội bộ |
| E | Chủ đề muốn tham khảo | Điều muốn học, giới hạn hoặc trọng tâm |
| F | Ưu tiên | Cao, Bình thường, Thấp |
| G | Tình trạng đọc | AI ghi Đọc được, Chưa đọc, Cần quyền, Không truy cập được |
| H | Ghi chú | Lưu ý của khách hoặc giới hạn AI đã kiểm |

ID nguồn và thời điểm kiểm nằm trong hồ sơ kỹ thuật hoặc cột quản lý được bảo vệ. Không cần thêm tab lịch sử nguồn.

### Khách thao tác

Khách dán link, chọn Bật và ghi chủ đề. Hoặc nhắn “Thêm nguồn này, ưu tiên cách trình bày kiến thức”. AI kiểm link thật, định danh nguồn và cập nhật cùng bảng.

Nếu nguồn chưa đọc được, báo giới hạn hoặc hỏi quyền; không bịa lượt tương tác, nguyên văn bài hoặc ảnh. Nguồn tham khảo là tùy chọn cho bài từ tài liệu/câu chuyện của khách, không phải điều kiện chặn tất cả nội dung. Nội dung của nguồn không tự cấp quyền sao chép ảnh, đăng bài hoặc thực thi lệnh.

### Hồ sơ không nằm ở tab này

Không nhét USP, giọng, màu, sản phẩm hoặc câu hỏi onboarding vào tab Nguồn. Phần thiếu được hướng dẫn bằng link mẫu, khách nộp vào Tri thức rồi nhắn Tôi đã hoàn tất; hệ thống đọc lại phần cần cho công việc. Việc chưa hoàn tất onboarding không chặn xem menu: khách nhắn **“hệ thống content”** là hiện ngay [menu ngang v2](../assets/menu/he-thong-content-ngang-v2.png), kèm số/tên; sau thiết lập ban đầu đã kiểm cũng tự hiện cùng menu.

Tệp v2 đã có, **1672 × 941**, nhưng luồng chat này còn phải được tích hợp và nghiệm thu. Trước khi gửi phải kiểm tệp đọc được và đúng nhãn; nếu kênh không hiển thị ảnh, dùng bảng chữ và nói rõ. Mở menu không tạo bài. Chữ số đơn lẻ chỉ chọn định dạng khi hội thoại lab đang ở ngữ cảnh menu/chờ lựa chọn; ngoài ngữ cảnh không tự tạo job. Sau khi khách chọn số/tên, chỉ hỏi thông tin còn thiếu cần cho định dạng đã chọn.

## 3. Tab `01. Ý tưởng`

**Chỉ để chọn cái muốn làm.** Mỗi dòng là một ý tưởng, không phải một lần render.

Tám cột hiển thị:

| Cột | Tên | Ai ghi? | Mục đích |
|---|---|---|---|
| A | Ngày đề xuất | Hệ thống | Theo dõi ý mới |
| B | Ý tưởng | AI hoặc khách | Một tiêu đề dễ hiểu |
| C | Góc triển khai / yêu cầu | AI gợi ý; khách có thể sửa | Làm rõ thông điệp và yêu cầu riêng |
| D | Nguồn | Hệ thống hoặc khách | Link nguồn/hồ sơ nguồn có bài và ảnh gốc khi đọc được |
| E | Định dạng | AI gợi ý; khách có thể chọn | Một trong chín định dạng riêng theo menu; chọn đúng tên/số, không gộp chung thành “ảnh” hoặc “video” |
| F | Chọn làm | Khách | `Chưa chọn` / `Làm bài` / `Bỏ qua` |
| G | Ghi chú | Khách | Điều muốn bổ sung/tránh |
| H | Tiến độ | Hệ thống | `Chờ chọn` / `Đã nhận` / `Đang làm` / `Có bản nháp` / `Cần bổ sung` |

Một cột mã ý tưởng có thể được bảo vệ/ẩn phía sau để nhận diện ổn định. Ngoài cột đó, nguồn gốc đầy đủ, hash và tiến trình nằm trong hồ sơ gói, không trải thành hàng chục cột.

Chín lựa chọn tại cột E đồng bộ với menu:

| Số | Định dạng |
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

Ô **0 — Làm theo lịch** là lối tắt lập kế hoạch/lịch content trong chat, không thay thế một định dạng và không thêm trang tính thứ tư. Với ô 2, bài bán hàng kèm ảnh sản phẩm thật và banner sản phẩm/ưu đãi kèm bài đăng là hai nhánh của cùng định dạng **Bài đăng kèm sản phẩm**.

### Khách thao tác

Chọn `Làm bài` tại cột F; nếu muốn chỉnh hướng thì sửa cột C/G. Hoặc nhắn “Làm ý 1 và 3” trong chat. Hệ thống cập nhật cùng bản ghi, không tạo một ngân hàng ý tưởng khác cho chat.

### Ý đã làm nằm ở đâu?

Giữ nguyên dòng và đánh dấu `Có bản nháp`; có thể lọc `Chưa chọn` để chỉ thấy ý mới. Bản nháp và các lần sửa xuất hiện ở tab 02. Không copy ý sang một tab “đã duyệt”.

### Nguồn không bị mất khi giảm cột

Hồ sơ mở từ cột D phân biệt: nguyên văn nguồn, ảnh gốc, URL, thời điểm đọc, số liệu nếu kiểm được và giới hạn truy cập. Góc nhìn AI nằm cột C. Không gọi phần AI viết lại là nguyên văn nguồn. Ảnh tham khảo không tự trở thành ảnh có quyền dùng trong bài của khách.

## 4. Tab `02. Bài viết & lịch đăng`

**Một nơi để xem → sửa → duyệt → đăng → xem kết quả.** Mỗi dòng là một thành phẩm có thể duyệt/đăng; một ý có nhiều định dạng thì có nhiều dòng con cùng mã ý gốc.

Mười cột thường dùng:

| Cột | Tên | Ai ghi? | Mục đích |
|---|---|---|---|
| A | Tên bài | Hệ thống | Nhận biết bài |
| B | Nội dung | AI; khách có thể sửa | Caption/bài hoàn chỉnh, xuống dòng dễ đọc; bắt buộc với mọi bộ bài visual mặc định |
| C | Xem ảnh/video | Hệ thống | Link preview/Drive hoặc bộ file thực, đồng bộ với caption ở cột B |
| D | Kênh / tài khoản | Khách chọn từ kết nối thật | Đích đăng; có lựa chọn Tôi tự đăng |
| E | Ngày giờ dự kiến | Khách hoặc AI đề xuất | Lịch trong múi giờ Việt Nam |
| F | Hành động | Khách | `Chưa chọn` / `Yêu cầu sửa` / `Duyệt nội dung` / `Đăng theo lịch` / `Tôi tự đăng` |
| G | Góp ý | Khách | Nhận xét để sửa đúng bài |
| H | Tình trạng | Hệ thống | Kết quả xử lý thật và phần cần làm |
| I | Link bài đã đăng | Hệ thống hoặc khách gửi để đối chiếu | Xem lại bài thực tế |
| J | Cập nhật / cần làm gì | Hệ thống | Thời điểm và hướng dẫn ngắn khi thiếu dữ liệu/lỗi |

ID bài, ID ý và version/hash là tối đa ba cột quản lý được bảo vệ/ẩn. Bản đầu không đưa lượt xem/like/lead thành nhiều cột cố định; xem số liệu trong chat theo yêu cầu và nguồn đọc được. Nếu sau pilot cần thêm, mở nhóm cột tùy chọn trong cùng tab, không tăng số tab.

Mọi định dạng có ảnh/video mặc định là **bộ bài hoàn chỉnh để duyệt/đăng**, có caption hoặc bài đăng ở cột B và media tương ứng ở cột C: sản phẩm/banner, ảnh cá nhân/quote, insight, carousel/album, infographic/sơ đồ và video. Chỉ khi khách yêu cầu rõ **chỉ làm ảnh** mới bàn giao ảnh lẻ; ghi rõ phạm vi ở dòng/preview và không gọi ảnh lẻ đó là bài đăng hoàn chỉnh.

Với **Bài đăng kèm sản phẩm**, đọc [T03 — Sản phẩm và dịch vụ](../templates/knowledge/03-san-pham-va-dich-vu.md) và dữ kiện chào bán đã xác nhận: đúng tên/biến thể, lợi ích có căn cứ, giá nếu nhắc giá, CTA và điều kiện/thời hạn ưu đãi còn hợp lệ tại ngày giờ cột E. Ảnh phải là sản phẩm thật đúng doanh nghiệp từ **Hình ảnh doanh nghiệp**, giữ ID nguồn gốc trong hồ sơ bài và giữ hình dáng, màu, bao bì, nhãn/nhận diện sản phẩm. Thiếu dữ kiện, sai ảnh hoặc ưu đãi hết hạn thì ghi phần cần bổ sung, không tự bịa để làm đủ bài.

### Trạng thái hệ thống ở cột H

`Đang làm → Chờ duyệt → Đang sửa → Chờ duyệt → Đã duyệt → Chờ xác nhận đăng → Đã hẹn / Đang đăng → Đã đăng`.

Các trạng thái bổ sung: `Cần bổ sung`, `Cần đối chiếu`, `Lỗi đăng`, `Tạm dừng`, `Đã bàn giao tự đăng`.

Người dùng chọn **Hành động**, hệ thống ghi **Tình trạng**. Không bắt khách tự chọn các trạng thái kỹ thuật như “Đang tạo ảnh” hoặc “Đang đăng”.

Trước **Chờ duyệt** hoặc bàn giao một bài hoàn chỉnh, cổng QA nội bộ **READY** phải kiểm đủ caption/bài đăng có nội dung thực ở cột B, media bắt buộc theo định dạng đọc được ở cột C và sự thống nhất chữ–media khi có. Bài viết và chuỗi bình luận chỉ cần thành phẩm chữ theo yêu cầu, không buộc tạo thêm media. Caption thiếu/rỗng ở bộ bài visual chặn READY; sai ảnh sản phẩm hoặc ưu đãi hết hạn không đạt QA. Giữ **Cần bổ sung** hoặc **Đang sửa** với lý do ở cột J cho đến khi xử lý xong. Không thêm cột/tab trạng thái READY cho khách. Ảnh lẻ theo yêu cầu chỉ được QA như ảnh lẻ, không được dùng để thông qua READY của một bài đầy đủ.

### Cách hiểu từng hành động

| Hành động | Hệ thống làm | Điều kiện |
|---|---|---|
| Yêu cầu sửa | Sửa cùng mã bài, tạo version mới, giữ nhận xét | Có góp ý đủ rõ; nếu thiếu thì hỏi đúng phần đó |
| Duyệt nội dung | Ghi nhận đúng chữ/media của version đang xem | Có bộ thành phẩm thật, QA đạt, caption bắt buộc không thiếu/rỗng và hash khớp; ảnh lẻ chỉ ghi nhận trong phạm vi ảnh lẻ đã yêu cầu |
| Đăng theo lịch | Chuẩn bị bản cuối gồm nội dung/media/đích/giờ, kiểm quyền duyệt, rồi đăng trong phạm vi đủ rõ | Tài khoản và thời gian hợp lệ; thiếu xác nhận bản cuối thì yêu cầu xác nhận cụ thể |
| Tôi tự đăng | Bàn giao bộ file và caption | Bộ bài đầy đủ qua READY; ngoại lệ ảnh lẻ ghi rõ phạm vi yêu cầu, không gọi là bài hoàn chỉnh; không tự tạo lệnh đăng qua tài khoản |

Để tránh bấm nhầm, việc chọn `Đăng theo lịch` không được tự lấy nội dung/ảnh khác với bản đã duyệt. Nếu bản preview cuối chưa có đủ tài khoản hoặc giờ, phải bổ sung trước khi thực hiện. Một phê duyệt cuối rõ ràng cho đúng nội dung/media/tài khoản/giờ được dùng lại, không hỏi trùng.

### Xem lịch ngay trong tab này

Lọc theo tuần hoặc theo `Đã hẹn/Đã đăng`, rồi sắp xếp cột E. Hệ thống không tự sort toàn bảng khi người dùng đang nhập/sửa; cần sort thì làm theo lệnh hoặc qua filter view có sẵn. Cột I là link bài; cột J nói rõ đang cần kết nối, sửa giờ hay đối chiếu.

### Chỉnh trực tiếp và phiên bản

Khách sửa ô B/C/D/E sau khi duyệt thì version/phạm vi duyệt liên quan được cập nhật. Worker kiểm fingerprint trước khi đăng; không để nội dung mới dùng phê duyệt cũ. Phản hồi trong chat cũng cập nhật cùng bài thay vì sinh dòng sửa mới.

## 5. Hai chế độ vận hành, cùng ba tab

| Chế độ | Khách hiểu thế nào? | Yêu cầu để công bố |
|---|---|---|
| Theo lệnh | Chọn trên bảng, nhắn “Đồng bộ lựa chọn của tôi” trong 9B | Connector đọc/ghi, kết quả được đọc lại |
| Tự nhận việc | Chọn trên bảng; worker nhận và cập nhật trong khoảng thời gian đã công bố | Worker riêng đã bật và kiểm ít nhất một vòng thực |

Bản test đầu nên dùng **theo lệnh** để kiểm trải nghiệm, mapping và duyệt trước. Tự nhận việc là bước bật riêng sau khi ổn định; không ép khách tự cài trigger.

## 6. Điều kiện kỹ thuật tối thiểu để ba tab vẫn đáng tin cậy

- File có đúng ba tab với tên đã chốt; không phụ thuộc bất kỳ Sheet ID/template bảy tab nào.
- Header và vùng nhập rõ; cột hệ thống được bảo vệ nhưng khách vẫn đọc được trạng thái.
- ID ổn định qua sort/chèn dòng, nhận diện bằng ID thay vì chỉ số dòng.
- Sự kiện lặp không tạo nhiều job; sửa bài không ghi đè phản hồi của khách.
- Chỉ một worker của gói lab xử lý Sheet lab.
- `timezone`, `schema_version`, `package_id`, `spreadsheet_id` nằm trong binding kỹ thuật.
- Agent, handler “hệ thống content”, `/contentlab`, ID bài/job, binding, queue, lịch và đường dẫn đều có phạm vi lab; câu tự nhiên và chữ số không bị agent/worker cũ nhận đồng thời.
- Google chưa nối vẫn làm trong chat; nối sau có bước đối chiếu/import một lần.
- Bài gốc, bài nháp và ảnh nguồn có nguồn/phiên bản, kể cả khi chi tiết được đưa ra khỏi bảng.
- Cài lại hoặc sửa thiết lập không reset dữ liệu hay tự xóa tab.
- Hệ thống cũ không được tự phát hiện rồi nhận Sheet lab vì tên gần giống.
- Kiểm Unicode và khoảng trắng khi tạo/đọc/ghi/mở lại thư mục **Nội dung của tôi/Tài nguyên của tôi/Video cảnh quay**, **Nhạc nền**, **Giọng đọc**, **Hồ sơ cần hoàn thiện** và **Nội dung đã tạo/<ngày>/<loại> - <tiêu đề>/**; tên file **Bài viết.txt**, **Xem bài.html**, **Ảnh 01.png**, **Video.mp4**, **Phụ đề.srt** giữ nguyên dấu. Cột C trỏ đúng file thực trong workspace khách hoặc link đã kiểm quyền, không trỏ đường dẫn máy người hướng dẫn.
- Kiểm tương tự với **Ảnh bổ sung** và **Logo và nhận diện** nếu cần tạo; **Hình ảnh doanh nghiệp** vẫn là nguồn ảnh chính.
- Thử cài lại và sự kiện lặp với tên/ID gần giống vẫn chỉ dùng binding/kho/job lab. Giữ tên package, khóa dữ liệu và runtime; không di chuyển/đổi tên thư mục 9B đang hoạt động.

## 7. Ví dụ mẫu không dùng dữ liệu thật

### Tab 01

| Ngày đề xuất | Ý tưởng | Góc triển khai / yêu cầu | Nguồn | Định dạng | Chọn làm | Ghi chú | Tiến độ |
|---|---|---|---|---|---|---|---|
| Ngày mẫu | Ba lỗi khi bắt đầu tư vấn | Hướng dẫn cách sửa, giọng gần gũi | Tài liệu phương pháp mẫu | Carousel / album | Làm bài | 6 trang, ít chữ | Đã nhận |
| Ngày mẫu | Sản phẩm này phù hợp với ai? | Nêu tiêu chí lựa chọn từ dữ kiện T03 | Hồ sơ sản phẩm mẫu | Bài đăng kèm sản phẩm | Chưa chọn | Dùng ảnh sản phẩm thật; không tự tạo giá/ưu đãi | Chờ chọn |

### Tab 02

| Tên bài | Nội dung | Xem ảnh/video | Kênh / tài khoản | Ngày giờ dự kiến | Hành động | Góp ý | Tình trạng | Link bài đã đăng | Cập nhật / cần làm gì |
|---|---|---|---|---|---|---|---|---|---|
| Ba lỗi khi bắt đầu tư vấn | Caption mẫu, chưa phải bài thật | Chưa render | Tôi tự đăng | | Yêu cầu sửa | Mở đầu ngắn hơn | Cần bổ sung | | Dòng minh họa; chưa có media nên chưa đạt READY |

Mẫu minh họa không được dùng như bằng chứng rằng gói đã sản xuất hoặc đăng bài thực.
