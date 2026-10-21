# FreeUp Content Gọn cho 9BizClaw

**Bản duyệt cập nhật 22/10/2026.** Repo thử riêng cho quà tặng khách mua 9BizClaw. Đã có kế hoạch, mười mẫu Tri thức và menu ảnh v2; **chưa có bộ cài/skill lab thực thi hoặc tích hợp chat 9B**.

**Bắt đầu tại [Kế hoạch để duyệt và triển khai](docs/KE-HOACH-DUYET-TRIEN-KHAI.md)** — từ câu cài, kiểm hồ sơ và tài nguyên đến bài đầu tiên, ba trang tính và chọn model.

![Menu hệ thống content](assets/menu/he-thong-content-ngang-v2.png)

## Quyết định mới

- Mục 2: **Bài đăng kèm sản phẩm**, dùng sản phẩm thật của khách; làm bài bán hàng hoặc banner kèm bài đăng.
- Các định dạng ảnh/video đều giao **bài viết/caption + media** phù hợp; một carousel có một caption chung. Ảnh lẻ chỉ theo yêu cầu rõ ràng, tách khỏi bài đăng hoàn chỉnh.
- Gọi **“hệ thống content”** trong chat 9B sẽ mở menu ảnh ngang có linh vật Mía. Đây là hành vi cần tích hợp; ảnh menu đã được tạo và kiểm.
- Dùng lại **Tri thức** và **Hình ảnh doanh nghiệp**; chỉ gửi mẫu liên quan phần thiếu, không bắt điền đủ mười file.
- Thư mục khách sử dụng có tên tiếng Việt: **Tài nguyên của tôi**, **Video cảnh quay**, **Nhạc nền**, **Giọng đọc**, **Hồ sơ cần hoàn thiện**, **Nội dung đã tạo**.

## Đúng ba trang tính

| Trang | Công việc |
|---|---|
| 00. Nguồn tham khảo | Nguồn chuyên gia, kênh, website và tài liệu muốn nghiên cứu |
| 01. Ý tưởng | Ý mới, góc triển khai, nguồn, định dạng và chọn làm |
| 02. Bài viết & lịch đăng | Bài, media, góp ý, duyệt, tài khoản, thời gian và kết quả đăng |

Hồ sơ nằm trong Tri thức 9B; ảnh ở Hình ảnh doanh nghiệp. Không có tab Thiết lập hoặc tab ẩn. Chưa nối Google vẫn có thể làm mẫu trong chat/local khi phần thực thi được triển khai.

## Tài liệu và hợp đồng dữ liệu

- [Kế hoạch duyệt](docs/KE-HOACH-DUYET-TRIEN-KHAI.md).
- [Hành trình khách hàng và ví dụ chat](docs/HANH-TRINH-KHACH-HANG.md).
- [Ba trang tính](docs/BA-TRANG-TINH.md).
- [Kiểm hồ sơ và tiếp tục onboarding](docs/KIEM-HO-SO-VA-TIEP-TUC.md).
- [Tài nguyên, thư mục và menu](docs/MEDIA-VA-MENU.md).
- [Kiểm caption/media trong hai repo](docs/DOI-CHIEU-BAI-VIET-VA-MEDIA.md).
- [Model và chi phí](docs/MODEL-VA-CHI-PHI.md).
- [Mười mẫu Tri thức](templates/knowledge/README.md) · [Tải bộ mười mẫu](downloads/10-mau-tri-thuc-9bizclaw.zip).
- Hợp đồng thiết kế: [Tri thức](onboarding/knowledge-catalog.json), [menu](onboarding/menu-catalog.json), [đường dẫn khách](onboarding/customer-paths.json). Các JSON này chưa phải chương trình chạy.
- [Thử riêng và nghiệm thu](docs/THU-RIENG-VA-NGHIEM-THU.md).

## Phạm vi thử và phân phối

Package dự kiến `freeup-content-gon-lab`, lệnh `/contentlab`, agent/workspace, kho `freeup-content-gon-lab-data`, Sheet, queue và lịch riêng. Chưa cài vào 9B hoặc thay bộ FreeUp đang vận hành. Chưa công bố câu cài chạy được trước khi installer qua nghiệm thu.

Repo đang **private** phục vụ duyệt. Trước phát quà cần bản phân phối sạch hoặc quyền truy cập thích hợp, kiểm tải bằng tài khoản khách. Không đưa hồ sơ riêng, ảnh riêng hoặc thông tin xác thực vào repo phân phối.
