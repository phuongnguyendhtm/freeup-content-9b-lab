# Cài quà tặng trong 9BizClaw — agent tự thực hiện

Đây là yêu cầu cài của chủ trong chat điều khiển 9B. Khách chỉ gửi một câu và link này; agent tự thực hiện các bước dưới đây. Workspace lấy từ đăng ký của **agent đang trò chuyện**, không từ cwd hoặc thư mục tải; khách không tạo/chọn thư mục kỹ thuật.

## 1. Tải gói bằng Node trên máy

Không cần tool riêng tên “cài skill”. Kiểm công cụ thực và đọc schema: có khả năng chạy lệnh/Node và ghi file đã được cấp thì tiếp tục. `exec` có thể là công cụ chạy code để gọi các công cụ khác; dùng cơ chế tìm công cụ của host nếu được công bố. Dừng đúng chỗ nếu quyền thực bị từ chối, không đổi policy hoặc tự bật quyền.

**Công cụ đọc web chỉ dùng để đọc Markdown/JavaScript. ZIP phải được tải bằng Node trực tiếp ra tệp nhị phân, không lấy nội dung ZIP từ web_fetch hoặc chép byte/base64 qua ngữ cảnh model.** Node 22 trở lên là đủ. Không dùng Git, npm, Python hoặc tar; không yêu cầu khách tự tải ZIP.

Chạy đoạn JavaScript dưới đây bằng Node đã tìm được trong host, qua tệp tạm hoặc stdin theo schema công cụ thực. Dùng argument arrays/quoting phù hợp; khách không nhập đoạn mã. Đoạn mã lấy bộ tải từ commit cố định, kiểm SHA256 của chính bộ tải rồi chạy nó. Bộ tải tự lấy ZIP nguyên vẹn, kiểm số byte, SHA256 và toàn bộ release manifest, giải nén UTF-8 vào thư mục tạm mới ngoài workspace.

```javascript
(async () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const { createHash } = require('node:crypto'), { spawnSync } = require('node:child_process');
  const url = 'https://raw.githubusercontent.com/phuongnguyendhtm/freeup-content-9b-lab/602ff40c681f26935d800e1a1fab71ccef9c6020/download-release.cjs';
  const expected = '78ec9cd413b92a0e6f8a6046f888156199fc93f6dd66489bdcb5138eb524466a';
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Cannot download verified bootstrap');
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > 65536 || createHash('sha256').update(data).digest('hex') !== expected) throw new Error('Bootstrap integrity check failed');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'freeup-content-bootstrap-'));
  const file = path.join(temporary, 'download-release.cjs');
  fs.writeFileSync(file, data, { flag: 'wx', mode: 0o600 });
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit', windowsHide: true, shell: false, timeout: 150000 });
  if (result.error) throw new Error('Cannot execute verified bootstrap');
  process.exitCode = result.status === 0 ? 0 : 1;
})().catch(() => {
  console.log(JSON.stringify({ ok: false, error: { code: 'BOOTSTRAP_FAILED', message: 'Chưa tải/kiểm được bộ cài bằng Node; không đổi quyền hoặc cấu hình để thử đường khác.' } }));
  process.exitCode = 1;
});
```

Đọc JSON thật: cần `archiveVerified:true`, `releaseManifestVerified:true`, `downloadedBytes:1965248` và SHA256 `9920bc949292f9c30b0ab24ae9cae78e8c55960b637dbb18fefa93f68235b6f6`. Dùng **sourcePath/orchestratorPath thực được trả về**. `ok:true` ở đây chỉ là đã tải/giải nén, chưa phải cài hoặc bật skill. Không tự viết ZIP extractor hoặc thử tải ZIP bằng công cụ đọc web khi bộ tải đã báo lỗi.

## 2. Cài và kích hoạt trong cùng yêu cầu

1. Chạy file tại `orchestratorPath` bằng Node của host với `--workspace WORKSPACE_HIEN_TAI --session SESSION_HIEN_TAI --prepare`. Nếu runtime không cho ID phiên, bỏ --session và giữ `menu.session` được trả về cho các lượt chọn trong cùng chat. Không tự tạo/chuyển agent, không dùng workspace của người tặng.
2. Dùng **công cụ openclaw của host**: `{message:configActivation.getMessage}`; nếu `needed:true`, dùng `{message:configActivation.setMessage}` đúng chuỗi trả về. Danh sách cũ đầy đủ đã được prepare giữ lại, không dựng từ output bị cắt. Nếu có thay đổi xen giữa, prepare lại ngay trước set. Không giao cả việc tải/cài sang phiên cấu hình trung gian; phiên đó có thể chỉ có công cụ config. Không thêm --expect-* hoặc --strict-json vào message của tool.
3. Chạy **cùng orchestratorPath** với `--workspace WORKSPACE_HIEN_TAI --finalize`. Chỉ báo cài/kích hoạt xong sau `installed:true`, `configured:true`, inventory và cấu hình ngoài phạm vi đã được xác minh. Nếu host yêu cầu duyệt thì trình đúng phê duyệt của host; không yêu cầu khách gõ lại câu cài hoặc tự làm phần kỹ thuật. Không dùng exec --apply hoặc ghi config JSON thay đường cấu hình của host khi bị từ chối.

## 3. Dùng ngay

Đọc SKILL.md và references/host-adapters.md **tại installation.target đã cài**; tiếp tục trong lượt cài hiện tại. Tìm/đọc Tri thức thật, chạy onboarding init rồi assess từ nguồn có trích đoạn. Kiểm thư viện ảnh bằng company_media_search nếu tool native có trong phiên; chỉ xác nhận ảnh đúng người/sản phẩm sau khi thực sự xem, không bắt tải lại toàn bộ ảnh đã có. Nếu chưa có tool ảnh thì ghi chưa kiểm, không bịa kết quả.

Sau init và assess, **chạy `contentlab.cjs onboarding setup --workspace WORKSPACE_HIEN_TAI` bằng helper đã cài**. Hiển thị `customerMessage` thật trong chat: phần thiếu/cần xác nhận, câu hỏi cụ thể, link/attachment đúng mẫu thiếu, hướng dẫn nộp Tri thức và cả ba đường dẫn `mediaDestinations` đã tạo/kiểm. Luôn gửi nơi thêm **Video cảnh quay (B-roll)**, **Nhạc nền**, **Giọng đọc**, kể cả khách chưa chọn video. Thư mục ở máy chạy 9B, không phải link Internet; khách dùng điện thoại thì kiểm kênh nhận file/quyền trước khi đưa URL. Không chỉ lưu hướng dẫn ra file hoặc trả menu rồi bỏ qua bước này. Hồ sơ đủ cho bài chữ chưa có nghĩa đã đủ nhận diện.

Sau đó trả PNG menu thực bằng attachment của 9B và mời chọn 0–9/chủ đề trong cùng chat. Giữ menu.session khi select; lượt tiếp theo native snapshot phải có contentlab. Đọc lại nguồn rồi resume + setup sau “Tôi đã hoàn tất”. Mẫu Sheet trong reference bắt buộc đúng ba trang, không tạo bảng tùy hứng. Dùng lại Tri thức/ảnh của khách và mặc định chưa bật đăng/lịch nền.

Nếu khách yêu cầu **cập nhật và hoàn tất thiết lập** cho bản đã cài: dùng cùng luồng tải → prepare → tool config nếu cần → finalize; giữ nguyên dữ liệu/tiến độ của đúng agent. Sau đó đọc SKILL mới và thực hiện setup ngay trong yêu cầu này. Không bắt gỡ/cài mới, mở thư mục kỹ thuật hay gửi thêm câu lệnh để bắt đầu hỏi hồ sơ.

Chi tiết tham số hoặc adapter ngoài 9B: [INSTALL.md](INSTALL.md). Nếu gặp lỗi, báo đúng bước, mã lỗi thật và trạng thái tệp/cấu hình đã đổi; không tự đề nghị cài thủ công từ một phỏng đoán thiếu tool hoặc từ output ZIP bị cắt.
