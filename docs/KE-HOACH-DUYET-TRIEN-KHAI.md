# Kế hoạch quà tặng FreeUp Content cho 9BizClaw

> Bản thiết kế được lưu để đối chiếu. **Bản chạy hiện tại:** [Báo cáo 0.1.0](BAN-THU-0.1.0.md) · [Hướng dẫn khách hàng](HUONG-DAN-KHACH-HANG.md). Các trạng thái “chưa xây/cài” trong bản thiết kế mô tả thời điểm duyệt ban đầu.

**Bản duyệt ngày 22/10/2026.** Đã tạo repo thử riêng, mười mẫu Tri thức và ảnh menu v2. Tài liệu này chốt trải nghiệm và phạm vi cần xây; chưa có installer/skill lab chạy được hoặc tích hợp menu trong chat. Hệ thống 9B đang dùng chưa bị thay đổi.

## 1. Trải nghiệm khách hàng cần đạt

Khách nhận **một link GitHub và một câu lệnh để gửi vào 9B**. Hệ thống cài skill, đọc những gì khách đã có, hướng dẫn bổ sung đúng phần thiếu rồi giúp họ tạo bài đầu tiên. Sau đó, khách chỉ cần gọi **“hệ thống content”**, chọn kiểu và nói chủ đề.

Chat là nơi làm việc chính. Google Sheet có đúng ba trang để nghiên cứu, chọn ý, duyệt và quản lý lịch khi cần làm nhiều bài. Không bắt khách dùng bảng tính trước khi thử bài đầu tiên.

## 2. Menu chính thức để duyệt

![Menu hệ thống content với linh vật Mía](../assets/menu/he-thong-content-ngang-v2.png)

Ảnh ngang **1672 × 941**, có logo FreeUp và linh vật cáo Mía. Đây là menu hướng dẫn của quà tặng; nội dung làm cho khách dùng thương hiệu, người và sản phẩm của chính khách.

| Số | Khách chọn | Bộ kết quả mặc định |
|---|---|---|
| 1 | Bài viết | Bài chữ sẵn để sao chép/đăng |
| 2 | **Bài đăng kèm sản phẩm** | Bài bán hàng/giới thiệu + ảnh sản phẩm thật, hoặc banner sản phẩm/ưu đãi + bài đăng |
| 3 | Ảnh cá nhân + quan điểm | Ảnh đúng người + câu quan điểm ngắn trên hình + bài viết triển khai quan điểm |
| 4 | Ảnh minh họa insight | Hình diễn đạt insight + bài viết giải thích vấn đề, nguyên nhân và hướng xử lý |
| 5 | Carousel / album | Bộ ảnh/slides có thứ tự + một caption chung cho cả bộ |
| 6 | Infographic / sơ đồ | Hình trình bày kiến thức/quy trình + bài viết giải thích, dẫn dắt áp dụng |
| 7 | Video B-roll có chữ | Video cảnh quay thật có chữ + caption; phụ đề khi phù hợp |
| 8 | Video có giọng đọc | Video + giọng đọc được hỗ trợ/đã xác nhận + caption; phụ đề khi phù hợp |
| 9 | Chuỗi bình luận | Bài mở đầu + chuỗi bình luận nối tiếp có thứ tự |
| 0 | Làm theo lịch | Lập kế hoạch rồi tạo các bài thuộc chín định dạng trên |

**Các dạng có ảnh/video đều có bài viết hoặc caption đi kèm.** Độ dài theo mục tiêu, kênh và brief; không ép banner có bài dài hoặc mọi bài đều chốt bán. Chữ trên hình, lời đọc, phụ đề và caption có vai trò khác nhau. Một carousel dùng một caption chung, không cần bài riêng cho từng slide.

Khách chủ động yêu cầu chỉ thiết kế một ảnh thì xử lý thành tác vụ asset riêng, không tạo hoặc đánh dấu post job hoàn chỉnh. Khi chuyển thành bài đăng, phải có caption và qua helper/QA bình thường.

### Thay đổi riêng cho mục 2

Không còn lựa chọn chung “bài đăng kèm ảnh đơn”. Mục 2 tập trung vào **sản phẩm/dịch vụ khách đang cung cấp**:

- Nếu khách nói “viết bài bán sản phẩm A”, dùng thông tin và ảnh A, viết bài bán hàng/giới thiệu phù hợp; ảnh có thể dùng nguyên bản hoặc bố trí thêm theo brief.
- Nếu khách nói “làm banner sản phẩm A”, dựng banner từ ảnh thật và nhận diện đã có, đồng thời viết caption phù hợp để đăng.
- Chỉ hỏi chọn hai cách trên nếu yêu cầu chưa rõ. Không tạo thêm một mục menu.

Ảnh phải đúng sản phẩm/biến thể; không làm đổi bao bì, nhãn, màu hay hình dáng. Ưu tiên ghép ảnh thật với bố cục/chữ khi khách cần banner. Giá, công dụng, ưu đãi, hạn sử dụng, chứng nhận và lời chứng thực phải có nguồn. Có khuyến mãi thì kiểm điều kiện, thời hạn tại ngày dự kiến đăng. Thiếu ảnh đúng sản phẩm hoặc dữ kiện cần thiết thì hỏi đúng phần đó.

Với sản phẩm số hoặc dịch vụ, dùng screenshot, hình hoạt động hay asset thật phù hợp đã được khách xác nhận. Không yêu cầu ảnh bao bì/SKU nếu đối tượng không có; kiểm độ trung thực theo các đặc điểm thực sự áp dụng, không bịa hộp sản phẩm vật lý.

## 3. Hành trình từ nhận quà tới bài đầu tiên

| Bước | Khách làm | 9B làm và điều kiện chuyển bước |
|---|---|---|
| 1. Nhận quà | Mở GitHub, sao chép một câu vào chat 9B | Kiểm host và khả năng cài; khách không cần Git, terminal hay chép thư mục |
| 2. Cài đặt | Chờ thông báo; gửi “Tiếp tục” nếu host cần lượt chat mới | Cài đúng release và namespace riêng; kiểm inventory/receipt trước khi báo thành công |
| 3. Kiểm hồ sơ | Xem bản tóm tắt đã có/còn thiếu | Đọc hồ sơ, Tri thức và ảnh đúng doanh nghiệp; không hỏi lại dữ liệu đã biết |
| 4. Bổ sung | Mở đúng mẫu được gửi, điền phần thiếu, nộp vào Tri thức; nhắn **Tôi đã hoàn tất** | Gửi link theo trường thiếu; đọc lại tài liệu thật, không chỉ kiểm tên file |
| 5. Chuẩn bị tài nguyên | Nếu cần, nạp ảnh vào Hình ảnh doanh nghiệp và clip/nhạc vào thư mục được chỉ dẫn | Dùng lại ảnh đã có; tạo đường dẫn máy khách, quét file thực sau câu hoàn tất |
| 6. Chọn làm thử | Chọn số/tên trên menu và nói chủ đề | Gửi menu ảnh; hỏi đúng dữ kiện còn thiếu cho định dạng đó, đề xuất chủ đề nếu cần |
| 7. Nhận và sửa bài | Xem cả chữ lẫn media, góp ý | Tạo trọn bộ, kiểm caption/media và dữ kiện; giữ mã bài, tăng phiên bản khi sửa |
| 8. Dùng hằng ngày | Tải bộ bài, tự đăng hoặc duyệt đăng đúng kênh/giờ | Lưu thành phẩm và liên kết Sheet; chỉ ghi đã đăng khi có bằng chứng thật |

**Gọi “hệ thống content” phải hiện menu ngay**, kể cả onboarding chưa xong. Sau khi chọn mới kiểm phần cần cho nhánh đó. Chưa có B-roll không chặn bài chữ/ảnh; chưa có ảnh chân dung không chặn bài sản phẩm. Mở menu không tự tạo hoặc đăng bài. Một chữ số chỉ được hiểu là lựa chọn khi đang chờ chọn menu.

Câu cài dự kiến sau khi phát hành bộ cài:

> Cài bộ FreeUp Content từ [link GitHub quà tặng] vào 9B của tôi. Sau khi cài, kiểm tra hồ sơ doanh nghiệp, Tri thức và ảnh đã có; hướng dẫn bổ sung đúng phần thiếu rồi hiện menu hệ thống content để tôi làm thử.

Repo lab hiện chưa có bộ cài, nên chưa quảng bá câu này như lệnh cài chạy được. Nếu host phải rảnh sau lượt chat mới cài nền, triển khai thông báo “gửi Tiếp tục ở lượt mới”; chỉ hứa tự tiếp tục khi callback đã kiểm thử được.

## 4. Cá nhân hóa mà không bắt điền lại mọi thứ

Đọc dữ liệu theo **ý nghĩa**, không theo tên mẫu. Tài liệu khác tên nhưng đã có USP, khách hàng, giọng điệu và nhận diện vẫn được dùng. Mẫu chưa điền không được coi là dữ liệu đầy đủ.

| Mẫu Tri thức | Dùng để bổ sung khi cần |
|---|---|
| 01. Công ty và nhận diện | Doanh nghiệp, USP, bằng chứng, màu, logo, font, phong cách |
| 02. Nhà sáng lập | Câu chuyện, chuyên môn, quan điểm cá nhân |
| 03. Sản phẩm và dịch vụ | Sản phẩm, lợi ích, giá/chính sách, điểm khác biệt |
| 04. Chân dung khách hàng | Đối tượng, vấn đề, mong muốn, rào cản |
| 05. Kịch bản bán hàng | Tư vấn, xử lý phản đối, ranh giới cam kết |
| 06. Kế hoạch marketing | Mục tiêu, kênh, chiến dịch, CTA |
| 07. Chăm sóc khách hàng | FAQ, hỗ trợ và chính sách sau bán |
| 08. Cách AI làm việc | Sở thích làm việc và cách hỏi khi chưa rõ |
| 09. Phong cách nội dung | Cấu trúc, độ dài, trình bày và ví dụ |
| 10. Giọng điệu và ngôn ngữ | Xưng hô, giọng, từ nên dùng/tránh |

Đã tách thành [mười mẫu](../templates/knowledge/README.md), giữ 53 câu hỏi gốc và đánh dấu phần nhận diện bổ sung. Không buộc khách hoàn thành cả mười mẫu trước khi tạo bài hữu ích.

Ví dụ, chỉ thiếu màu và giọng: gửi mẫu 01, chỉ rõ mục nhận diện, cùng mẫu 10; không yêu cầu điền lại công ty và toàn bộ sản phẩm. Khách có thể nhờ 9B soạn từ dữ liệu thật rồi xác nhận, sau đó nộp vào Tri thức.

Lưu doanh nghiệp, nguồn đã đọc, trường còn thiếu, link mẫu đã gửi và bước đang chờ. Câu **Tôi đã hoàn tất** kích hoạt đọc lại Tri thức/media. Nếu còn indexing thì giữ tiến độ; nếu còn thiếu một mục thì hỏi đúng mục đó. Thông tin mâu thuẫn phải được làm rõ, không lấy suy đoán làm dữ kiện đã xác nhận.

## 5. Tài nguyên đầu vào và nội dung đầu ra

**Ảnh gốc ưu tiên Hình ảnh doanh nghiệp của 9B**, giữ ID nguồn. Không yêu cầu khách tải cùng ảnh vào một “Media input” nữa. Với video, nhạc và file bổ sung, tạo các thư mục tiếng Việt:

```text
<workspace khách>/Nội dung của tôi/
  Tài nguyên của tôi/
    Video cảnh quay/
    Nhạc nền/
    Giọng đọc/
    Ảnh bổ sung/              (khi cần)
    Logo và nhận diện/        (khi cần)
  Hồ sơ cần hoàn thiện/
  Nội dung đã tạo/
    <ngày>/<loại> - <tiêu đề>/
      Bài viết.txt
      Xem bài.html
      Ảnh 01.png
      Video.mp4
      Phụ đề.srt
```

Chỉ tạo file phù hợp với bài thực tế. **Bài viết.txt** là bản dễ sao chép; **Xem bài.html** cho xem cả chữ và media. File kỹ thuật nội bộ như `caption.txt`, manifest và log có thể giữ tên cũ, được ánh xạ với bản giao tiếng Việt; không bắt khách tìm trong `runtime` hoặc `scripts`.

Sau cài phải tạo/kiểm thư mục thật rồi gửi đường dẫn tuyệt đối trên máy khách. Trên điện thoại, dùng link Drive của khách nếu đã nối và kiểm quyền; đường dẫn máy tính không thay cho link upload từ xa. Khi báo tải xong phải kiểm file đọc được, không tính thư mục rỗng là có tài nguyên.

## 6. Đúng ba trang tính

| Trang | Khách điền/chọn | Hệ thống cập nhật |
|---|---|---|
| **00. Nguồn tham khảo** | Link nguồn, chủ đề muốn học, bật/tắt, ghi chú | Lần đọc, kết quả và vấn đề truy cập |
| **01. Ý tưởng** | Ý tự thêm hoặc chọn ý AI đề xuất, định dạng, yêu cầu | Góc triển khai, nguồn, mã ý, trạng thái sản xuất |
| **02. Bài viết & lịch đăng** | Góp ý, duyệt, kênh/tài khoản, ngày giờ | Bài chữ, link media/xem bài, phiên bản, tiến độ, kết quả đăng |

Không có tab Thiết lập hoặc tab ẩn. Hồ sơ nằm trong Tri thức; ảnh nằm trong thư viện 9B; cấu hình kỹ thuật và trạng thái nằm trong kho hệ thống riêng. Mã ý/bài thống nhất giữa chat và Sheet để không tạo hai job cho cùng lựa chọn. Chi tiết trường và trạng thái: [Ba trang tính](BA-TRANG-TINH.md).

## 7. Dùng lại hai hệ thống như thế nào

| Nguồn | Dùng lại | Điều chỉnh cho quà tặng |
|---|---|---|
| 100X Social Content Agent | Ý tưởng có nguồn, nội dung nền, tách caption/media, quy trình render và duyệt | Chuyển workflow/công cụ sang host 9B; kiểm artifact thay vì chỉ tin workflow báo xong |
| FreeUp Content 9B hiện tại | Kiểm dữ kiện, viết đúng giọng, nhánh insight, native media, kiểm caption và duyệt theo phiên bản | Gói riêng, menu mới, sản phẩm thật, onboarding theo phần thiếu, ba tab, giao thư mục tiếng Việt |
| 9BizClaw | Hồ sơ, Tri thức, Hình ảnh doanh nghiệp, kết nối và công cụ sẵn có | Kiểm capability thực rồi gọi đúng schema; không giả định có video/audio, callback hoặc tự chuyển model |

Kết quả kiểm nguồn: các workflow ảnh/carousel/infographic tham khảo đều có caption. Bản FreeUp đang cài có code chặn caption thiếu/rỗng. Lab phải giữ mức kiểm này, bổ sung kiểm ảnh sản phẩm và tính hợp lệ ưu đãi. [Bằng chứng và giới hạn từng repo](DOI-CHIEU-BAI-VIET-VA-MEDIA.md).

## 8. Cách xây và thử riêng

Repo: **freeup-content-9b-lab**. Package dự kiến `freeup-content-gon-lab`, lệnh kỹ thuật `/contentlab`, kho `freeup-content-gon-lab-data`, agent/workspace/Sheet/queue riêng khi host hỗ trợ. Trong agent thử, câu tự nhiên “hệ thống content” mở menu lab; không đăng ký hai bộ điều phối trùng câu vào agent đang dùng.

| Chặng | Việc cần xây | Điều kiện chuyển chặng |
|---|---|---|
| A. Bộ chạy tối thiểu | Skill điều phối + menu cố định + đọc capability/hồ sơ/media + lưu trạng thái | Gọi menu đúng; đọc đúng doanh nghiệp; không hỏi lại dữ liệu có sẵn |
| B. Onboarding và một bài | Gửi mẫu thiếu, đọc lại sau hoàn tất, resolver đường dẫn, sản xuất và QA | Bài 1, 2, 4 chạy trọn luồng; đúng ảnh sản phẩm; có caption/media/file thật |
| C. Đủ chín định dạng | Chân dung, carousel, sơ đồ, video, chuỗi bình luận | Mỗi định dạng có bộ thành phẩm phù hợp; nhánh thiếu công cụ báo đúng trạng thái |
| D. Ba trang tính | Tạo master sạch, liên kết chat–Sheet, chọn/sửa/duyệt | Đúng ba tab; không nhân đôi job; sửa bản nào duyệt bản đó |
| E. Bộ cài một câu | Release có phiên bản, kiểm tương thích, cài mới/cài lại/nâng bản và rollback lab | Không cần sửa tay; không ghi đè bộ cũ; không phụ thuộc đường dẫn máy người tặng |
| F. Pilot và phát quà | Thử người mới, đo thời gian/chi phí/lỗi, rồi đóng gói phát hành | Khách hoàn tất bài đầu; link/release truy cập được từ tài khoản khách |

Đăng tự động và worker theo lịch chỉ bật sau khi sản xuất/duyệt đã ổn, kết nối kênh có thật và kiểm được receipt/permalink. Trước đó khách vẫn tải trọn bộ để tự đăng. Repo đang private phục vụ duyệt; trước phát quà cần bản phân phối sạch có quyền truy cập phù hợp.

## 9. Các tiêu chí không được bỏ khi triển khai

- Cài lại không tạo skill/kho/Sheet thứ hai; không đụng bộ đang vận hành.
- Menu v2 xuất hiện như ảnh trong chat hỗ trợ ảnh; có chữ dự phòng nếu gửi ảnh lỗi. Mở menu không sinh job.
- Hồ sơ tương đương được dùng lại; file trống hoặc câu “hoàn tất” không vượt qua kiểm tra dữ liệu.
- Bài visual thiếu/rỗng caption, thiếu media thật hoặc QA sai phiên bản không được chuyển sang sẵn sàng duyệt/đăng.
- Ảnh sai người/sản phẩm, ưu đãi sai/hết hạn hoặc claim không có nguồn phải quay lại sửa.
- Đường dẫn có dấu và khoảng trắng hoạt động trên máy sạch; khách chỉ thao tác các mục tiếng Việt.
- Chưa nối Google hoặc chưa có video không làm khóa các nhánh đang đủ điều kiện.
- Thay caption hoặc media sau duyệt phải duyệt phiên bản mới; lỗi đăng không được tự thử lại gây bài trùng.

Chi tiết kịch bản: [Thử riêng và nghiệm thu](THU-RIENG-VA-NGHIEM-THU.md).

## 10. Chọn model và kiểm chi phí

**Giữ GPT-6.1 Sol làm mặc định**, phù hợp kết nối 9B đã thấy; dùng suy luận cao khi xây/kiểm lỗi phức tạp. Chỉ nâng lên GPT-6 Astra ở ca khó hoặc nội dung quan trọng chưa đạt. Claude Sonnet 5.5 là phương án so sánh nếu host hỗ trợ, sau pilot cùng đề bài và tiêu chí giọng Việt.

Giá direct API tham khảo ngày 22/10/2026: Sol và Sonnet 5.5 cùng $2 input/$10 output trên một triệu token; Astra $10/$50. Với giả định 100 lượt, mỗi lượt 8.000 input + 2.000 output tính tiền, lần lượt khoảng **$3,60 / $3,60 / $18**, chưa gồm ảnh, công cụ, retry và lượt duyệt thêm. [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).

9B hiện khai báo kết nối `openai-chatgpt-responses`; bảng API không chứng minh cách tính tiền của kết nối đó. Không bắt khách mua API key mới để dùng kết nối họ đã có. [Chi tiết model, giả định và tối ưu](MODEL-VA-CHI-PHI.md).

Tiết kiệm bằng menu tĩnh dùng lại, tái sử dụng ảnh sản phẩm thật, render banner từ template, chỉ nạp tài liệu cần cho tác vụ, dùng code kiểm trường/file và giới hạn số vòng sửa. Model ảnh là ngân sách riêng; chọn model chỉ sau khi xác nhận công cụ ảnh host thực sự hỗ trợ và chất lượng giữ đúng sản phẩm.

## 11. Trạng thái bàn giao bản duyệt

Đã có **repo thử riêng, bản kế hoạch, mười mẫu Tri thức, đặc tả ba tab, menu v2 có Mía và đối chiếu nguồn**. Chưa cài bộ lab lên 9B, chưa tạo Sheet thực và chưa bật job/đăng nền. Khi chốt trải nghiệm này, triển khai theo các chặng A–F ở trên và nghiệm thu trên môi trường lab.
