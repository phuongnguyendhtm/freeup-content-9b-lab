# Tự bổ sung trình dựng ảnh và video local

**22/10/2026 · Trợ lý 9B thực hiện khi cần dựng local; khách không phải chạy npm hoặc sửa kỹ thuật. Tạo media native vẫn dùng được khi host có công cụ phù hợp.**

Helper `scripts/setup-renderer.cjs` nằm trong skill đã cài. Khi cần renderer local mà kiểm tra còn thiếu, trợ lý gọi:

```text
node scripts/setup-renderer.cjs --workspace ABS --probe
node scripts/setup-renderer.cjs --workspace ABS --install
```

`ABS` phải là workspace tuyệt đối của **agent lab đang làm việc**. Nếu host đã xác định Chrome/Edge ở vị trí khác, truyền thêm `--browser-executable ABS_BROWSER`. Trợ lý thay bằng đường dẫn thật trên máy khách, dùng mảng tham số; không gửi biến giữ chỗ hoặc đường dẫn máy người hướng dẫn như kết quả đã tạo.

`--probe` là mặc định khi chưa chọn mode. Nó tìm trình duyệt, module runtime và thử `ffmpeg -version`, không tải/cài phụ thuộc, không tạo thư mục hay cấu hình. Kết quả `ready` của probe chỉ phản ánh các phụ thuộc đã tìm thấy; `browserLaunch: not_probed` nói rõ chưa mở trình duyệt ở lượt đó. Một bản dựng nội dung vẫn phải mở/giải mã và QA thật.

`--install` là yêu cầu rõ ràng cho trợ lý tự bổ sung phần thiếu. Node phải từ 22 trở lên. Helper tìm npm CLI cạnh Node của 9B hoặc trên PATH, rồi gọi **Node + đường dẫn npm-cli.js + mảng tham số**; không chạy `npm.cmd` qua một chuỗi shell. Nếu Node có sẵn mà npm chưa có, helper tải **npm 10.9.9** từ registry chính thức, đối chiếu SHA512 đã chốt rồi giải nén bằng Node vào kho lab. Không cần khách cài Git/npm riêng.

Phụ thuộc được chốt từ metadata registry chính thức ngày 22/10/2026: [puppeteer-core 24.43.1](https://registry.npmjs.org/puppeteer-core/24.43.1), [ffmpeg-static 5.3.0](https://registry.npmjs.org/ffmpeg-static/5.3.0), [npm 10.9.9](https://registry.npmjs.org/npm/10.9.9). npm 10 được dùng cho bootstrap vì tương thích toàn bộ Node 22, thay vì bắt nâng Node lên mức tối thiểu của npm mới hơn.

Helper ưu tiên **Edge/Chrome đã cài** ở các vị trí chuẩn Windows/macOS/Linux hoặc đường dẫn host chỉ rõ. `puppeteer-core` không tải thêm Chrome; `PUPPETEER_SKIP_DOWNLOAD=true` cũng được đặt khi cài. Nếu máy chưa có trình duyệt phù hợp, helper trả phần thiếu và không nhận renderer đã sẵn sàng; workflow có thể dùng công cụ media native đã kiểm. FFmpeg có sẵn và chạy được được dùng lại; nếu chưa có, helper cài `ffmpeg-static`, với binary tải theo cơ chế chính thức của package từ bản phát hành của maintainer.

Mọi file phụ trợ nằm riêng trong:

```text
<workspace lab>/freeup-content-gon-lab-data/runtime/
  renderer-deps/             # puppeteer-core, ffmpeg-static khi cần và package-lock
  renderer.json             # cấu hình đường dẫn tuyệt đối đã kiểm
  npm-10.9.9/                # chỉ có khi cần bootstrap npm
  npm-cache/
  user.npmrc
  global.npmrc
```

Không cài vào thư mục skill, không sửa bộ content đang hoạt động, Node của host hoặc thư mục nội dung khách. npm dùng registry/cache/cấu hình riêng; token npm, `NODE_OPTIONS` và registry tùy biến của môi trường không được chuyển vào lượt cài này. Package-lock phải khớp phiên bản/integrity chính thức của hai phụ thuộc trực tiếp và không được chuyển dependency sang registry khác.

Bootstrap chỉ nhận HTTPS tại `registry.npmjs.org`; tar phải có gốc `package/`, checksum hợp lệ, giới hạn kích thước và số file. Trình giải nén từ chối đường dẫn tuyệt đối, `..`, tên ổ đĩa, symlink/hardlink và tên trùng; không dùng lệnh giải nén bên ngoài. Dữ liệu tải về không được chạy trước khi SHA512 và cấu trúc gói đạt.

Sau cài, helper phải chạy được **FFmpeg thật**, mở Chrome/Edge bằng module đã cài và nhận **PNG thật trong bộ nhớ**. Chỉ sau các kiểm này mới ghi `renderer.json` với `browserModule`, `browserExecutable`, `ffmpeg`, phiên bản và thời điểm kiểm. Bộ điều phối render đọc cấu hình rồi truyền đúng các đường dẫn đó cho renderer; file HTML hoặc script cài thành công không thay cho PNG/video thành phẩm.

Chạy lại khi runtime đã đủ sẽ kiểm trình duyệt/FFmpeg và dùng lại module, không cài npm lần nữa. Mỗi lượt có khóa riêng, phụ thuộc mới được cài vào stage rồi chuyển sang đích; bản runtime trước được giữ backup khi cần đổi. Thư mục phụ thuộc không có dấu sở hữu của lab hoặc đường dẫn qua junction/symlink sẽ bị từ chối.

Nếu mạng chặn registry hoặc nguồn binary, npm lỗi, trình duyệt không mở được hoặc FFmpeg không chạy, helper trả mã lỗi, giữ trạng thái chưa sẵn sàng và không ghi cấu hình thành công giả. Trợ lý kiểm đúng phần lỗi và thử lại khi điều kiện đã được xử lý; không bắt khách thao tác npm hay tự gửi token. Cài thành công chỉ xác nhận năng lực local, không tự cấp quyền đăng hoặc bỏ qua QA caption/media của bài.
