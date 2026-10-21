# Ba trang tính, cùng dữ liệu với chat

Chỉ nối Google khi khách cần bảng hoặc làm nhiều bài. Trong 9B, dùng kết nối Composio native của chính 9B. Kết nối Google Drive của ChatGPT/Codex không chứng minh 9B đã nối Google. Không xin mật khẩu/token từ khách.

## Khởi tạo

1. Dùng Composio native đang có để xác nhận Sheets/Drive và tài khoản đích. Nếu chưa nối, trả OAuth link theo quy trình host; chat/local vẫn làm việc được.
2. Ưu tiên tạo một file mới từ mẫu ba tab đã đóng gói hoặc gọi action tạo spreadsheet với `createBody` từ `sheet schema`. Không trỏ vào Sheet bảy tab hay Sheet tham khảo của người khác.
3. Đọc metadata thật. File phải có đúng ba tab, đúng thứ tự, không tab ẩn. Đọc headers và đối chiếu schema. Nếu dùng file mới hoàn toàn, `sheet setup-plan` trả các request header/validation; áp dụng bằng connector thật rồi đọc lại.
4. Chuẩn hóa metadata `{spreadsheetId,businessId,sheets:[{properties:{sheetId,title,hidden:false}}],headers:{sources:[...],ideas:[...],posts:[...]}}` vào file JSON trong workspace; chạy `sheet bind --input metadata.json`. Cài lại không tạo Sheet thứ hai nếu binding còn truy cập được.

Schema chính thức ở `assets/sheets/content-sheet-schema.json`; `sheet schema` cũng trả nó. Mã nguồn/ý/bài ở các cột cuối; không tăng số tab. Các ô khách được nhập có hướng dẫn/validation; bảo vệ cột kỹ thuật bằng warning phù hợp, không khóa ô khách cần sửa.

## Đồng bộ theo lệnh

Đọc bằng connector các range có giới hạn (ví dụ hàng1–200), đủ cột trong schema. Không dùng chỉ số dòng làm ID. Snapshot chuẩn hóa:

```json
{
  "spreadsheetId": "ID_THUC_DA_BIND",
  "businessId": "DOANH_NGHIEP_THUC",
  "readAt": "2026-10-22T08:00:00Z",
  "rows": {
    "sources": [{"row": 2, "values": ["Bật", "Tên", "Website", "https://example.com", "Chủ đề", "Bình thường", "Chưa đọc", "", "sou-ID"]}],
    "ideas": [],
    "posts": []
  }
}
```

`sheet ingest --input snapshot.json`:

- `assign_ids_then_read_back`: ghi **chỉ ô mã** trong idPatches rồi đọc lại, chưa sản xuất. Chỉ dispatch sau lần đọc có ID thật để không nhân đôi khi retry.
- `dispatch`: thực hiện events. `produce` → đọc nguồn/brief, viết/render, `production create` với `idempotencyKey: eventId` và `ideaId`. Các event sửa/duyệt/tải áp dụng đúng jobId/version; khi Sheet vừa đổi nội dung phải `production update` trước, không dùng phê duyệt cũ.
- `publish_request`: chuẩn bị bản cuối và đối chiếu quyền duyệt nội dung/tài khoản/giờ. Dùng publisher host sau khi phạm vi đã rõ; helper không tự đăng.
- Sau thành công, `sheet ack --input ack.json`, trong đó `{eventId,success:true,resultId}` là ID kết quả thật. Event đăng còn cần `verifiedPermalink`. Chưa xong thì giữ pending; không ack từ lời hứa.

Ghi lại status/preview/version/jobId vào đúng hàng có ID vừa đọc, bằng range nhỏ. Giữ nguyên phản hồi và các ô khách vừa thay đổi. Đọc lại trước ghi nếu hàng đã sort/chèn; không tự sort bảng. Status của bài phải từ production helper thật, không từ ô khách tự gõ. Không coi dòng minh họa là bài đã tạo.

## Lịch và đăng

Mặc định là đồng bộ theo lệnh. Chọn “Đăng theo lịch” chưa chứng minh đã hẹn hoặc đã đăng. Với việc định kỳ được chủ yêu cầu rõ, host tạo cron/task riêng của lab, lưu receipt thật và kiểm một vòng thực. Không có worker mặc định hoặc Apps Script khách phải deploy. Nếu không có kết nối/công cụ phù hợp, giao bộ bài để tự đăng và báo đúng phần còn thiếu.
