# Mẫu Sheet bắt buộc của FreeUp Content Gọn

Đọc file này trước mọi thao tác tạo/nối bảng. Mẫu duy nhất được chủ sản phẩm chọn là [FreeUp Content Gọn — ba trang tính](https://docs.google.com/spreadsheets/d/1MKrnx1N_1dVtuy7lcVm6uZl_Sd-7WBj06VMRVBgXS9Q/edit). Không tự chọn một mẫu khác hoặc tạo spreadsheet trắng rồi thiết kế theo suy đoán.

Thông số máy đọc ở [sheet-template.json](sheet-template.json). Bản Excel sạch của chính mẫu này được bộ cài đặt tại `assets/sheets/Content Gọn - 3 trang tính.xlsx`; schema và SHA256 đã ghim. Chạy `contentlab.cjs sheet template` để kiểm hai file và lấy đường dẫn thực, nguồn và phương thức được phép.

1. Nếu đã có binding hợp lệ của khách, dùng lại; không tạo bảng thứ hai.
2. Nếu kết nối Drive của khách đọc được mẫu Google: sao chép file bằng thao tác Copy file của connector vào Drive của chính khách. Ghi receipt thực, ID file mới và ID mẫu nguồn; không sửa file mẫu của người tặng.
3. Nếu không đọc được mẫu Google hoặc chưa có quyền copy: nhập đúng file XLSX đã ghim vào Google Sheets qua kết nối khách. Không thay bằng bảng trắng. Chưa có connector phù hợp thì giao XLSX để khách dùng và tiếp tục làm trong chat.
4. Đọc lại metadata, thứ tự ba tab, headers và dropdown. Giữ bố cục/màu/cột của mẫu. `setup-plan` chỉ khôi phục validation của một bản sao/import đã xác minh nếu connector làm mất chúng; không là phương án thiết kế bảng mới.
5. Truyền `templateOrigin` vào `sheet bind`: `{templateId, revision, xlsxSha256, method, sourceSpreadsheetId?, resultSpreadsheetId, verified:true}`. `method` chỉ là `drive_copy` hoặc `xlsx_import`; `sourceSpreadsheetId` bắt buộc đúng mẫu khi copy; `resultSpreadsheetId` phải là ID mới đã đọc lại. Với import, hash file tải lên phải đúng reference. Chỉ ghi `verified:true` sau receipt và readback thật.

Đúng ba tab: **00. Nguồn tham khảo**, **01. Ý tưởng**, **02. Bài viết & lịch đăng**. Trang nguồn để khách thêm nguồn của chính họ; mẫu không điền sẵn dữ liệu của người tặng. Bản đã nối trước nâng cấp nhưng thiếu provenance phải đối chiếu/nhập mẫu lại theo hướng dẫn; không tự khai nguồn gốc chưa kiểm.
