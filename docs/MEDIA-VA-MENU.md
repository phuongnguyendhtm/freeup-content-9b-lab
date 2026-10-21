# Ảnh, tài nguyên và menu hệ thống content

> Bản thiết kế được lưu để đối chiếu. **Bản chạy hiện tại:** [Báo cáo 0.1.0](BAN-THU-0.1.0.md) · [Hướng dẫn khách hàng](HUONG-DAN-KHACH-HANG.md). Các trạng thái “chưa xây/cài” trong bản thiết kế mô tả thời điểm duyệt ban đầu.

**Đặc tả cập nhật ngày 22/10/2026. Đã tạo và mở kiểm menu v2 thực, 1672 × 941, nhãn ô 2 đúng “Bài đăng kèm sản phẩm”. Tích hợp hiển thị trong chat 9B và việc tạo thư mục trên máy khách chưa được cài đặt/kiểm chứng.**

## Ảnh trong Hình ảnh doanh nghiệp

Tìm ảnh đúng doanh nghiệp và vai trò: logo, người sáng lập, sản phẩm, hoạt động. Mở/đọc metadata cần thiết để chọn đúng người và ảnh. Nếu có thì dùng ID gốc; không yêu cầu tải lại và không nhập lại vì khách gửi cùng ảnh lần nữa.

Thiếu ảnh thì hướng dẫn vào **Hình ảnh doanh nghiệp** trong 9B, tải ảnh của họ và ghi mô tả dễ tìm. Chân dung nên rõ mặt; sản phẩm đúng biến thể; ảnh hoạt động có bối cảnh phù hợp. Chỉ hỏi đúng loại ảnh thiếu cho công việc.

## Thư mục khách nhìn thấy

Sau cài, tạo trong workspace của chính khách với tên thư mục tiếng Việt:

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
    <ngày>/
      <loại> - <tiêu đề>/
        Bài viết.txt
        Xem bài.html
        Ảnh 01.png
        Video.mp4
        Phụ đề.srt
```

Đây là cấu trúc tên hiển thị và đường dẫn logic trong đặc tả, không phải các thư mục đã tạo. Chỉ tạo file thành phẩm phù hợp với định dạng thực tế; một bài viết không cần có đủ ảnh, video và phụ đề. Với định dạng có hình/video, bộ giao mặc định gồm **Bài viết.txt** chứa caption/bài đăng đi kèm và media phù hợp, cùng **Xem bài.html** để xem trọn bài. **Hồ sơ cần hoàn thiện** giữ bản mẫu/bản khách đang điền; tài liệu hoàn thiện vẫn đưa vào **Tri thức** đúng doanh nghiệp trong 9B.

Khi chạy sau cài đặt, phải xác định workspace khách, tạo và kiểm tồn tại rồi mới trả đường dẫn tuyệt đối thật. Không gửi đường dẫn ổ D: của người hướng dẫn, đường dẫn máy người tặng hoặc chuỗi `<workspace khách>` như kết quả đã tạo. Với thành phẩm, trả file thực và đường dẫn thư mục tương ứng để khách mở lại.

- **Video cảnh quay:** clip công việc, hoạt động, sản phẩm, cảnh minh họa của doanh nghiệp.
- **Nhạc nền:** nhạc được phép dùng trong nội dung của khách.
- **Giọng đọc:** thu âm của khách nếu họ muốn dùng giọng sẵn có.
- **Ảnh bổ sung:** ảnh bổ trợ khi cần; không thay kho **Hình ảnh doanh nghiệp** đang có trong 9B.
- **Logo và nhận diện:** tài nguyên nhận diện bổ sung khi công việc cần và chưa lấy được từ nguồn đã xác nhận.

Tên package, khóa dữ liệu, script, database, runtime và `node_modules` giữ nguyên. Kho hệ thống `freeup-content-gon-lab-data` có thể nằm riêng. Thay đổi này chỉ cập nhật đặc tả tên khách nhìn thấy; chưa di chuyển hoặc đổi tên thư mục 9B đang hoạt động.

Ảnh nguồn tiếp tục ở Hình ảnh doanh nghiệp. Không giả định thư viện đó đã hỗ trợ video/audio; chỉ tích hợp khi capability/schema thực được kiểm.

Thông điệp sau khi tạo:

> Đây là thư mục **Video cảnh quay**, **Nhạc nền** và **Giọng đọc** trên máy anh/chị. Mở đường dẫn bên dưới và thả những file anh/chị muốn dùng vào đúng thư mục. Xong nhắn **Tôi đã hoàn tất** để tôi kiểm tra.

Đường dẫn local dùng trên máy chạy 9B. Khi khách làm từ điện thoại, có thể tạo thư mục Drive thuộc tài khoản họ nếu họ chọn dùng Google; trả link có quyền tải lên phù hợp và kiểm quyền thực. Không chia sẻ công khai thư mục doanh nghiệp để giải quyết lỗi truy cập.

## Kiểm file thực

Quét danh sách file theo thư mục; kiểm loại file bằng metadata/nội dung phù hợp, khả năng đọc, thời lượng và âm thanh đối với clip. File cloud chưa đồng bộ về máy hoặc shortcut chưa tải không được coi là clip sẵn sàng. Giữ metadata nguồn, brand, loại tài nguyên và tình trạng quyền dùng.

Nếu chỉ có B-roll mà không có nhạc, cho lựa chọn video không nhạc. Nếu chưa có voice thì chỉ nhánh voice chờ cấu hình/thu âm. Không bịa là đã render nếu chỉ có kịch bản hoặc receipt trống.

## Menu ảnh ngang trong chat 9B

Tệp đích cho menu cập nhật là [assets/menu/he-thong-content-ngang-v2.png](../assets/menu/he-thong-content-ngang-v2.png), bố cục ngang, dùng logo FreeUp và đúng linh vật cáo Mía đã được chọn. **Chỉ gửi như ảnh menu thực sau khi tệp v2 tồn tại, mở đọc được và đã kiểm nhãn ô 2 là “Bài đăng kèm sản phẩm”, đủ chín định dạng theo bảng dưới.** Bản nháp v1 kích thước 1672 × 941 có nhãn ô 2 cũ, không dùng làm menu cho đặc tả mới. Có ảnh để duyệt chưa phải bằng chứng menu đã được tích hợp/cài vào chat 9B.

Giữ riêng **chín định dạng**, mỗi ô có số, tên và minh họa; không gộp các kiểu ảnh hoặc video thành một lựa chọn chung:

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

**0 — Làm theo lịch** là lối tắt riêng bên cạnh chín định dạng, không thay thế hay gộp bất kỳ ô 1–9 nào.

Thiết kế menu là tài sản hướng dẫn của quà tặng; bài thật dùng nhận diện khách. Không dùng chân dung/ảnh riêng của người tặng làm tài nguyên mặc định cho học viên.

Mỗi định dạng có hình/video mặc định tạo **một bộ bài hoàn chỉnh để khách duyệt và đăng**: ảnh cá nhân kèm góc nhìn/quote, ảnh insight, carousel/album, infographic/sơ đồ, video và bài kèm sản phẩm/banner đều có caption hoặc bài đăng phù hợp đi cùng media. Nội dung chữ và media phải thống nhất thông điệp, sản phẩm, ưu đãi và lời kêu gọi hành động nếu dùng. Chỉ khi khách nói rõ **chỉ làm ảnh** mới tạo tác vụ ảnh lẻ riêng; không dùng nhánh này để bỏ qua kiểm tra caption của bài đăng hoàn chỉnh.

## Mở menu và hiểu lựa chọn

Khi khách nhắn **“hệ thống content”** trong chat 9B, hiển thị ngay **ảnh menu ngang v2 thực đã kiểm** ở trên, kèm danh sách số/tên và lời mời chọn. Lệnh mở menu hoạt động cả khi khách chưa hoàn tất thiết lập. Sau khi thiết lập ban đầu được kiểm xong, hệ thống cũng tự hiển thị chính menu này để khách bắt đầu. Nếu tệp v2 chưa có hoặc chưa đọc được, nói rõ chưa gửi được ảnh và dùng bảng chữ đúng nhãn để khách vẫn chọn được; không gửi v1 như menu cập nhật hoặc nhận là đã gửi ảnh v2.

> Anh/chị chọn số **1–9** hoặc gọi tên kiểu content muốn làm. Chọn **0** nếu muốn lập kế hoạch/lịch content. Sau khi anh/chị chọn, tôi sẽ hỏi đúng phần còn thiếu để bắt đầu.

Ảnh menu tĩnh dùng chung, không tạo ảnh mới mỗi lần mở. Chat có thể bổ sung trạng thái theo dữ liệu/công cụ thực của từng khách. Gửi tệp ảnh thực hoặc asset ID có thể hiển thị; danh sách chữ là phần hỗ trợ và là phương án dự phòng nếu kênh không hỗ trợ ảnh, không được gọi là đã gửi ảnh khi chỉ có chữ.

Mở menu chỉ để xem và chọn, **không tự tạo bài, ảnh hay video**. Một chữ số đơn lẻ chỉ được diễn giải là lựa chọn khi hội thoại đang ở ngữ cảnh menu hoặc đang chờ chọn định dạng; ngoài ngữ cảnh đó không tự kích hoạt sản xuất. Tên định dạng hoặc câu như “Chọn 7” được đối chiếu theo đúng bảng trên.

Ảnh là bảng chọn bằng số/tên trong chat. Chỉ gọi là nút bấm nếu host thực có thành phần tương tác. Tình trạng chưa sẵn sàng ghi rõ cần thêm gì; không che các lựa chọn chữ/ảnh chỉ vì video thiếu clip.

## Chọn và sản xuất thử

Ví dụ: “Chọn 7, video B-roll 20 giây về buổi làm việc, dùng clip tôi đã nạp và nhạc nhẹ.”

Sau khi khách chọn, bắt đầu đúng nhánh, đọc dữ liệu đã có và chỉ hỏi những thông tin/tài nguyên còn thiếu cần cho định dạng đó. Không buộc hoàn tất toàn bộ onboarding, mười mẫu Tri thức hoặc đủ clip/nhạc/giọng đọc trước khi làm bài viết hay ảnh. Thiếu chủ đề thì đề xuất vài chủ đề; thiếu tài nguyên thì quay đúng bước cần bổ sung, giữ lựa chọn đang làm.

Với **lựa chọn 2 — Bài đăng kèm sản phẩm**, dùng ảnh sản phẩm thật và thông tin chào bán của chính khách. Nhận diện yêu cầu để đi vào một trong hai nhánh: **bài bán hàng kèm ảnh sản phẩm** hoặc **banner sản phẩm/ưu đãi kèm bài đăng**. Nếu khách chưa nói rõ, chỉ hỏi muốn làm nhánh nào; hai nhánh vẫn thuộc ô 2, không thêm hay gộp định dạng khác.

Đối chiếu [T03 — Sản phẩm và dịch vụ](../templates/knowledge/03-san-pham-va-dich-vu.md) và nguồn đã được khách xác nhận: đúng tên/biến thể, lợi ích có căn cứ, giá nếu nội dung nhắc giá, CTA và điều kiện ưu đãi. Nếu có khuyến mãi, kiểm ngày bắt đầu/kết thúc còn phù hợp ngày đăng dự kiến; thiếu hoặc hết hạn thì hỏi lại, không tự bịa giá, công dụng, thành tích, ưu đãi hay hạn chót. Chỉ hỏi dữ kiện còn thiếu cho bài đang làm.

Lấy ảnh sản phẩm từ **Hình ảnh doanh nghiệp** đúng doanh nghiệp, giữ **ID nguồn gốc** và truy vết ảnh đã dùng. Nếu chưa có ảnh đúng sản phẩm/biến thể, hướng dẫn bổ sung đúng ảnh đó. Giữ hình dáng, màu sắc, bao bì, nhãn và nhận diện của sản phẩm thật; không biến đổi thành sản phẩm khác hoặc tự tạo chi tiết sản phẩm chưa có căn cứ.

Khi đủ dữ liệu cho nhánh đã chọn, viết caption/bài đăng, tạo media đi kèm khi cần, kiểm đồng bộ chữ–media và file thật rồi giao bộ bài trong **Nội dung đã tạo/<ngày>/<loại> - <tiêu đề>/**. Với video, giao cả caption/bài đăng phù hợp cùng video và phụ đề nếu có; không coi chỉ có kịch bản là video hoàn chỉnh. Sau mẫu, lưu sở thích lâu dài chỉ khi khách yêu cầu.
