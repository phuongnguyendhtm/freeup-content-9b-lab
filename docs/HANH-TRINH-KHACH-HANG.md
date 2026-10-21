# Hành trình khách hàng — FREEUP Content Gọn cho 9BizClaw

**Bản đề xuất để duyệt trước khi xây · 21/10/2026.**

Mục tiêu là khách có thể dùng hồ sơ và tài nguyên sẵn có để tạo nội dung đúng doanh nghiệp, với ít quyết định và ít việc kỹ thuật. Ba trang tính là toàn bộ cấu trúc bảng; khách không phải tìm hướng dẫn qua nhiều tab.

## 1. Toàn bộ hành trình nhìn từ phía khách

| Chặng | Khách thực sự làm gì? | Hệ thống tự làm gì? | Kết quả khách nhìn thấy |
|---|---|---|---|
| 1. Nhận quà | Mở trang nhận quà sau khi mua 9B | Hiển thị một nút sao chép và video hướng dẫn ngắn | Biết mở 9B, dán câu nào, sẽ nhận được gì |
| 2. Cài | Dán một câu trong chat 9B | Kiểm môi trường, tải release đã kiểm, tạo gói và kho riêng | Tiến độ có nghĩa; hoàn tất có xác minh |
| 3. Nhận dữ liệu cũ | Xác nhận thương hiệu nếu có nhiều hồ sơ | Đọc hồ sơ, tài liệu và ảnh của đúng doanh nghiệp | Bản tóm tắt “đã có gì, thiếu gì” |
| 4. Bổ sung | Trả lời đúng phần thiếu; kết nối Google nếu chọn dùng bảng | Lưu câu trả lời và nguồn; tạo bảng riêng ba tab | Hồ sơ ngắn đã điền, không nhập lại toàn bộ |
| 5. Chốt giọng/phong cách | Xem một bài mẫu; chọn hướng hoặc góp ý | Dùng cùng nội dung để tạo tối đa hai hướng, rồi lưu lựa chọn | Thấy nội dung có giống mình không |
| 6. Chọn ý | Nói chủ đề hoặc chọn các ý AI đề xuất | Đề xuất góc triển khai, định dạng, nguồn và kế hoạch | Danh sách ý dễ chọn, phù hợp sản phẩm/mục tiêu |
| 7. Nhận bài | Xem thành phẩm trong chat hoặc tab 02 | Viết, làm media, kiểm file và lưu một phiên bản | Chữ và ảnh/video thật để xem |
| 8. Sửa và duyệt | Góp ý hoặc duyệt đúng bài | Sửa cùng bài, giữ lịch sử, kiểm lại | Không phải tạo dòng mới hay nhắc lại toàn bộ brief |
| 9. Đăng/dùng | Tải về hoặc duyệt đăng với tài khoản và thời gian rõ | Đăng nếu có kết nối phù hợp; lưu bằng chứng | Link bài thật hoặc bộ file sẵn dùng |
| 10. Quay lại | Giao việc mới hoặc đổi mục tiêu/sản phẩm | Dùng lại giọng, mẫu, hồ sơ và ảnh đúng brand | Làm tiếp nhanh hơn lần đầu |

**Bảy ngày là gợi ý khởi đầu**, khách có thể chọn ba bài hoặc một bài. Không bắt họ lên lịch cả tuần mới được dùng.

## 2. Chặng nhận quà

Khách nhận một trang gồm:

- Tên quà tặng và một câu mô tả kết quả.
- Nút **Sao chép câu lệnh cài**.
- Clip khoảng ba phút: cài → xem mẫu → chọn ý → duyệt bài.
- Một ghi chú dễ hiểu: cần 9B hoạt động; Google/Facebook chỉ nối khi sử dụng đến.

Không đưa Git, ZIP, API key, Apps Script, danh sách thư mục và nhiều lựa chọn nền tảng ra trước mặt khách trong luồng chính.

Câu cài dự kiến sau khi có bộ cài thật:

> Cài bộ Content Gọn bản thử từ [link quà tặng] cho trợ lý thử nghiệm của tôi. Dùng hồ sơ, tài liệu và ảnh doanh nghiệp đã có trong 9B, chỉ hỏi phần thiếu. Giúp tôi làm một bài mẫu trước.

Trong tài liệu hiện tại đây là **mô tả trải nghiệm đích**. Repository lab chưa chứa installer để thực hiện câu này.

Nếu khách chưa cài hoặc chưa khởi tạo 9B, trang hướng dẫn đưa về đúng bước chuẩn bị đó rồi quay lại quà tặng. Một câu cài gói content không tự thay thế việc cài và kích hoạt phần mềm nền.

## 3. Chặng cài đặt

Khách gửi câu cài và nhận phản hồi:

> Tôi đang kiểm tra 9B và chuẩn bị bộ Content Gọn riêng cho anh/chị. Tôi sẽ dùng dữ liệu doanh nghiệp có sẵn để thiết lập.

Sau đó hệ thống tự kiểm host, release, gói đã cài hay chưa, kho dữ liệu và kết quả native install. Chạy lại cùng yêu cầu sẽ tiếp tục hoặc dùng lại bản đúng, không tạo bộ quà tặng thứ hai.

Nếu host cần Gateway rảnh, lời nhắn phải rõ:

> Tôi đã bắt đầu cài nền. Sau khi lượt này kết thúc, gửi **Tiếp tục** để tôi kiểm tra kết quả và thiết lập.

Đây là fallback cần được giữ cho đến khi kiểm chứng được cơ chế tự chuyển tiếp. Không bắt khách gõ lại câu cài dài, tải file hoặc làm lại setup. “Đang cài” và “Đã cài” là hai trạng thái riêng.

Khi đã cài xong:

> Bộ Content Gọn đã sẵn sàng. Tôi sẽ đọc hồ sơ và ảnh đã có để thiết lập cho doanh nghiệp của anh/chị.

## 4. Chặng đọc hồ sơ và tài nguyên

Hệ thống đọc thông tin doanh nghiệp, sản phẩm/dịch vụ, tài liệu, giọng đã xác nhận, màu/logo và ảnh có quyền dùng. Chỉ đọc những nguồn liên quan, không quét lịch sử khách hàng/CRM để tạo nội dung nếu chưa có yêu cầu phù hợp.

Ví dụ minh họa — số lượng dưới đây là giả định, khi chạy phải báo số thật:

> Tôi đã tìm thấy thông tin doanh nghiệp, dịch vụ đào tạo và bộ ảnh đứng lớp của anh/chị. Tôi còn thiếu hai phần:
>
> 1. Tháng này muốn ưu tiên xây uy tín hay nhận lịch tư vấn?
> 2. Muốn giới thiệu chương trình nào trước?

Khách không bị hỏi lại tên công ty, logo, địa chỉ hoặc chân dung người mua nếu thông tin đủ rõ đã được cung cấp.

Trường hợp có hai doanh nghiệp hoặc dữ liệu mâu thuẫn, hệ thống hỏi đúng một câu để chọn. Không tự gộp hồ sơ hoặc lấy dữ liệu của người tặng làm mặc định.

### Khi chưa có hồ sơ đủ

Hỏi theo nhóm nhỏ: anh/chị làm gì, giúp ai, dịch vụ nào; sau đó điểm khác biệt, giọng và mục tiêu nếu còn thiếu. Dữ kiện chưa có thì lưu là thiếu, không tự tạo thành tích, giá, case hay lời chứng thực.

### Khi chưa có ảnh

Khách được tiếp tục bài chữ hoặc mẫu trung tính. Khi cần bài có ảnh cá nhân thì chỉ yêu cầu gửi một ảnh đúng người. Không thay bằng chân dung người khác và không ép hoàn thành kho media trước khi viết.

## 5. Chặng nối bảng riêng và kiểm Thiết lập

Khách có Google đã kết nối: hệ thống tạo một file riêng từ master sạch, kiểm đúng ba tab và trả link. Nếu đã có bảng riêng hợp lệ của gói lab thì dùng lại bảng đó.

Khách chưa nối Google chỉ thấy một lựa chọn dễ hiểu:

> Anh/chị muốn kết nối Google để xem và duyệt nhiều bài trên bảng, hay làm bài mẫu ngay trong chat trước?

Kết nối là luồng đăng nhập/cấp quyền của Google. Khách không phải tạo Apps Script, deploy Web App hoặc chép khóa. Nếu chọn làm trong chat, bài mẫu vẫn được lưu trong kho của gói; khi nối bảng sau, dùng cùng ID để chuyển sang bảng và tránh nhân đôi.

Tab `00. Thiết lập` đã được AI điền phần đọc được. Khách chỉ kiểm một bản tóm tắt và chỉnh phần muốn thay. Nguồn tham khảo, mục tiêu, giọng và nhận diện nằm cùng tab, không tạo thêm các trang Chiến lược/Nguồn/Hướng dẫn.

## 6. Chặng làm mẫu để cá nhân hóa

Hệ thống đề nghị:

> Tôi sẽ làm một bài giới thiệu góc nhìn chuyên môn và một mẫu ảnh bằng dữ liệu của anh/chị. Anh/chị xem cách viết và hình có đúng cảm giác thương hiệu chưa.

Nếu khách đã có nhận diện và giọng được xác nhận, dùng ngay để làm một mẫu. Nếu thiếu sở thích thiết kế, dùng **cùng một thông điệp** để đưa tối đa hai hướng cho dễ so sánh; không đưa hai bộ nội dung khác nhau làm khách khó quyết.

Ví dụ khách nói:

> Chọn mẫu 2. Giọng gần gũi hơn, ít chữ trên ảnh. Từ nay dùng kiểu này.

Hệ thống lưu phong cách riêng và nói đã lưu những gì. Nếu khách chỉ sửa bài này thì không biến sửa đó thành luật cho tất cả bài sau.

Sau chốt mẫu, khách có thể dùng ngay. Không yêu cầu chọn màu bằng mã hex, font bằng tên kỹ thuật hoặc trả lời biểu mẫu dài trước khi thấy kết quả.

## 7. Chặng tìm và chọn ý tưởng

Khách có hai cách bắt đầu:

**Có chủ đề:** “Làm một bài về ba lỗi khi tư vấn dịch vụ.” Hệ thống đi thẳng đến brief và bản nháp, không bắt khách ghé tab Ý tưởng để nhập lại.

**Chưa biết đăng gì:** “Đề xuất nội dung tuần này cho dịch vụ A.” Hệ thống đề xuất 5–10 ý dựa trên hồ sơ, tài liệu, câu hỏi khách đã được phép dùng và nguồn bên ngoài đọc được.

Ví dụ danh sách minh họa:

| Ý tưởng | Góc triển khai | Định dạng | Việc khách làm |
|---|---|---|---|
| Ba lỗi khiến buổi tư vấn kéo dài | Hướng dẫn nhận biết và sửa | Carousel | Chọn Làm bài |
| Khi nào khách nên dùng dịch vụ A? | Gỡ hiểu nhầm và nêu tiêu chí phù hợp | Bài + ảnh | Chọn Làm bài |
| Một quan điểm nghề nghiệp của tôi | Dùng phương pháp trong tài liệu doanh nghiệp | Ảnh quote | Bỏ qua hoặc bổ sung câu chuyện |

Nguồn chưa đọc được phải báo giới hạn. Số like/comment không tìm thấy để trống. Nội dung và ảnh gốc nguồn được lưu trong hồ sơ nguồn mở từ cột Nguồn, tách với góc triển khai AI; ảnh tham khảo không mặc định được dùng lại trong bài của khách.

Khách chọn trong chat “Làm ý 1 và 2” hoặc chọn `Làm bài` trong tab 01. Hệ thống xác nhận đã nhận bằng trạng thái rõ ràng. Nếu tự nhận thay đổi Sheet chưa được bật, khách dùng câu **Đồng bộ lựa chọn của tôi**; không hứa đổi ô là AI chạy ngay khi chưa có worker thật.

## 8. Chặng sản xuất và bàn giao

Hệ thống tự đọc brief, lấy tài nguyên, viết, thiết kế/render, kiểm chữ tiếng Việt và lưu phiên bản. Khách không phải gọi lần lượt skill viết, skill ảnh rồi skill xuất file.

Một ý có thể tạo nhiều định dạng theo yêu cầu. Chỉ render các định dạng đã giao; không tự mở rộng thành video có phí khi khách chỉ muốn bài và ảnh.

Kết quả được trình bày trong chat và tab `02. Bài viết & lịch đăng`:

> **Bài: Ba lỗi khiến buổi tư vấn kéo dài**
>
> Đây là caption và bộ carousel 6 trang. Anh/chị có thể xem ảnh, ghi góp ý hoặc chọn **Duyệt nội dung**. Nếu muốn đăng, chọn tài khoản và giờ ở cùng dòng.

File thật được lưu; link điện thoại dùng Drive/kênh hỗ trợ tệp, không dùng đường dẫn máy tính. Trạng thái `Chờ duyệt` chỉ xuất hiện khi thành phẩm đã có và kiểm được; nếu thiếu công cụ ảnh/video thì báo đúng phần thiếu và giao phần đã hoàn tất.

## 9. Chặng sửa bài

Khách sửa bằng một trong hai cách:

- Chat: “Bài tư vấn: mở đầu ngắn hơn, giữ nội dung chính, bỏ lời mời mua.”
- Sheet: ghi ở cột Góp ý và chọn `Yêu cầu sửa` trên chính dòng bài.

Hệ thống sửa cùng mã bài, tạo phiên bản mới, giữ bản cũ để đối chiếu và trả lại `Chờ duyệt`. Nhận xét đã xử lý được đánh dấu/ghi lịch sử, không mất khi đồng bộ. Chưa có worker nhận Sheet thì tiếp tục bằng lệnh đồng bộ trong chat.

Không tạo một bài mới chỉ vì khách sửa một câu. Người dùng chỉnh caption trực tiếp phải được nhận diện như sửa nội dung; không để worker ghi đè. Bản thay đổi sau duyệt cần duyệt lại phần liên quan trước khi đăng.

## 10. Chặng duyệt và đăng

Khách chọn một trong ba cách:

| Cách dùng | Khách làm | Kết quả |
|---|---|---|
| Lấy file để tự dùng | Chọn Tải về hoặc nói “Tôi tự đăng” | Caption + file thật, lưu trạng thái đã bàn giao |
| Duyệt nội dung trước | Chọn Duyệt nội dung | Khóa phiên bản đã chọn, chưa tạo lệnh đăng |
| Đăng/hẹn đăng | Xem bản cuối gồm bài, media, tài khoản và giờ rồi xác nhận | Gửi đúng bản qua kết nối phù hợp và lưu biên nhận |

Đăng lần đầu có thể cần kết nối tài khoản và chọn đúng Fanpage. Khi đã kết nối và duyệt đầy đủ phạm vi thì thực hiện, không hỏi lại cùng quyết định. Chưa có kết nối thì vẫn tải file dùng được.

Tất cả việc đăng nằm trên tab 02: ngày dự kiến, tài khoản, trạng thái và link bài. Xem lịch bằng lọc/sắp xếp ngày ngay trên tab đó; không có trang lịch thứ tư.

`Đã hẹn` và `Đã đăng` là hai trạng thái khác nhau. Timeout sau khi gửi phải kiểm tra trước khi thử lại. Không tự đăng dồn các bài quá hạn khi máy vừa mở lại.

## 11. Khách dùng hằng ngày như thế nào?

### Buổi sáng hoặc khi chuẩn bị nội dung

> “Đề xuất ba ý cho tuần này, ưu tiên dịch vụ A.”

Khách xem tab 01 hoặc danh sách trong chat, chọn một số ý. Có thể giao luôn “Làm ý 2 dạng carousel, ý 3 bài viết kèm ảnh”.

### Khi nhận thông báo có bài

> “Cho tôi xem bài vừa làm.”

Khách mở tab 02, xem nội dung và ảnh, góp ý hoặc duyệt. Muốn đăng thì điền/chọn tài khoản và giờ trên cùng dòng.

### Khi đổi chiến dịch

> “Tháng này ưu tiên chương trình B, giọng giữ như cũ.”

Hệ thống cập nhật phần mục tiêu/sản phẩm trong tab 00 và hồ sơ; giữ giọng đã chọn. Không khởi động lại onboarding.

Khách không phải nhớ nhiều lệnh. Trong môi trường thử, một điểm vào `/contentlab` hoặc câu mở đầu **“Bản thử Content Gọn…”** dùng để định tuyến đúng gói. Không chiếm các lệnh hiện có như `/vietbai` của hệ thống đang chạy.

## 12. Ví dụ một lượt dùng từ đầu đến cuối

Đây là mô phỏng thiết kế, chưa phải đoạn chat kiểm thử thực.

**Khách:** “Cài bộ Content Gọn bản thử cho tôi.”

**9B:** kiểm cài đặt và báo hoàn tất khi có bằng chứng. Nếu phải cài nền, hướng dẫn gửi Tiếp tục ở lượt mới.

**9B:** “Tôi đã đọc hồ sơ doanh nghiệp và ảnh của anh/chị. Lần này muốn ưu tiên dịch vụ nào?”

**Khách:** “Dịch vụ tư vấn cho chuyên gia, mục tiêu có lịch hẹn.”

**9B:** “Tôi sẽ dùng giọng và màu đã có. Đây là một bài mẫu để anh/chị xem.”

**Khách:** “Giữ kiểu này, viết bớt trang trọng. Từ nay dùng giọng này.”

**9B:** lưu phong cách, tạo bảng riêng ba tab nếu có Google, rồi đề xuất ý tưởng.

**Khách:** “Làm ý 1, 3 và 5. Hai bài có ảnh, một carousel.”

**9B:** sản xuất, kiểm file và đưa các bài vào tab 02 chờ duyệt.

**Khách:** “Sửa mở đầu bài 3; hai bài còn lại tôi duyệt.”

**9B:** sửa đúng bài; lưu duyệt hai bài đúng phiên bản. Chưa tự đăng nếu khách mới duyệt nội dung.

**Khách:** chọn giờ và Fanpage, xem bản cuối rồi xác nhận đăng hai bài đã duyệt.

**9B:** đăng/hẹn trong phạm vi đã duyệt; cập nhật trạng thái và link thật ở cùng tab 02.

## 13. Những điểm cần chủ sản phẩm đánh giá trước khi xây

- Đọc hồ sơ xong chỉ hỏi phần thiếu đã đủ tự nhiên chưa?
- Tab Ý tưởng dùng để chọn, tab Bài viết dùng để sửa/duyệt có dễ hiểu không?
- Muốn nhận một bài mẫu trước hay bắt đầu bằng danh sách ý? Mặc định đề xuất là một bài mẫu trước, chỉ làm lần đầu.
- Có cần nối Google ngay không? Mặc định đề xuất là tùy chọn, để khách thấy bài đầu sớm.
- Gợi ý ba bài/bảy ngày có phù hợp hơn bắt tạo lịch cả tháng không?
- Duyệt nội dung và cho đăng tách rõ có giúp tránh nhầm không?

Các lựa chọn mặc định trên đã đủ để duyệt thiết kế. Chỉ sau khi chủ sản phẩm chốt hành trình mới xây bộ cài, bảng mẫu thực và worker cho repo lab.
