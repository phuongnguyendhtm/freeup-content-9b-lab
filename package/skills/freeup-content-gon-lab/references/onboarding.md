# Kiểm hồ sơ theo phần thiếu

## Lệnh

Chạy bằng Node của host, đường dẫn skill và workspace hiện tại; truyền argument arrays, không nối chuỗi shell từ tên doanh nghiệp:

```text
contentlab.cjs onboarding init --workspace ABS --business-id ID --agent-id ID
contentlab.cjs onboarding assess --workspace ABS --format product_post --input snapshot.json
contentlab.cjs onboarding setup --workspace ABS
contentlab.cjs onboarding templates --workspace ABS
contentlab.cjs onboarding media --workspace ABS
contentlab.cjs onboarding resume --workspace ABS --input snapshot-moi.json
contentlab.cjs onboarding status --workspace ABS
```

Snapshot nằm trong workspace lab, không trong repo phân phối. Dữ kiện đến từ native business documents/profile hoặc hội thoại chủ đã xác nhận. Dùng kết quả search để tìm tài liệu, sau đó read nội dung; không khai `read:true` từ tên file/excerpt không đủ chứng minh.

## Bàn giao thiết lập trong chat

Sau cài/cập nhật, chạy init → đọc Tri thức và thư viện ảnh thật → assess → setup. Setup luôn kiểm thêm màu sắc, phong cách hình ảnh và lựa chọn logo so với yêu cầu bài chữ; không ép khách sản xuất video. Hiển thị `customerMessage` trong cùng lượt: câu hỏi cụ thể, link mẫu còn thiếu, nơi nộp Tri thức, đường dẫn B-roll/nhạc/giọng và câu “Tôi đã hoàn tất”. Đính kèm `templates` đã tạo, rồi gửi menu PNG. `customerMessagePath` là bản lưu để mở lại, không thay việc hiển thị nội dung trong chat. Không đổi `selectedFormat` chỉ để hỏi nhận diện. `selectedFormatReady` và trạng thái thiết lập chung được phân biệt trong kết quả.

Nếu hồ sơ đủ thì báo phần đã xác nhận và vẫn gửi đường dẫn tài nguyên. Không hỏi lại thông tin đã được xác nhận; còn xung đột thì hỏi xác nhận đúng mục. Sau resume, chạy setup để cập nhật hướng dẫn; không dùng câu hoàn tất để thay readback. Mở menu những lần sau vẫn là thao tác nhanh, không hỏi lại toàn bộ thiết lập.

## Snapshot cho đánh giá

```json
{
  "schema_version": 1,
  "businessId": "ID_DOANH_NGHIEP_THUC",
  "agentId": "ID_AGENT_THUC",
  "snapshotId": "ID_MOI_MOI_LAN_DOC",
  "readAt": "2026-10-22T08:00:00Z",
  "selectedFormat": "product_post",
  "sources": [{
    "id": "RESOURCE_ID_THUC",
    "businessId": "ID_DOANH_NGHIEP_THUC",
    "kind": "knowledge",
    "tool": "read_business_document",
    "read": true,
    "readAt": "2026-10-22T08:00:00Z",
    "content": "Tên doanh nghiệp: Công ty An."
  }],
  "assessment": {"fields": {
    "company.name": {"status": "provided", "value": "Công ty An", "sourceIds": ["RESOURCE_ID_THUC"], "evidence": "Tên doanh nghiệp: Công ty An."}
  }},
  "media": {"nativeImages": [], "needs": {"music": false, "voice": false}}
}
```

Ví dụ chỉ minh họa schema; không gửi những giá trị mẫu này như dữ kiện khách. Khi tạo snapshot thật, `value` phải nằm nguyên văn trong `evidence`, và `evidence` phải nằm thật trong nguồn đã đọc. Đã có lời xác nhận của chủ thì dùng `confirmed_context`, hoặc `confirmedByOwner: true` trên nguồn được xác nhận; không hỏi lại thông tin đã được xác nhận trong hồ sơ/tài liệu. Phân biệt `provided` với `confirmed` theo native tools reference. Các trường catalog ở assets/onboarding/knowledge-catalog.json. Đã đủ theo ý nghĩa thì dùng tài liệu tương đương; không yêu cầu đổi tên tài liệu.

Nhánh sản phẩm cần thông tin offer và ảnh đúng; nhánh cá nhân cần dữ kiện/ảnh người thật. Brand chưa có màu có thể đề xuất để khách xác nhận; không ghi màu tự chọn là màu thương hiệu đã có. Giọng mẫu, lời xưng hô và dữ kiện xác nhận qua chat có thể làm nguồn `confirmed_context`.

## Tiếp tục sau khi khách tải xong

Lấy businessId/agentId/bước chờ từ state, tìm và đọc nguồn mới/cập nhật đúng doanh nghiệp. Tạo snapshotId mới và readAt mới, chạy `resume`. Giữ trường đã có nguồn còn hợp lệ, xử lý xung đột rõ ràng. Nếu native còn indexing thì báo đang chờ và giữ tiến độ; không reset toàn bộ.

Helper tạo những mẫu còn cần trong **Hồ sơ cần hoàn thiện** với tên tiếng Việt. Gửi attachment/link đọc được, nêu đúng mục cần điền và dặn nộp vào **Tri thức** rồi nhắn **Tôi đã hoàn tất**. Khi repo private, không gửi raw link như link công khai; ưu tiên mẫu local đã xuất bằng attachment trong chat.

## Media

Native image record phải có ID, businessId, trạng thái thực, vai trò và việc đã mở kiểm. Không đếm ID receipt trống là ảnh dùng được. Clip/audio ở **Tài nguyên của tôi** được quét tên, signature và khả năng đọc; kết quả scan không tự chứng minh decode/đúng nội dung. Renderer/QA phải kiểm được file thực. Không bắt tải lại ảnh đã có trong Hình ảnh doanh nghiệp.
