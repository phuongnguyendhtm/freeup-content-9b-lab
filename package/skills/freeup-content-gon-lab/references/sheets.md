# Dùng đúng mẫu Sheet, cùng dữ liệu với chat

Đọc [sheet-template.md](sheet-template.md) trước. Chạy sheet template để kiểm reference, hash XLSX/schema và lấy link mẫu. Không có nhánh tự tạo spreadsheet trắng.

1. Xác nhận connector Sheets/Drive và tài khoản khách. 9B dùng native Composio; Claude/Codex dùng connector thực của phiên. Kết nối ở một host không chứng minh host khác có quyền.
2. Dùng lại binding đã xác minh; nếu chưa có thì **copy đúng mẫu Google** sang Drive khách hoặc **import đúng XLSX đã ghim**. Không sửa file mẫu chủ. Chưa có kết nối thì giao XLSX, tiếp tục chat/local.
3. Đọc metadata/headers/dropdown thật, đúng ba tab theo thứ tự, không tab ẩn. Chỉ sửa validation bị connector bỏ mất trên bản copy/import có nguồn đã xác minh bằng setup-plan. Không tự đổi cấu trúc mẫu.
4. Lưu snapshot metadata {spreadsheetId,businessId,sheets,headers,templateOrigin} trong workspace. templateOrigin theo reference, chỉ verified sau copy/import receipt và readback thật. Chạy sheet bind --input metadata.json. Helper từ chối bảng thiếu/sai nguồn mẫu dù headers giống.
5. sheet ingest nhận snapshot đọc mới. Có idPatches thì ghi mã xuống dòng và đọc lại trước dispatch. Dùng eventId làm idempotencyKey; ghi kết quả rồi ack. Yêu cầu đăng chờ tool native và permalink thực, không tự bật worker.

Schema là hợp đồng kiểm cột, không phải giấy phép thiết kế bảng. Ba trang: 00. Nguồn tham khảo; 01. Ý tưởng; 02. Bài viết & lịch đăng. Khách thêm nguồn của họ, chọn Làm bài, xem/góp ý/duyệt rồi nhắn Đồng bộ lựa chọn content của tôi. Không Apps Script khách phải deploy.
