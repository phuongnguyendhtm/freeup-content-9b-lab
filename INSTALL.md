# Cài FreeUp Content Gọn trong 9BizClaw

Tài liệu cho **trợ lý 9B thực hiện** sau khi chủ yêu cầu cài. Khách chỉ gửi câu nhận quà trong README; không yêu cầu khách thao tác terminal, Git hoặc sửa JSON.

## 1. Chuẩn bị gói và đúng workspace

Đọc `gift-manifest.json`, `package.json` và hướng dẫn này. Lấy release ZIP và SHA256SUMS từ chính repo quà tặng; kiểm hash và giải nén vào thư mục tải tạm của khách. Nếu dùng source archive, xác nhận nguồn đúng repo/commit; không nhận là release đã kiểm manifest khi chỉ tải main. Repo private cần quyền truy cập hợp lệ; không xin token/mật khẩu hoặc coi trang HTML đăng nhập là file ZIP.

Lấy đường dẫn Node và OpenClaw từ host 9B hiện tại; không tải một bản 9B khác. Dùng Node từ 9B, phiên bản ít nhất 22. Tất cả lệnh dùng argument arrays và đường dẫn tuyệt đối.

Khi trên máy đã có FreeUp Content đang vận hành, thử bằng agent/workspace riêng **content-gon-test**. Tìm agent hiện có bằng native CLI; có rồi thì dùng đúng workspace đó. Nếu chưa có và host hỗ trợ, tạo agent không gắn kênh và không đổi default bằng `agents add content-gon-test --workspace ABS_LAB --non-interactive --json`, dùng model chính hiện tại. Không sao chép credential. Giữ nguyên agent chính/Zalo, Sheet và lịch cũ.

Khách mới chỉ có một agent phù hợp có thể cài namespaced skill vào workspace agent họ đang dùng khi không có bộ điều phối content trùng; cài cho agent chủ, không cài vào agent trả lời khách Zalo. Không tự suy thư mục từ ổ đĩa người tặng.

## 2. Cài và kiểm tệp

Chạy `node install.cjs --workspace ABS_WORKSPACE`. Đọc JSON: chỉ coi thành công khi `verified:true`, inventory/receipt tồn tại và target đúng. `files-installed` chưa chứng minh kích hoạt trong chat.

Cài lại dùng cùng workspace/kho; installer giữ hồ sơ/thành phẩm. Nếu gặp gói khác sở hữu cùng thư mục, dừng với lý do cụ thể; không xóa hoặc ghi đè. Chi tiết nâng cấp/gỡ ở `docs/CAI-DAT-VA-CAP-NHAT.md`.

## 3. Kích hoạt đúng skill và kiểm chat

Tên skill trong frontmatter là **contentlab**; folder/package vẫn `freeup-content-gon-lab`. Native slash command là **/contentlab**. Nếu host lọc danh sách skill theo agent, chạy helper `activate-9b.cjs --check`, rồi `--apply` với đúng config, agent ID, workspace, Node và OpenClaw entrypoint đã xác định từ host. Helper chỉ thêm `contentlab` vào danh sách hiệu lực của chính agent đó, dùng cơ chế ghi có kiểm tra phiên bản của CLI; không sửa defaults, công cụ, quyền hoặc agent khác.

Đọc lại allowlist, kiểm inventory/skills snapshot trong **một phiên mới** của đúng agent. Nếu host phải chờ lượt chat kết thúc hoặc cần refresh theo cơ chế native, làm theo native flow và thông báo “Cài đã xong; gửi Tiếp tục ở lượt mới”. Không giữ Gateway bận rồi chờ nó rảnh; không tự hứa callback chưa kiểm được.

Đọc SKILL đã cài, chạy `contentlab.cjs menu --workspace ABS --session SESSION_ID`. Trả dòng `MEDIA:` thật và danh sách lựa chọn trong chat hiện tại. Đây là kiểm kích hoạt menu, chưa là kiểm Tri thức/kết nối/kết quả media.

## 4. Chủ động kiểm hồ sơ và tiếp tục

Sau cài thành công, dùng SKILL và references/onboarding.md: đọc hồ sơ, Tri thức và Hình ảnh doanh nghiệp đúng phạm vi host, đánh giá theo nội dung. Chỉ gửi mẫu liên quan phần thiếu, nêu đúng mục cần điền, hướng dẫn nộp vào Tri thức và nhắn **Tôi đã hoàn tất**. Sau đó đọc lại nguồn thật và tiếp tục; không yêu cầu đủ mười mẫu.

Tạo thư mục tiếng Việt và trả đường dẫn thực của khách. Dùng lại ảnh đã có. Clip/nhạc/giọng chỉ chặn nhánh cần chúng. Khách gọi **hệ thống content** luôn xem được menu trước khi hồ sơ đủ.

## 5. Trình dựng local và Google Sheet

Điều phối, bài chữ, kiểm hồ sơ và menu không cần npm hoặc API key mới. Ảnh có thể dùng công cụ native đang có và ảnh khách đã nạp.

Khi cần render local/video và chưa có phụ thuộc, trợ lý chạy `contentlab.cjs renderer-setup --install --workspace ABS`. Helper dùng runtime riêng ngoài folder skill, tự chuẩn bị module Puppeteer/FFmpeg cần thiết và dùng Chrome/Edge đã có; kiểm dựng thật trước khi báo sẵn sàng. Khách không phải nhập lệnh npm. Nếu máy chưa có browser phù hợp hoặc mạng chặn tải, báo đúng phần còn thiếu; không nhận video đã sẵn sàng.

Google là bước tùy chọn sau bài mẫu. Tạo Sheet mới của chính khách bằng mẫu `assets/sheets/Content Gọn - 3 trang tính.xlsx` hoặc schema helper qua kết nối native; đọc lại ba tab và headers rồi bind. Không nối vào Sheet demo/Sheet của người tặng. Khách chưa nối Google vẫn dùng chat/local. Không bật worker hay đăng tự động khi chỉ cài skill.

## Kết quả cài đặt cần báo

Thông báo ngắn: tên bộ quà tặng, agent/workspace đang dùng, menu ảnh thực, hồ sơ đã có/còn thiếu và bước tiếp theo. Không đưa token, log nội bộ hoặc cấu hình kỹ thuật vào thông điệp khách. Chỉ báo các khả năng đã kiểm được; cài file, kích hoạt chat, đọc Tri thức, render và kết nối là các kết quả khác nhau.
