# Thử riêng và nghiệm thu trước khi phát quà

> Bản thiết kế được lưu để đối chiếu. **Bản chạy hiện tại:** [Báo cáo 0.1.0](BAN-THU-0.1.0.md) · [Hướng dẫn khách hàng](HUONG-DAN-KHACH-HANG.md). Các trạng thái “chưa xây/cài” trong bản thiết kế mô tả thời điểm duyệt ban đầu.

**Bản thiết kế, chưa cài lên 9B · 22/10/2026. Menu ngang v2 đã tạo thành tệp thật; chưa tích hợp mở/gửi menu trong chat 9B.**

## 1. Những gì đã làm trong lượt chuẩn bị

- Tạo repository `phuongnguyendhtm/freeup-content-9b-lab` riêng, ở chế độ private.
- Viết lại hành trình từ nhận quà đến sử dụng hằng ngày.
- Đặc tả một schema mới có đúng ba trang tính.
- Đề xuất ranh giới gói/agent/dữ liệu/lệnh để thử độc lập.
- Tách mười mẫu Tri thức, giữ đủ 53 câu hỏi gốc và bổ sung nhận diện vào mẫu 01.
- Đặc tả kiểm thiếu, nhận câu hoàn tất, chuẩn bị media và mở menu ngay khi khách nhắn “hệ thống content”, kể cả trước khi hoàn tất onboarding.
- Tạo [menu ngang v2](../assets/menu/he-thong-content-ngang-v2.png), **1672 × 941**, dùng logo FreeUp và linh vật cáo Mía đã chọn, giữ chín định dạng riêng; ô 2 là **Bài đăng kèm sản phẩm** và ô 0 là lối tắt **Làm theo lịch**.
- Đặc tả bộ bài visual mặc định gồm caption/bài đăng đi cùng media, kiểm sản phẩm thật và ưu đãi trước khi giao bản sẵn sàng duyệt/đăng.

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

Trong agent/workspace lab, câu **“hệ thống content”** mở menu lab; không đăng ký chồng handler câu tự nhiên đó vào agent đang vận hành. Chữ số đơn lẻ chỉ được hiểu là chọn menu khi đúng hội thoại lab đang ở ngữ cảnh menu/chờ lựa chọn. Binding, ID bài/job, hàng đợi, file và log có phạm vi lab; không nhận nhầm sự kiện từ Sheet hoặc job của hệ thống cũ. Giữ tên package và khóa nội bộ, không đổi tên thư mục 9B đang hoạt động để làm thử nghiệm.

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
3. Làm kiểm hồ sơ theo nội dung, gửi đúng link mẫu, lưu chờ và đọc lại sau câu Tôi đã hoàn tất.
4. Tích hợp menu v2 trong chat lab: mở ngay khi nhắn “hệ thống content” và tự hiện sau thiết lập đã kiểm; chỉ sau lựa chọn mới hỏi phần còn thiếu cho nhánh đó. Kiểm media/thư mục tiếng Việt, sản xuất bộ caption + media mẫu và lưu phong cách khi khách yêu cầu.
5. Làm Sheet connector theo lệnh: chọn ý → nhận nháp → sửa → duyệt. Chưa bật lịch nền.
6. Hoàn thiện installer riêng và kiểm cài mới/cài lại/nâng bản trên môi trường thử.
7. Khi phần sản xuất ổn định, thử đăng một bài có chủ sở hữu duyệt; xác minh receipt/link.
8. Bật worker/lịch riêng nếu chủ sản phẩm chọn tự nhận việc, rồi mới thử với khách.

## 5. Tình huống nghiệm thu

| Tình huống | Điều kiện đạt |
|---|---|
| Cài bản lab khi bản cũ đã có | Không ghi đè lệnh, skill, dữ liệu, Sheet, lịch của bản cũ |
| Chạy lại câu cài | Dùng cùng gói/kho hợp lệ, không tạo bộ thứ hai |
| Hồ sơ đã đủ | Không hỏi lại toàn bộ; chỉ hỏi mục tiêu chiến dịch chưa rõ |
| Google chưa nối | Làm và lưu bài mẫu trong chat/local; nối sau không nhân đôi bài |
| Cấu trúc Sheet | Đúng ba tab thực, không thêm tab ẩn |
| Hồ sơ khác tên | Nội dung đủ thì dùng, không bắt nộp lại theo tên mẫu |
| Chỉ thiếu giọng | Chỉ gửi mẫu 10 và chỉ rõ phần thiếu |
| Báo hoàn tất nhưng file trống | Đọc lại, báo còn thiếu; không mở trạng thái sẵn sàng giả |
| File còn indexing | Giữ trạng thái chờ, không reset onboarding |
| Media folder rỗng | Không báo đã có B-roll/nhạc |
| Chỉ thiếu video | Bài chữ và ảnh vẫn dùng được nếu đủ dữ kiện |
| Menu v2 | Gửi đúng [ảnh v2 thực](../assets/menu/he-thong-content-ngang-v2.png), logo FreeUp/Mía, đủ chín định dạng riêng, ô 2 “Bài đăng kèm sản phẩm”; ô 0 là lối tắt “Làm theo lịch”. Fallback chữ nói rõ giới hạn, không nhận là đã gửi ảnh |
| Mở menu trước onboarding | Nhắn “hệ thống content” là hiện ngay menu; không buộc điền hồ sơ trước khi xem/chọn và không tự sản xuất chỉ vì mở menu |
| Menu sau thiết lập | Sau khi kiểm xong thiết lập ban đầu, tự hiện cùng menu v2; chỉ hỏi phần thiếu liên quan định dạng đã chọn |
| Chữ số trong/ngoài ngữ cảnh | Trong ngữ cảnh menu lab, chọn đúng số/tên; chữ số đơn lẻ ngoài ngữ cảnh không tự chọn định dạng hay tạo job |
| Bài đăng kèm sản phẩm | Ô 2 đi vào bài bán hàng kèm ảnh sản phẩm thật hoặc banner sản phẩm/ưu đãi kèm caption; vẫn là cùng một định dạng, không gộp các ô khác |
| Đúng ảnh sản phẩm | Dùng ảnh đúng doanh nghiệp/sản phẩm/biến thể từ Hình ảnh doanh nghiệp, giữ ID nguồn; sai ảnh hoặc làm đổi hình dáng, màu, bao bì, nhãn sản phẩm thật thì không đạt QA |
| Dữ kiện bán hàng và ưu đãi | Đối chiếu T03: tên, lợi ích có căn cứ, giá nếu nhắc, CTA và điều kiện/thời hạn theo ngày đăng dự kiến; ưu đãi hết hạn hoặc dữ kiện chưa xác nhận thì không đạt QA, không bịa để lấp chỗ thiếu |
| Bộ visual hoàn chỉnh | Ảnh cá nhân/quote, insight, carousel/album, infographic/sơ đồ, video và sản phẩm/banner đều có caption/bài đăng khớp media theo mặc định |
| Caption thiếu hoặc rỗng | Chặn cổng READY, không chuyển thành “Chờ duyệt” hoặc “Đã bàn giao tự đăng” cho bài hoàn chỉnh chỉ có media; nêu đúng phần cần bổ sung |
| Khách yêu cầu chỉ ảnh | Cho phép giao ảnh lẻ theo yêu cầu rõ ràng, ghi phạm vi ảnh lẻ; không nhận đó là bài đăng hoàn chỉnh hoặc dùng nó để vượt cổng READY của bài đầy đủ |
| Chọn ý trong chat hoặc bảng | Cùng ID, cùng trạng thái, chỉ một job |
| Sửa bài | Giữ mã bài và phản hồi; version mới được duyệt riêng |
| Thiếu ảnh người thật | Không dùng ảnh người khác, giao phần chữ hoặc hỏi đúng ảnh thiếu |
| Một ý nhiều định dạng | Các thành phẩm con đều liên kết ý gốc, không mất brief |
| Đổi caption/ảnh sau duyệt | Không dùng phê duyệt cũ cho bản mới |
| Timeout khi đăng | Đối chiếu trước khi thử lại; không đăng lặp |
| Dừng test | Chỉ dừng worker/lịch lab; hệ thống cũ tiếp tục độc lập |
| Cài trên máy sạch | Không phụ thuộc ổ D/G, thư mục giảng viên hoặc cache Antigravity |
| Thư mục Unicode | Tạo/đọc/ghi/mở lại đúng đường dẫn tiếng Việt có dấu và khoảng trắng, gồm “Nội dung của tôi”, “Tài nguyên của tôi”, “Video cảnh quay”, “Nhạc nền”, “Giọng đọc”, “Hồ sơ cần hoàn thiện” và “Nội dung đã tạo/<ngày>/<loại> - <tiêu đề>”; tên file “Bài viết.txt”, “Xem bài.html”, “Ảnh 01.png”, “Video.mp4”, “Phụ đề.srt” không lỗi mã hóa hoặc mất dấu |
| Namespace lab | Lệnh/câu tự nhiên, ID, binding, Sheet, queue, job, lịch và thư mục lab không đọc nhầm để ghi vào bản cũ; thử sự kiện lặp và ID gần giống vẫn chỉ tạo một job đúng lab |

Mục tiêu pilot: phần lớn khách tạo được bài mẫu mà không cần điều khiển máy từ xa; không lẫn dữ liệu thương hiệu, không mất dữ liệu cũ và không báo thành công khi thiếu file/receipt thực. Chốt ngưỡng số đo sau khi phạm vi bản đầu được duyệt.

**READY** ở đây là cổng QA nội bộ cho bộ bài đầy đủ, không thêm trang tính hoặc bắt khách chọn trạng thái kỹ thuật. Phải kiểm caption có nội dung thực, khớp ảnh/video và đúng nguồn, kiểm file mở được và dữ kiện bán hàng còn hợp lệ. Cổng chỉ được thông qua khi toàn bộ phần bắt buộc của định dạng đã có; ảnh riêng theo yêu cầu chỉ có thể được kiểm như ảnh lẻ.

Đường dẫn khách nhìn thấy được tạo và kiểm trên workspace của chính khách sau cài; không dùng đường dẫn ổ D: của người hướng dẫn hoặc biến `<workspace khách>` như một kết quả đã tạo. Kiểm thêm **Ảnh bổ sung** khi được dùng và **Logo và nhận diện** khi cần; Hình ảnh doanh nghiệp vẫn là nguồn ảnh chính. Kho hệ thống `freeup-content-gon-lab-data`, khóa dữ liệu và runtime có thể giữ tên nội bộ riêng.

## 6. Các điểm để chủ sản phẩm duyệt

- Ba tab: Nguồn tham khảo, Ý tưởng, Bài viết & lịch đăng.
- Hồ sơ nằm trong Tri thức; thiếu gì gửi mẫu liên quan, đọc lại sau câu Tôi đã hoàn tất.
- Hiện ngay menu v2 khi khách nhắn “hệ thống content”, cả trước khi xong onboarding; tự hiện cùng menu sau thiết lập đã kiểm. Mở menu không tạo bài; clip/nhạc/voice chỉ chặn nhánh cần chúng.
- Giữ chín định dạng riêng; ô 2 là Bài đăng kèm sản phẩm, có nhánh bài bán hàng/banner thật kèm caption.
- Bộ bài visual mặc định có caption + media khớp nhau; thiếu caption, sai sản phẩm hoặc ưu đãi hết hạn thì không đạt READY.
- Một bài mẫu trước, rồi mới sản xuất hàng loạt.
- Khách có thể làm một bài ngay hoặc nhận kế hoạch ngắn; không bắt dùng theo gói bảy ngày.
- Tận dụng hồ sơ/ảnh cũ, hỏi phần thiếu.
- Chat là điểm giao việc; Sheet là cách chọn/duyệt hàng loạt.
- Chọn ý chỉ cho phép làm nháp; cho đăng cần đúng thành phẩm, tài khoản và thời gian.
- Bản đầu đồng bộ theo lệnh; tự nhận thay đổi Sheet bật sau khi kiểm được worker thật.
- Repo private trong giai đoạn duyệt; nếu sau này phát cho khách ngoài tài khoản, phải chọn cách cấp quyền/phân phối thích hợp và kiểm đường tải.

Đây là các quyết định sản phẩm để xem xét, không phải yêu cầu cấp thêm quyền kỹ thuật cho thao tác đã được người dùng giao.
