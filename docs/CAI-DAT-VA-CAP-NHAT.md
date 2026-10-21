# Cài đặt, cập nhật và gỡ riêng bộ lab

**22/10/2026 · Bộ cài file dùng Node.js 22 trở lên, không cần Git, npm hay nhập API key. Cài file thành công và kích hoạt đúng agent trong 9B là hai bước được kiểm riêng.**

## Một câu gửi trong 9B

Sau khi có link bản phát hành mà tài khoản khách tải được, khách gửi:

> Cài bộ Content Gọn lab từ [link bản phát hành được cấp quyền]. Dùng agent lab và workspace riêng, không thay bộ content đang hoạt động. Kiểm bản tải, giải nén, tìm Node có sẵn của 9B rồi cài và đọc lại receipt/inventory. Xác minh skill trong đúng agent lab trước khi báo dùng được. Sau đó kiểm hồ sơ, Tri thức và ảnh doanh nghiệp đang có; chỉ hướng dẫn phần thiếu, rồi mở menu “hệ thống content”.

Trợ lý 9B tải bản phát hành qua kết nối/trình duyệt đã được cấp quyền, kiểm SHA256, giải nén vào thư mục riêng và gọi bộ cài từ thư mục giải nén. Không cần yêu cầu khách cài Git hoặc tải thư viện npm để cài phần điều phối. Repo private không có nghĩa link tải hoạt động ẩn danh; chỉ công bố luồng một câu cho khách ngoài tài khoản sau khi kiểm thật quyền tải bản phát hành. `gift-manifest.json` mô tả bộ quà này, không tự chứng minh router quà tặng của một bản 9B bất kỳ đã hỗ trợ nó.

## Workspace và Node

Tạo/chọn agent lab riêng như `content-gon-test` trong 9B và xác định workspace tuyệt đối của agent đó. Bộ cài không tự đổi cấu hình agent, tài khoản, quyền kết nối hoặc bộ skill đang hoạt động.

Ưu tiên truyền **`--workspace` với đường dẫn tuyệt đối đang tồn tại**. Nếu bỏ tham số này, bộ cài chỉ tự chọn khi tìm được duy nhất workspace của agent `content-gon-test` hoặc `freeup-content-gon-lab` trong metadata 9B, hoặc biến `FREEUP_CONTENT_LAB_WORKSPACE` hợp lệ. Nó không tự chọn workspace `main`; nhiều ứng viên thì dừng để xác định đúng nơi cài.

`bootstrap.ps1` trên Windows và `bootstrap.sh` trên macOS/Linux tìm Node 22+ từ `NINEBIZ_NODE`, PATH hoặc vị trí Node đi kèm 9B. Windows đọc `install-root.json` của 9B để tìm đường dẫn cài thật; không quét ổ đĩa hoặc dùng đường dẫn máy người hướng dẫn. Nếu chưa tìm được, trợ lý xác định Node của bản 9B đang dùng và truyền qua `NINEBIZ_NODE`. Mọi đường dẫn có dấu/khoảng trắng được truyền bằng mảng tham số, không nối thành chuỗi lệnh để thực thi.

## Chạy từ thư mục đã giải nén

Các lệnh dưới đây là giao diện kỹ thuật cho trợ lý/kiểm thử. Thay biến workspace bằng đường dẫn thật đã xác định; không gửi biến giữ chỗ như một thư mục đã tạo.

Windows PowerShell:

```powershell
$workspaceLab = '<đường dẫn tuyệt đối workspace agent lab đã xác định>'
& .\bootstrap.ps1 --workspace $workspaceLab --dry-run
& .\bootstrap.ps1 --workspace $workspaceLab
```

macOS/Linux:

```sh
workspace_lab='<đường dẫn tuyệt đối workspace agent lab đã xác định>'
sh ./bootstrap.sh --workspace "$workspace_lab" --dry-run
sh ./bootstrap.sh --workspace "$workspace_lab"
```

Khi đã có Node 22+, gọi trực tiếp cùng giao diện:

```text
node install.cjs --workspace <workspace tuyệt đối> --dry-run
node install.cjs --workspace <workspace tuyệt đối>
node install.cjs --workspace <workspace tuyệt đối> --uninstall-lab
```

`--dry-run` kiểm nguồn/đích và trả kế hoạch, không tạo thư mục, khóa, receipt hoặc skill. `--source <thư mục tuyệt đối>` dùng khi bộ cài nằm ngoài gốc nguồn; mặc định nguồn là thư mục chứa `install.cjs`.

## File được cài và bằng chứng

Bộ cài đọc tên/phiên bản từ `package.json`, chỉ nhận package `freeup-content-gon-lab`. Skill nằm tại **`<workspace>/skills/freeup-content-gon-lab/`**; phần bổ sung được chép đúng vị trí:

| Nguồn trong bản phát hành | Nơi trong skill đã cài |
|---|---|
| `package/skills/freeup-content-gon-lab/` | Gốc skill |
| `templates/knowledge/*.md` | `assets/knowledge/` |
| `onboarding/*.json` | `assets/onboarding/` |
| `templates/sheets/*.json`, `*.xlsx` khi có | `assets/sheets/` |
| `assets/menu/he-thong-content-ngang-v2.png` | `assets/menu/he-thong-content-ngang-v2.png` |

Receipt nằm tại **`<workspace>/freeup-content-gon-lab-data/install/receipt.json`**, gồm package/version, workspace/đích thực, thời điểm, hash nguồn, danh sách SHA256 và kích thước từng file, hash inventory, trạng thái kiểm bản phát hành và đường dẫn bản sao lưu nếu có. Bộ cài đọc lại receipt và đối chiếu file thực trước khi trả `verified: true`.

`status: files-installed` chỉ xác nhận file đã cài đúng. `activation: not_verified` yêu cầu trợ lý kiểm `skills.status`/lệnh `contentlab` của **đúng agent lab** trong 9B, rồi thử mở menu bằng “hệ thống content”. Chưa kiểm được thì báo rõ phần còn lại; không gọi receipt file là bằng chứng chat/native media đã chạy. Trạng thái renderer chỉ cho biết script/module có được phát hiện không; `local_png: not_verified` hoặc native capability chưa kiểm không phải lời xác nhận đã tạo ảnh/video.

## Cài lại, nâng bản và khôi phục

Chạy lại cùng bản tại cùng workspace không tạo bộ skill thứ hai. Nếu SHA256 nội dung không đổi, receipt trả `changed: false`. Nếu nâng bản hoặc sửa bộ nguồn, bộ cài chép vào thư mục stage riêng, kiểm hash, chuyển skill cũ cùng receipt vào **`freeup-content-gon-lab-data/install/backups/<mã-lượt>/`**, rồi đổi stage thành skill đích và kiểm lại. Nếu đổi stage thất bại, skill/receipt cũ được khôi phục.

Dữ liệu khách trong **Nội dung của tôi**, hồ sơ đã hoàn thiện, sản phẩm/ảnh gốc và dữ liệu runtime ngoài thư mục skill không bị ghi đè. File khách tự sửa bên trong skill thuộc bản code cũ được giữ trong backup khi nâng bản. Bộ cài từ chối thư mục skill không có dấu sở hữu đúng package, từ chối đường dẫn liên kết/junction và receipt của gói/workspace khác.

Một khóa cài ngăn hai lượt ghi cùng lúc. Nếu lượt trước bị ngắt, trợ lý kiểm tiến trình, receipt và stage/backup trước khi xử lý khóa còn lại; không xóa cả cây dữ liệu để chạy lại. Stage lỗi được giữ tên riêng để khôi phục. Chỉ báo cài thành công sau khi receipt và inventory thực khớp.

## Gỡ lab

`--uninstall-lab` chỉ nhận skill có dấu sở hữu đúng bộ lab. Nó **chuyển skill vào backup**, ghi receipt `uninstalled` và kiểm đích skill không còn; không xóa nội dung khách, tài nguyên, trạng thái runtime hay skill khác. Chạy gỡ lần nữa không gỡ thêm dữ liệu.

Thao tác này không tự xóa agent hoặc lịch/worker đã đăng ký riêng. Nếu đã bật worker lab, dừng đúng worker/lịch lab qua host trước khi gỡ; giữ bộ đang vận hành độc lập. Khôi phục bằng cách cài lại bản phát hành đã kiểm, hoặc đối chiếu backup và receipt trước khi phục hồi code cũ; dữ liệu khách vẫn ở workspace.

## Đóng gói phát hành sạch

Trong checkout nguồn dành cho người đóng gói, chạy `node scripts/build-release.cjs` sau khi các kiểm thử và asset đã hoàn tất. Bộ build dùng ZIP tích hợp bằng Node, không cần PowerShell, Python hay thư viện npm; tên file UTF-8 và quyền chạy `bootstrap.sh` được lưu trong archive. Nó chỉ lấy danh sách file phân phối đã chốt, gồm schema/template ba trang tính khi có; không lấy fixture riêng, `node_modules`, log, đầu ra khách hoặc menu v1.

Kết quả trong `dist/`: **`freeup-content-gon-lab-<version>.zip`**, **`SHA256SUMS.txt`**, **`release-manifest.json`**. Archive cũng chứa manifest SHA256 từng file; bộ cài xác minh manifest đó trước khi chép. Hash phát hiện file bị thay đổi; nguồn tải vẫn phải là bản phát hành đã được xác nhận. Build không tự public repo hoặc đăng release. Chỉ ghi đã phân phối sau khi link tải và quyền truy cập của khách được kiểm thật.
