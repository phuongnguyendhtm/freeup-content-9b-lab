# Bản thử FreeUp Content Gọn 0.1.0

**Ngày kiểm: 22/10/2026.** Đây là bản đã có mã thực thi và bộ cài, phát triển tách khỏi FreeUp Content đang vận hành. Các tài liệu kế hoạch trước đó được giữ làm lịch sử thiết kế.

## Những phần đã hoàn thành

| Phần | Kết quả |
|---|---|
| Skill và điểm gọi | Native skill **contentlab**, lệnh **/contentlab**, nhận câu **hệ thống content** |
| Menu | PNG ngang v2 có Mía, chín định dạng và lối tắt lịch; mục 2 là bài đăng kèm sản phẩm |
| Cài/nâng cấp | Kiểm inventory/hash, giữ dữ liệu, cài lại idempotent, backup và rollback; xử lý thư mục đang được Windows giữ |
| Kích hoạt 9B | Native CLI thêm đúng skill cho đúng agent; ghi có kiểm tra giá trị cũ, không thay defaults/agent khác |
| Kiểm hồ sơ | Snapshot có nguồn/trích dẫn, chỉ hỏi thiếu, tách mẫu tương ứng, lưu trạng thái và đọc lại sau hoàn tất |
| Tài nguyên | Ảnh native giữ ID nguồn; clip/nhạc/giọng ở thư mục tiếng Việt; kiểm file thực và từ chối file giả đuôi |
| Sản xuất | Chín định dạng, job/idea ID, chống trùng, caption bắt buộc, nguồn và dữ kiện sản phẩm/ưu đãi |
| Duyệt/bàn giao | QA, hash nội dung/media, sửa làm mất duyệt cũ; xuất bản xem trước và file tiếng Việt |
| Render | Ảnh PNG, carousel, banner và MP4 B-roll/giọng đọc/phụ đề thực; không coi HTML hoặc kịch bản là thành phẩm |
| Chuẩn bị renderer | Tự chuẩn bị npm khi cần, Puppeteer-core/FFmpeg trong runtime riêng; kiểm browser, PNG và FFmpeg |
| Ba trang tính | Schema/mẫu XLSX, binding, đọc lựa chọn, ID ổn định và queue chống trùng; không Apps Script khách phải deploy |
| Tài liệu | Câu nhận quà, hướng dẫn khách, hướng dẫn cài/kích hoạt/nâng cấp và bộ mười mẫu |

## Bằng chứng kiểm thử

**104 kiểm thử đạt, 0 lỗi, 0 bỏ qua** trên Windows, Node 24 của bản 9B đang kiểm. Các nhóm:

- Cài mới/cài lại/nâng cấp, giữ dữ liệu, file bị khóa, rollback khi thay file hoặc ghi receipt lỗi, kiểm gói giải nén.
- Chỉ kích hoạt agent mục tiêu; từ chối sai workspace, sai dấu sở hữu, thay đổi đồng thời hoặc thay cấu hình ngoài phạm vi.
- Hồ sơ đã đủ, thiếu một trường, dữ kiện sai doanh nghiệp, placeholder, xung đột và snapshot cũ; mẫu có tên tiếng Việt, không ghi đè bản khách đã điền.
- Menu trước onboarding, chọn số đúng phiên, tên tiếng Việt viết hoa, không tự tạo job khi mở menu.
- Caption thiếu, ảnh sản phẩm sai nguồn, giá thiếu căn cứ, ưu đãi hết hạn, chỉnh ảnh/chữ sau duyệt, tạo trùng theo sự kiện.
- PNG thật từ browser, banner dùng ảnh nguồn, carousel đúng thứ tự, MP4 có hình/giọng và phụ đề được FFmpeg giải mã.
- Các đường dẫn có dấu/khoảng trắng, chặn junction dẫn khỏi workspace, timestamp Sheet trong tương lai và ngày xuất theo múi giờ Việt Nam.
- Tự chuẩn bị renderer, kiểm checksum/tar an toàn và không báo ready nếu browser/FFmpeg chưa chạy được.

Kiểm thử render dùng bộ phụ thuộc được helper tự tải và kiểm trên kho lab; không phụ thuộc thư mục hay browser cache của bộ quà tặng cũ. Fixture là dữ liệu thử riêng, không phải hồ sơ/ảnh khách và không có trong ZIP phân phối.

## Đã thử trên 9B thật

Đã tạo agent **content-gon-test**, workspace riêng, không gắn kênh hoặc đổi agent mặc định. Gói cài có receipt/inventory được kiểm; native allowlist chỉ thêm **contentlab** cho agent này.

Trong phiên 9B mới, gửi **hệ thống content** đã nạp đúng skill, chạy helper và trả một payload có **mediaUrl trỏ tới PNG menu thật**. Kiểm này xác nhận định tuyến và attachment của backend; không thay cho kiểm giao diện từng kênh bên ngoài.

Tiếp tục chọn bài viết trong cùng phiên: agent đã tìm/đọc **sáu tài liệu Tri thức**, dùng hồ sơ hiện có, không bắt điền mẫu khi đã đủ dữ kiện cho bài được giao; tạo bản nháp, QA và xuất **Bài viết.txt** cùng **Xem bài.html** thành attachment. Các dữ kiện thương mại còn chờ xác nhận được loại khỏi bài. Đây là thử thật qua model và công cụ 9B, không phải chỉ chạy fixture. Bài chưa đăng.

Helper chuẩn bị renderer đã chạy thật: tải phụ thuộc đã ghim phiên bản, mở Chrome/Edge được chọn, tạo PNG và kiểm FFmpeg. `doctor` nhận cả renderer PNG và FFmpeg sau đó. Không sao chép credential hoặc cấu hình model từ agent khác.

## Google Sheet mẫu

Đã tạo một Google Sheet thử mới của chủ sản phẩm, đúng ba tab theo thứ tự, có native table/dropdown, cột mã được ẩn/cảnh báo sửa và múi giờ Việt Nam. Đã đọc lại metadata/headers và kiểm bằng giao diện Google Sheets. File này tách khỏi Sheet tham khảo và bộ bảy tab hiện hành.

Sheet thử của chủ không được dùng làm binding mặc định của khách. Bản cài mang mẫu sạch; 9B tạo file của chính khách sau khi họ nối Google. Kết nối Google Drive trong công cụ tạo gói không được coi là bằng chứng 9B hoặc khách đã nối Google.

## Phạm vi bản thử

Bản này hoàn chỉnh cho luồng **cài → menu → kiểm dữ liệu → tạo/sửa/duyệt → bàn giao**, có đồng bộ bảng theo lệnh. Các bước native cần quyền/công cụ thật của host; helper không thể tự xác nhận tài khoản khách đã nối hoặc ảnh đúng người chỉ từ tên file.

Đăng/hẹn qua Facebook hoặc kênh khác dùng công cụ native của 9B và phạm vi được chủ duyệt. Gói không tự bật publisher, worker nền hoặc lịch định kỳ khi chỉ cài. Khi chưa nối kênh, khách nhận đủ file để tự đăng.

Đã kiểm thực tế trên Windows/9B nêu trên. Bootstrap cho macOS/Linux có trong nguồn; chưa công bố đã chạy thử trên máy thật của hai hệ điều hành đó. Khách muốn video local cần Chrome/Edge phù hợp hoặc browser được host cung cấp và mạng tải phụ thuộc; thiếu thì hệ thống báo đúng nhánh chưa sẵn sàng, các nhánh khác vẫn hoạt động.

## Cách chủ sản phẩm thử

Mở chat đúng agent **content-gon-test**, nhắn **hệ thống content**, rồi chọn 2 với sản phẩm thật của mình. Kiểm xem hệ thống dùng lại Tri thức/ảnh, chỉ hỏi phần thiếu và giao đủ caption + ảnh/banner. Tiếp tục thử 4 và 7 để đối chiếu bài insight và video.

Thử sửa bài sau duyệt, gửi **Tôi đã hoàn tất** khi chưa tải tài liệu và chọn cùng ý hai lần trên Sheet để kiểm các cửa chặn đã mô tả. Hướng dẫn cho khách ở [HUONG-DAN-KHACH-HANG.md](HUONG-DAN-KHACH-HANG.md).
