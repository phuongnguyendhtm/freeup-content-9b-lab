# Thử riêng và nghiệm thu trước khi phát quà

**Bản thiết kế, chưa cài lên 9B · 21/10/2026.**

## 1. Những gì đã làm trong lượt chuẩn bị

- Tạo repository `phuongnguyendhtm/freeup-content-9b-lab` riêng, ở chế độ private.
- Viết lại hành trình từ nhận quà đến sử dụng hằng ngày.
- Đặc tả một schema mới có đúng ba trang tính.
- Đề xuất ranh giới gói/agent/dữ liệu/lệnh để thử độc lập.

Chủ sản phẩm xem và góp ý hành trình trước. Repository chưa có installer, skill chạy được, Google Sheet thực hoặc worker. Trạng thái này được ghi ở README để không nhầm với bộ quà tặng đã hoàn tất.

## 2. Ranh giới thử nghiệm cần giữ

| Thành phần | Bản lab | Hệ thống đang dùng |
|---|---|---|
| Repo | freeup-content-9b-lab | freeup-content-9b |
| Package ID | freeup-content-gon-lab | Giữ package hiện hành |
| Schema Sheet | content-gon-lab-v1 | Schema bảy tab hiện hành |
| Agent | content-gon-test, workspace mới khi triển khai | Giữ agent/workspace hiện hành |
| Lệnh | /contentlab và nhánh bên trong | Giữ /vietbai, /thietkeanh và các lệnh hiện hành |
| Dữ liệu | freeup-content-gon-lab-data | Giữ kho hiện hành |
| Sheet | File mới, ba tab | Giữ file bảy tab hiện hành |
| Worker/lịch | Tên, queue, khóa và binding riêng | Giữ worker/lịch hiện hành |

Tạo một agent thử riêng là lựa chọn mặc định để không có hai bộ điều phối cùng nhận một câu tự nhiên. Nếu bản 9B không hỗ trợ agent/workspace riêng theo cách cần dùng, phải chọn phương án thử khác được host hỗ trợ trước khi cài; không tự thay cấu hình của agent đang vận hành.

## 3. Dùng lại hồ sơ và ảnh mà vẫn thử độc lập

- Đọc hồ sơ/tài liệu của đúng doanh nghiệp qua quyền 9B hiện có.
- Tạo snapshot có nguồn trong kho lab; yêu cầu sửa content của lab không ghi đè hồ sơ gốc.
- Ảnh nguồn dùng reference ID hoặc bản làm việc để render, không nhập lại cả thư viện.
- Thành phẩm lab lưu vào kho lab. Nếu native tạo ảnh buộc lưu vào Hình ảnh doanh nghiệp, thêm tag/folder lab cho tài sản mới; không đổi/xóa ảnh gốc.
- Không nhập lịch nền, job đang chạy hoặc tài khoản trình duyệt của gói cũ vào lab.
- Kết nối Google/Facebook có thể là kết nối của chính chủ được host quản lý, nhưng binding/Sheet/job/approval của lab phải riêng.

## 4. Thứ tự làm sau khi chốt hành trình

1. Tạo schema và master sạch đúng ba tab; không chuyển đổi Sheet đang chạy.
2. Xây một skill điều phối namespaced `/contentlab`, hồ sơ và media resolver của lab.
3. Làm luồng bài mẫu và lưu phong cách; kiểm gói có dữ liệu và gói chưa có dữ liệu.
4. Làm Sheet connector theo lệnh: chọn ý → nhận nháp → sửa → duyệt. Chưa bật lịch nền.
5. Hoàn thiện installer riêng và kiểm cài mới/cài lại/nâng bản trên môi trường thử.
6. Khi phần sản xuất ổn định, thử đăng một bài có chủ sở hữu duyệt; xác minh receipt/link.
7. Bật worker/lịch riêng nếu chủ sản phẩm chọn tự nhận việc, rồi mới thử với khách.

## 5. Tình huống nghiệm thu

| Tình huống | Điều kiện đạt |
|---|---|
| Cài bản lab khi bản cũ đã có | Không ghi đè lệnh, skill, dữ liệu, Sheet, lịch của bản cũ |
| Chạy lại câu cài | Dùng cùng gói/kho hợp lệ, không tạo bộ thứ hai |
| Hồ sơ đã đủ | Không hỏi lại toàn bộ; chỉ hỏi mục tiêu chiến dịch chưa rõ |
| Google chưa nối | Làm và lưu bài mẫu trong chat/local; nối sau không nhân đôi bài |
| Cấu trúc Sheet | Đúng ba tab thực, không thêm tab ẩn |
| Chọn ý trong chat hoặc bảng | Cùng ID, cùng trạng thái, chỉ một job |
| Sửa bài | Giữ mã bài và phản hồi; version mới được duyệt riêng |
| Thiếu ảnh người thật | Không dùng ảnh người khác, giao phần chữ hoặc hỏi đúng ảnh thiếu |
| Một ý nhiều định dạng | Các thành phẩm con đều liên kết ý gốc, không mất brief |
| Đổi caption/ảnh sau duyệt | Không dùng phê duyệt cũ cho bản mới |
| Timeout khi đăng | Đối chiếu trước khi thử lại; không đăng lặp |
| Dừng test | Chỉ dừng worker/lịch lab; hệ thống cũ tiếp tục độc lập |
| Cài trên máy sạch | Không phụ thuộc ổ D/G, thư mục giảng viên hoặc cache Antigravity |

Mục tiêu pilot: phần lớn khách tạo được bài mẫu mà không cần điều khiển máy từ xa; không lẫn dữ liệu thương hiệu, không mất dữ liệu cũ và không báo thành công khi thiếu file/receipt thực. Chốt ngưỡng số đo sau khi phạm vi bản đầu được duyệt.

## 6. Các điểm để chủ sản phẩm duyệt

- Ba tab: Thiết lập, Ý tưởng, Bài viết & lịch đăng.
- Một bài mẫu trước, rồi mới sản xuất hàng loạt.
- Khách có thể làm một bài ngay hoặc nhận kế hoạch ngắn; không bắt dùng theo gói bảy ngày.
- Tận dụng hồ sơ/ảnh cũ, hỏi phần thiếu.
- Chat là điểm giao việc; Sheet là cách chọn/duyệt hàng loạt.
- Chọn ý chỉ cho phép làm nháp; cho đăng cần đúng thành phẩm, tài khoản và thời gian.
- Bản đầu đồng bộ theo lệnh; tự nhận thay đổi Sheet bật sau khi kiểm được worker thật.
- Repo private trong giai đoạn duyệt; nếu sau này phát cho khách ngoài tài khoản, phải chọn cách cấp quyền/phân phối thích hợp và kiểm đường tải.

Đây là các quyết định sản phẩm để xem xét, không phải yêu cầu cấp thêm quyền kỹ thuật cho thao tác đã được người dùng giao.
