# Đối chiếu bài viết, caption và media

**Kiểm tra chỉ đọc ngày 22/10/2026.** Đã đọc nguồn qua GitHub connector và các file đang cài trong bản cài `skills/freeup-content-system` của 9B. Không chạy renderer, gửi bài, sửa runtime hay cấu hình.

## Kết luận áp dụng cho menu

**Một nội dung visual hoàn chỉnh để đăng gồm caption + media thật**, kể cả Visual Insight. Chữ trên hình là phần cô đọng; caption bổ sung tình huống, nguyên nhân, ý nghĩa hoặc bước tiếp theo. Caption không bắt buộc là một bài dài và không bắt mọi nội dung phải chốt bán. Một bộ carousel có một caption chung; không cần một bài viết riêng cho từng slide.

Theo yêu cầu mới, mục 2 nên mang tên **“Bài đăng kèm sản phẩm”**: dùng asset sản phẩm thật của khách, có thể triển khai thành bài bán hàng hoặc banner kèm caption. Đây là định hướng cần đưa vào bản lab; chưa được coi là workflow sản phẩm đã triển khai chỉ vì renderer hiện có format `image`.

## Bằng chứng trong repo tham khảo

Repo `tauhb/100X-Social-Content-Agent`, nhánh `main` tại thời điểm kiểm tra: commit `3dffed2071b858d67afe95330d6463093cc65ed3`.

| Nguồn đã đọc | Bằng chứng caption đi cùng media |
|---|---|
| [tao_anh.md, dòng 25–40](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/.agents/workflows/tao_anh.md#L25-L40) | Tạo hoặc dùng lại `master_content.md`, ghi toàn bộ nội dung vào `caption.txt`; báo kết quả gồm caption và PNG. |
| [tao_carousel.md, dòng 14–35](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/.agents/workflows/tao_carousel.md#L14-L35) | Tạo/dùng master content, ghi caption; chỉ rút chữ trên slide. |
| [tao_infographic.md, dòng 14–28](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/.agents/workflows/tao_infographic.md#L14-L28) | Tạo/dùng master content, ghi vào `infographic/caption.txt`, đồng thời tạo HTML. |
| [image_specialist.md, dòng 11–13](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/skills/media/image_specialist.md#L11-L13) | Hai đầu ra song song: caption đầy đủ và HTML chỉ trích câu ngắn. |
| [carousel_specialist.md, dòng 16–17 và 100–101](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/skills/media/carousel_specialist.md#L16-L17) | Giảm chữ trên slide; nội dung dài giữ trong caption. |
| [infographic_specialist.md, dòng 61 và 71–84](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/skills/media/infographic_specialist.md#L61) | Hình chỉ chọn 4–5 luận điểm; bước đồng bộ vẫn nhận Caption và Media. Bản specialist không tự lặp lại toàn bộ quy tắc ghi caption của workflow. |

Phải phân biệt quy tắc viết trong workflow với kiểm tra kỹ thuật: ba engine `html_image_engine.js`, `html_carousel_engine.js`, `html_infographic_engine.js` đọc HTML và xuất ảnh; không có thao tác tạo/kiểm caption. [google_sync_engine.js:117](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/scripts/google_sync_engine.js#L117) nhận caption làm tham số và chuyển lên Sheet, không kiểm rỗng tại hàm này. [publish_engine_pw.js:42–50](https://github.com/tauhb/100X-Social-Content-Agent/blob/3dffed2071b858d67afe95330d6463093cc65ed3/scripts/publish_engine_pw.js#L42-L50) cảnh báo rồi trả chuỗi rỗng nếu không tìm thấy file caption. Vì vậy render thành công chưa chứng minh gói bài đã đủ.

## Bằng chứng trong FreeUp và bản đang cài

Repo `phuongnguyendhtm/freeup-content-9b`, `main` tại thời điểm kiểm tra: commit `261d45f3a7737348aad1aa4985be7bf805277d5b`. Các quy tắc dưới đây cũng có trong reference local đã đọc.

- [copywriting.md:47–49](https://github.com/phuongnguyendhtm/freeup-content-9b/blob/261d45f3a7737348aad1aa4985be7bf805277d5b/package/skills/freeup-content-system/references/copywriting.md#L47-L49): lưu caption riêng khỏi metadata; caption Insight đào sâu nguyên nhân; kiểm nguồn, ngôi kể, sản phẩm và CTA có thật. Master content dùng khi cần, không ép mọi caption theo bài dài.
- [visual-insight.md:42–48](https://github.com/phuongnguyendhtm/freeup-content-9b/blob/261d45f3a7737348aad1aa4985be7bf805277d5b/package/skills/freeup-content-system/references/visual-insight.md#L42-L48): có mục Caption riêng, thường 150–350 từ hoặc theo brief; đào sâu insight, không kể vị trí các vật thể và không áp chốt bán cho mọi bài. Tiêu chí hình hiểu được khi chưa đọc caption không có nghĩa được bỏ caption.
- [delivery.md:5](https://github.com/phuongnguyendhtm/freeup-content-9b/blob/261d45f3a7737348aad1aa4985be7bf805277d5b/package/skills/freeup-content-system/references/delivery.md#L5): thư mục bài chứa caption, nội dung nền, hồ sơ, nguồn và media đã xuất. Dòng 31 yêu cầu caption dễ sao chép kèm kết quả.
- **Có kiểm tra bằng code:** [content.cjs:27–43](https://github.com/phuongnguyendhtm/freeup-content-9b/blob/261d45f3a7737348aad1aa4985be7bf805277d5b/package/skills/freeup-content-system/scripts/content.cjs#L27-L43) báo `Caption trống.` cho mọi format nếu file thiếu/rỗng; visual phải có media thật và QA đúng phiên bản. Bản `content.cjs` local, dòng 29 có cùng kiểm tra caption. Caption có chữ chưa tự chứng minh chất lượng tốt: vẫn cần duyệt nội dung.

`caption` tùy chọn trong công cụ gửi ảnh là tùy chọn của thao tác vận chuyển; caption bài vẫn có thể được giao riêng dưới dạng văn bản/file. Nó không tạo ngoại lệ cho gói bài đăng. Nếu sau này khách chỉ yêu cầu asset thiết kế độc lập, cần định nghĩa nhánh riêng; helper hiện tại chưa có miễn caption cho nhánh đó.

## Gói “Bài đăng kèm sản phẩm” đề xuất

1. Đọc ảnh/tệp sản phẩm khách đã cung cấp và xác nhận đúng SKU/phiên bản. Lưu nguồn, quyền dùng, đường dẫn/asset ID và việc đã mở xem.
2. Dùng đúng hình sản phẩm khi ghép banner. Giữ hình dáng, màu, bao bì, logo, nhãn, số lượng và chi tiết nhận diện. Ưu tiên ghép từ asset thật; nếu tạo/chỉnh bằng AI, dùng reference đúng và so ảnh đầu ra với ảnh nguồn. Không thay sản phẩm bằng hình tưởng tượng khi thiếu asset.
3. Viết caption bán hàng hoặc caption giới thiệu theo mục tiêu. Giá, ưu đãi, thời hạn, công dụng, chứng nhận, tồn kho và lời chứng thực phải có nguồn được xác nhận. Thiếu dữ kiện thì bỏ claim hoặc yêu cầu đúng phần thiếu; không bịa cho đủ bố cục.
4. Giao `caption.txt` + ảnh/banner thật + nguồn/thiết kế + QA cùng một job. Kiểm chữ tiếng Việt, độ đọc trên điện thoại và tính nhất quán giữa caption với chữ trên ảnh. Cả nội dung và media phải được duyệt đúng phiên bản trước đăng.

Căn cứ hiện có cho giữ ảnh: [rendering.md:16,30,54](https://github.com/phuongnguyendhtm/freeup-content-9b/blob/261d45f3a7737348aad1aa4985be7bf805277d5b/package/skills/freeup-content-system/references/rendering.md#L16) giữ nguồn gốc, map ảnh local sang `image` hoặc native reference đúng schema. **Giữ file gốc không chứng minh hình sản phẩm trong ảnh AI đã đúng**; kiểm độ trung thực sản phẩm ở trên là yêu cầu QA cần bổ sung vào nhánh mới. Bản local có thêm hướng dẫn xuất native asset và không thay yêu cầu minh họa bằng mẫu toàn chữ khi export lỗi; repo remote đang khác ở phần bổ sung này.
