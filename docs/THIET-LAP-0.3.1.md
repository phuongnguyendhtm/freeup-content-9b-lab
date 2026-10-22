# Thiết lập hồ sơ và tài nguyên — 0.3.1

Bản trước chỉ xét đầu vào theo định dạng mặc định là bài chữ; màu sắc, phong cách hình ảnh và lựa chọn logo có thể bị bỏ qua. Các thư mục video/nhạc/giọng đã được tạo nhưng hướng dẫn chưa bảo đảm được hiển thị trong chat sau cài.

Bản 0.3.1 thêm `onboarding setup`: đối chiếu hồ sơ cơ bản và nhận diện cùng yêu cầu của định dạng đã chọn. Kết quả có câu hỏi tiếng Việt cho từng mục thiếu/cần xác nhận, đúng mẫu cần điền, ba thư mục có thật và một nội dung hướng dẫn để agent gửi ngay trong chat. Không yêu cầu điền cả mười mẫu. Dữ liệu đã xác nhận được dùng lại; cập nhật không reset tiến độ hoặc ghi đè mẫu khách đang điền.

Luồng cài/cập nhật: cài và kích hoạt → đọc Tri thức/ảnh thật → assess → setup → hiển thị hướng dẫn/câu hỏi/mẫu/đường dẫn → menu. Khi khách nhắn **Tôi đã hoàn tất**, đọc lại nguồn mới, resume và setup để cập nhật phần còn thiếu. Lời báo hoàn tất không tự chứng minh đã đủ dữ liệu.

Ba thư mục khách nhận ngay trong chat, bên trong workspace của agent trên máy chạy 9B:

- **Nội dung của tôi / Tài nguyên của tôi / Video cảnh quay**: B-roll.
- **Nội dung của tôi / Tài nguyên của tôi / Nhạc nền**: nhạc tùy chọn.
- **Nội dung của tôi / Tài nguyên của tôi / Giọng đọc**: bản thu khi cần.

Helper trả đường dẫn tuyệt đối thực tế; không phát một đường dẫn demo cho mọi máy. Đây là thư mục local, không phải URL để tải từ điện thoại. Nếu cần nộp từ xa, agent kiểm kết nối và quyền của nơi nhận file trước khi gửi link. Ảnh sản phẩm/chân dung/logo dùng lại từ Hình ảnh doanh nghiệp; chưa xem được ảnh thì báo chưa xác minh, không kết luận khách chưa tải ảnh.

Phân biệt mức đủ đầu vào của định dạng và mức hoàn thiện thiết lập chung: thiếu nhận diện không cản bài chữ đã đủ, thiếu video không cản ảnh đã đủ. Quét chữ ký clip không thay việc giải mã và xem nội dung khi sản xuất.

## Cập nhật bản đã cài

Khách gửi trong cùng chat:

> Cập nhật quà tặng và hoàn tất thiết lập cho tôi, kiểm hồ sơ còn thiếu và gửi đường dẫn thêm B-roll: https://github.com/phuongnguyendhtm/freeup-content-9b-lab/blob/main/CAI-TRONG-9B.md

Agent tự cập nhật đúng agent hiện tại, giữ dữ liệu và tiếp tục thiết lập trong chính yêu cầu đó. Không bắt gỡ skill, tạo agent mới hoặc nhập lệnh kỹ thuật.

## Kiểm chứng

Các tình huống hồi quy gồm hồ sơ trống, đủ bài chữ nhưng thiếu nhận diện, đủ hồ sơ nhưng chưa có clip, thư viện ảnh chưa kiểm so với đã tìm nhưng chưa xác nhận ảnh phù hợp; kiểm lại file sau khi thêm và không ghi đè mẫu đang điền. Có kiểm qua router ở tiến trình Node độc lập, với mẫu còn thiếu rồi đọc lại để tiếp tục. Kết quả thử bằng fixture không chứng minh giao diện trên máy khách đã nhận bản cập nhật; sau phát hành cần cập nhật qua câu trên.

Kết quả trước phát hành: **155/155 kiểm thử đạt, không bỏ qua**, trên Node 22.22.3. Gói được cài/kiểm qua bốn adapter; 44 liên kết Markdown trong gói được đối chiếu. Thử giao diện chat 9B trên máy khách không nằm trong kết quả tự động này.
