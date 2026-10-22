# Cài FreeUp Content Gọn — cho agent thực hiện

Khi khách gửi link GitHub để nhận quà, đọc tài liệu này và hoàn thành cài bằng công cụ sẵn có. Khách không phải chọn thư mục kỹ thuật, tự nhập npm, Git hoặc sửa JSON. Không có quyền đọc repo/chạy file thì nói đúng bước bị host chặn; link không tự vượt quyền nền tảng.

## 1. Lấy gói đầy đủ

Tải release **0.2.0** và SHA256SUMS từ downloads/ của chính repo, kiểm hash rồi giải nén vào thư mục tải tạm ngoài workspace đích. Dùng Node >=22 của host hoặc đã có trên máy; bootstrap.ps1/bootstrap.sh tìm Node mà không cài bản 9B khác. Nếu repo private, cần quyền GitHub hợp lệ; không xin token khách.

## 2. Nhận diện host và cài

Agent biết mình đang chạy trong môi trường nào từ runtime, công cụ và workspace của phiên. Dùng thông tin đó chọn host; --host auto chỉ dùng khi có dấu hiệu đủ rõ. Không dò credential. Dùng đường dẫn tuyệt đối và argument arrays.

| Host | Lệnh do agent chạy | Skill được phát hiện tại |
|---|---|---|
| 9BizClaw | node install.cjs --host 9bizclaw --workspace ABS | ABS/skills/freeup-content-gon-lab |
| OpenClaw | node install.cjs --host openclaw --workspace ABS | ABS/skills/freeup-content-gon-lab |
| Claude Code | node install.cjs --host claude --workspace ABS_PROJECT | ABS_PROJECT/.claude/skills/contentlab |
| Codex | node install.cjs --host codex --workspace ABS_PROJECT | ABS_PROJECT/.agents/skills/contentlab |

ABS là workspace thực của agent, ABS_PROJECT là thư mục làm việc/dự án mà khách đang dùng. Dữ liệu chạy vẫn ở workspace, ngoài folder skill. Không cài vào chính thư mục giải nén nguồn. Chỉ cài cho host hiện tại, không đồng loạt sửa bốn nền tảng. Không thay cấu hình model, credential, quyền hoặc lịch hiện hành.

**9B/OpenClaw:** nếu đã có bộ content đang hoạt động, dùng agent/workspace riêng content-gon-test, không gắn kênh và không đổi default. Dùng agent hiện có nếu đúng workspace. Chưa có thì tạo bằng native CLI với model hiện tại, không chép credential. Sau files-installed, dùng activate-9b.cjs với đúng CLI/config/agent/workspace để bật riêng contentlab nếu host lọc skill. Kiểm từ phiên mới, không chỉ tin receipt.

**Claude Code/Codex:** chỉ cài trong thư mục dự án hiện tại; không sửa allowlist 9B. Đọc SKILL đã cài và kiểm host phát hiện contentlab; Claude Code gọi /contentlab, Codex gọi $contentlab hoặc câu hệ thống content. Nếu phiên cần refresh, hướng dẫn khách một lượt Tiếp tục.

**Claude web/Cowork:** không đọc skill local theo cách Claude Code. Gói downloads/contentlab-claude-0.2.0.zip tự chứa SKILL.md, scripts, references, menu, mười mẫu và XLSX. Dùng luồng upload/enable skill chính thức trong Customize/Skills của tài khoản khi host có công cụ; nếu quyền này chỉ chủ tài khoản có, giao ZIP và chỉ đúng bước bật. Không giả vờ đã cài vào tài khoản bằng việc chép file. Khi host không có Node, dùng menu/file mẫu và công cụ nội dung sẵn có; các helper Node/render chỉ chạy khi runtime có thực.

## 3. Kiểm và bắt đầu

Chỉ báo cài file xong khi verified:true và inventory/receipt đúng. Chạy helper menu và sheet template từ skill đã cài. Mở PNG thực bằng attachment native; không gửi chuỗi đường dẫn như thể ảnh đã hiển thị. Chủ động đọc hồ sơ/ảnh hiện có qua adapter host trong references/host-adapters.md, chỉ hỏi phần thiếu. Khách nhắn Tôi đã hoàn tất thì đọc lại nguồn thật trước khi tiếp tục.

## 4. Mẫu Sheet bắt buộc

Đọc references/sheet-template.md và chạy sheet template. **Chỉ copy mẫu Google hoặc import đúng XLSX đi kèm**, không tạo spreadsheet trắng bằng createBody/schema rồi tự định dạng. Đọc lại ba tab/headers/dropdown, lưu templateOrigin và bind. Thiếu kết nối vẫn làm bài trong chat và giao mẫu XLSX. Không tự nối bảng mẫu của người tặng làm bảng chạy của khách.

## 5. Media và kết quả

Khi cần renderer local, chạy renderer-setup --install --workspace ABS; kiểm PNG/FFmpeg thực. Tạo/sửa/QA/duyệt/xuất theo skill. Giữ thư mục tiếng Việt và dữ liệu khách ngoài code. Cài quà không bật publisher, worker hoặc cron. Báo ngắn host đã cài, menu, phần hồ sơ còn thiếu, file mẫu và bước làm bài đầu tiên.

Vị trí skill theo tài liệu chính thức: [OpenClaw](https://docs.openclaw.ai/tools/skills), [Claude Code](https://code.claude.com/docs/en/skills), [Codex](https://developers.openai.com/codex/skills/).
