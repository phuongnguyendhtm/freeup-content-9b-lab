# FreeUp Content Gọn cho 9BizClaw

**Bản thử 0.1.0** — bộ quà tặng riêng, có skill, bộ cài, menu ảnh, kiểm hồ sơ, tạo/duyệt/xuất bài và mẫu quản lý đúng ba trang tính.

## Cài bằng một câu trong 9B

Sao chép câu sau vào chat 9BizClaw:

> Cài quà tặng FreeUp Content Gọn từ https://github.com/phuongnguyendhtm/freeup-content-9b-lab. Đọc INSTALL.md và thực hiện trọn quy trình cài, kích hoạt skill contentlab đúng agent; dùng bản thử riêng nếu tôi đã có bộ content khác. Sau đó kiểm hồ sơ và ảnh sẵn có, chỉ hướng dẫn bổ sung phần thiếu rồi mở menu hệ thống content để tôi làm thử.

Trợ lý thực hiện phần kỹ thuật. Khách không cần tự cài Git, nhập npm hoặc sửa API key. Nếu host cần lượt chat mới, nhắn **Tiếp tục** theo hướng dẫn. Ảnh/video cần tài nguyên và công cụ thực; phụ thuộc render local được chuẩn bị tự động khi cần.

[Tải gói cài 0.1.0](https://github.com/phuongnguyendhtm/freeup-content-9b-lab/raw/refs/heads/main/downloads/freeup-content-gon-lab-0.1.0.zip) · [Kiểm tra SHA256](https://github.com/phuongnguyendhtm/freeup-content-9b-lab/raw/refs/heads/main/downloads/SHA256SUMS.txt) · [Hướng dẫn khách hàng](docs/HUONG-DAN-KHACH-HANG.md)

## Menu trong chat

Nhắn **hệ thống content** hoặc **/contentlab** để mở ảnh menu. Chọn số/tên và nói chủ đề. Menu dùng được trước khi hồ sơ đủ; chọn rồi hệ thống hỏi đúng phần cần bổ sung.

![Menu hệ thống content](assets/menu/he-thong-content-ngang-v2.png)

| Số | Nội dung | Gói kết quả |
|---|---|---|
| 1 | Bài viết | Bài chữ |
| 2 | **Bài đăng kèm sản phẩm** | Bài bán hàng + ảnh thật, hoặc banner sản phẩm + bài đăng |
| 3 | Ảnh cá nhân + quan điểm | Ảnh đúng người, câu quan điểm và bài viết |
| 4 | Ảnh minh họa insight | Hình minh họa và bài giải thích insight |
| 5 | Carousel / album | Bộ ảnh có thứ tự, một caption chung |
| 6 | Infographic / sơ đồ | Hình kiến thức/quy trình và bài viết |
| 7 | Video B-roll có chữ | Video cảnh quay có chữ và caption |
| 8 | Video có giọng đọc | Video có giọng đã xác nhận và caption |
| 9 | Chuỗi bình luận | Bài mở đầu và các bình luận nối tiếp |
| 0 | Làm theo lịch | Kế hoạch gồm các định dạng trên |

Mọi bài có ảnh/video đều có **bài viết/caption + media**. Yêu cầu chỉ thiết kế ảnh được xử lý thành tác vụ ảnh lẻ riêng. Bài sản phẩm dùng đúng sản phẩm/asset thật của khách, kiểm dữ kiện, giá và thời hạn ưu đãi; không thay bằng sản phẩm tưởng tượng.

## Cá nhân hóa và tài nguyên

Dùng lại **Tri thức** và **Hình ảnh doanh nghiệp** của 9B. Chỉ gửi mẫu liên quan phần thiếu; không bắt làm đủ mười file. Khách nộp bản hoàn thiện rồi nhắn **Tôi đã hoàn tất**; hệ thống đọc lại dữ liệu thật trước khi tiếp tục.

Thư mục khách thao tác: **Nội dung của tôi**, **Tài nguyên của tôi**, **Video cảnh quay**, **Nhạc nền**, **Giọng đọc**, **Hồ sơ cần hoàn thiện**, **Nội dung đã tạo**. Bài được giao bằng **Bài viết.txt**, **Xem bài.html** và ảnh/video/phụ đề phù hợp. Ảnh gốc ưu tiên thư viện 9B, không bắt tải lại.

## Đúng ba trang tính

| Trang | Việc khách làm |
|---|---|
| 00. Nguồn tham khảo | Thêm link/chủ đề muốn nghiên cứu |
| 01. Ý tưởng | Chọn ý và định dạng muốn làm |
| 02. Bài viết & lịch đăng | Xem, góp ý, duyệt, chọn kênh/giờ |

Mẫu sạch [ba trang tính](templates/sheets/Content%20Gọn%20-%203%20trang%20tính.xlsx) đi cùng bộ cài để 9B tạo bảng của chính khách. Không có tab Thiết lập hoặc tab ẩn; mã kỹ thuật nằm ở cột cuối. Chưa nối Google vẫn làm được trong chat/local. Đồng bộ theo lệnh, không bắt khách deploy Apps Script.

## Thành phần và kiểm chứng

- Bộ cài kiểm hash/inventory, cài lại không nhân đôi, nâng cấp giữ dữ liệu, khôi phục khi lỗi.
- Kích hoạt bằng native CLI chỉ thêm **contentlab** cho đúng agent/workspace; giữ nguyên agent và quyền khác.
- Kiểm hồ sơ có nguồn, lưu tiến độ, đọc lại sau hoàn tất; tạo đúng mẫu tiếng Việt.
- Chín định dạng có job ID, chống trùng, QA, duyệt theo phiên bản và xuất bộ bài thật.
- Renderer ảnh/video local; tự chuẩn bị Puppeteer-core/FFmpeg vào runtime riêng, kiểm browser/PNG/FFmpeg trước khi báo sẵn sàng.
- Google Sheet có schema, binding, ID và queue sự kiện chống trùng; connector/kết nối do 9B quản lý.

[Chi tiết kiểm thử và giới hạn đã xác minh](docs/BAN-THU-0.1.0.md). Bộ quà tặng mặc định làm nháp, duyệt và bàn giao. Đăng/hẹn qua công cụ host cần kết nối, chỉ dẫn đúng bản/kênh/giờ và kết quả thật; không bật publisher hoặc worker nền chỉ vì cài quà tặng.

## Tài liệu

- [Cài đặt cho trợ lý 9B](INSTALL.md) · [Nâng cấp/gỡ](docs/CAI-DAT-VA-CAP-NHAT.md) · [Kích hoạt native](docs/KICH-HOAT-9B.md).
- [Hướng dẫn khách hàng](docs/HUONG-DAN-KHACH-HANG.md) · [Hành trình đầy đủ](docs/HANH-TRINH-KHACH-HANG.md).
- [Mười mẫu Tri thức](templates/knowledge/README.md) · [Tải bộ mẫu](downloads/10-mau-tri-thuc-9bizclaw.zip).
- [Ba trang tính](docs/BA-TRANG-TINH.md) · [Tài nguyên và menu](docs/MEDIA-VA-MENU.md).
- [Đối chiếu hai hệ thống nguồn](docs/DOI-CHIEU-BAI-VIET-VA-MEDIA.md) · [Model và chi phí](docs/MODEL-VA-CHI-PHI.md).
- [Kế hoạch được dùng để triển khai](docs/KE-HOACH-DUYET-TRIEN-KHAI.md) — lưu lịch sử thiết kế; trạng thái bản chạy xem báo cáo 0.1.0.

Package/folder: `freeup-content-gon-lab`; skill native: `contentlab`; lệnh: `/contentlab`; kho: `freeup-content-gon-lab-data`. Thử tách khỏi `freeup-content-9b`. Gói phân phối không chứa hồ sơ, ảnh riêng, credential hoặc dữ liệu job của người tặng/khách.
