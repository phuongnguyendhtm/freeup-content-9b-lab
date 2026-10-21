# FREEUP Content Gọn — 9BizClaw Lab

**Trạng thái: bản thiết kế để chủ sản phẩm duyệt, ngày 21/10/2026. Chưa có bộ cài hoặc phiên bản chạy thử.**

Kho riêng cho quà tặng Content 9BizClaw với **đúng ba trang tính**, phục vụ thử nghiệm độc lập theo yêu cầu của chủ sản phẩm.

## Đọc bản đề xuất

1. [Hành trình khách hàng: từ nhận quà đến dùng hằng ngày](docs/HANH-TRINH-KHACH-HANG.md).
2. [Thiết kế ba trang tính và các trạng thái](docs/BA-TRANG-TINH.md).
3. [Phương án thử riêng và điều kiện trước khi xây](docs/THU-RIENG-VA-NGHIEM-THU.md).

## Trải nghiệm đích

**Nhận quà → gửi một câu trong 9B → cài có xác minh → đọc hồ sơ/ảnh đã có → chỉ hỏi phần thiếu → chốt phong cách qua bài mẫu → chọn ý tưởng → nhận thành phẩm → sửa/duyệt → đăng hoặc tải về.**

Hằng ngày khách chỉ cần hai quyết định: **ý nào làm** và **bài nào dùng/đăng**. Người muốn giao việc hoàn toàn qua chat có thể làm cả hai việc trong 9B; Google Sheet cho xem và duyệt hàng loạt.

| Trang tính | Việc của khách | Tần suất |
|---|---|---|
| `00. Thiết lập` | Xem hồ sơ AI đã điền; bổ sung/đổi mục tiêu, sản phẩm, giọng và mẫu | Lần đầu, rồi khi có thay đổi |
| `01. Ý tưởng` | Chọn ý để làm; bổ sung yêu cầu riêng | Khi chuẩn bị nội dung |
| `02. Bài viết & lịch đăng` | Xem chữ/ảnh/video, yêu cầu sửa, duyệt, chọn lịch và xem kết quả | Khi có bài mới và khi đăng |

Không tạo thêm tab ẩn, tab lọc “đã duyệt”, tab sản xuất, tab lịch hoặc tab báo cáo. Chức năng tương ứng được gộp vào ba trang trên; hồ sơ kỹ thuật nằm trong dữ liệu của gói thử.

## Thử độc lập

| Thành phần | Định danh đề xuất |
|---|---|
| Repository | `phuongnguyendhtm/freeup-content-9b-lab` — private trong giai đoạn duyệt |
| Gói | `freeup-content-gon-lab` |
| Lệnh vào | `/contentlab` — dự kiến, chưa đăng ký |
| Agent thử | `content-gon-test` — dự kiến, chưa tạo |
| Kho dữ liệu | `freeup-content-gon-lab-data` — dự kiến, chưa tạo |
| Sheet | Một file mới: `Content Gọn — Bản thử riêng — <doanh nghiệp>` |

Gói hiện tại `freeup-content-9b` và Sheet bảy tab tiếp tục là hệ thống riêng. Bản lab có schema ba tab riêng, bộ kiểm riêng và dữ liệu riêng. Thay tên repo mà dùng lại cùng command/worker/Sheet không đủ để tạo một thử nghiệm độc lập.

## Trước khi tiến hành xây

Kho hiện chỉ có tài liệu để xem xét. Câu lệnh cài, skill, Sheet thực và worker sẽ được triển khai sau khi hành trình được chốt. **Không gửi repo này cho khách như một bộ cài đã hoàn tất.**

Luồng cài mong muốn chỉ cần một câu khởi tạo. Việc đăng nhập/cấp quyền Google, chọn mẫu và duyệt bài thuộc về khách. Nếu 9B cần kết thúc lượt chat để cài nền, khách sẽ nhận hướng dẫn “Gửi Tiếp tục” ở lượt mới; tự tiếp tục hoàn toàn chỉ được công bố sau khi kiểm được cơ chế hỗ trợ của host.

Các bước thực tế hiện đã làm: tạo repo riêng, đặt private, viết bản hành trình và đặc tả ba tab. Chưa cài lên 9B, chưa tạo/đổi Sheet và chưa bật lịch hoặc đăng bài.
