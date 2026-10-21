# Sản xuất, kiểm và giao bài

Helper chỉ quản lý và dựng file local. Agent viết nội dung theo hồ sơ đã đọc, chọn nguồn thật, xem/nghe thành phẩm rồi ghi kết quả kiểm. Các boolean xác nhận trong JSON là kết quả công việc này, không phải bằng chứng script tự nhận ra người, sản phẩm hoặc hiểu mọi claim. Nội dung mẫu dưới đây là ví dụ schema; thay toàn bộ ID, đường dẫn và dữ kiện bằng dữ liệu đã kiểm của khách.

## Lệnh và phiên bản

Gọi trực tiếp `scripts/production.cjs`, hoặc qua `scripts/contentlab.cjs production`. Luôn truyền `--workspace ABS` là workspace tuyệt đối hiện tại. Input là file JSON UTF-8, không nội suy caption/đường dẫn vào chuỗi shell.

```text
node scripts/contentlab.cjs production create --workspace ABS --input ABS_JOB_JSON
node scripts/contentlab.cjs production list --workspace ABS
node scripts/contentlab.cjs production show --workspace ABS --id JOB_ID
node scripts/contentlab.cjs production update --workspace ABS --id JOB_ID --input ABS_PATCH_JSON
node scripts/contentlab.cjs production validate --workspace ABS --id JOB_ID
node scripts/contentlab.cjs production qa --workspace ABS --id JOB_ID --input ABS_QA_JSON
node scripts/contentlab.cjs production export --workspace ABS --id JOB_ID
node scripts/contentlab.cjs production approve --workspace ABS --id JOB_ID --input ABS_APPROVAL_JSON
```

CLI trả JSON; lỗi vận hành trả exit code 1 và thông báo ở stderr. `validate` trả `valid/errors`; `qa` trả job với `qa.passed/errors` và trạng thái, vì thế exit code 0 chưa có nghĩa QA đạt. Kiểm các trường kết quả trước bước tiếp theo.

Job ID ổn định, phiên bản bắt đầu từ 1. `update` tăng phiên bản và xóa QA/phê duyệt cũ; không được sửa `id`, `businessId`, `format`, `status` trực tiếp. Trường sửa được: `title`, `caption`, `comments`, `media`, `sources`, `product`, `claimRequirements`, `publishAt`, `brand`, `person`, `voice`, `taskKind`, `assetRequest`; không đổi taskKind của job đang tồn tại. Muốn đổi định dạng tạo job mới cùng `ideaId`.

`idempotencyKey` chống tạo trùng trong cùng doanh nghiệp: retry cùng key trả job cũ. Mỗi nhánh định dạng dùng key riêng; không dùng cùng key cho hai đầu ra khác nhau. Workspace đã onboarding chỉ nhận đúng `businessId` được gắn. `list/show` có thể thêm `--business ID`; không dùng cờ này để vượt binding.

## Ví dụ bài đăng kèm sản phẩm

```json
{
  "businessId": "ID_DOANH_NGHIEP_THAT",
  "format": "product_post",
  "title": "Sản phẩm A cho công việc hằng ngày",
  "caption": "BÀI_VIẾT_ĐÃ_SOẠN_TỪ_DỮ_KIỆN_THẬT",
  "ideaId": "ID_Y_TUONG_GOC",
  "idempotencyKey": "ID_SU_KIEN_RIENG_CHO_NHANH_SAN_PHAM",
  "sources": [
    {"id":"ID_TAI_LIEU_DA_DOC","businessId":"ID_DOANH_NGHIEP_THAT","kind":"knowledge","confirmed":true},
    {"id":"ID_ANH_GOC_NATIVE","businessId":"ID_DOANH_NGHIEP_THAT","kind":"business_image","confirmed":true}
  ],
  "product": {"name":"TEN_SAN_PHAM_DA_XAC_NHAN","variant":"BIEN_THE_DUNG","sourceId":"ID_TAI_LIEU_DA_DOC","confirmed":true},
  "claimRequirements": {"priceMentioned":false,"promotional":false},
  "media": [{"path":"DUONG_DAN_FILE_ANH_THAT","role":"product","sourceId":"ID_ANH_GOC_NATIVE","originalAssetId":"ID_ANH_GOC_NATIVE","businessId":"ID_DOANH_NGHIEP_THAT"}]
}
```

`sources[].id` phải duy nhất; mọi nguồn và media đúng businessId. `media[].sourceId` phải tham chiếu nguồn `confirmed:true`. Giữ native ID gốc trong `originalAssetId`; `path` phải là file đã xuất đọc được. `media://...`, URL xem trước hoặc receipt JSON không thay file ảnh. File nguồn có thể nằm ngoài workspace nếu được cung cấp rõ; helper sao chép bản vào kho job, giữ nguồn và hash. Không đoán đường dẫn từ asset ID.

Nếu bài/ảnh nhắc giá, thêm `product.price: {"display":"GIA_DA_XAC_NHAN","sourceId":"ID_NGUON_GIA"}` và nguồn tương ứng. Nếu khuyến mãi, thêm `product.offer` gồm `startsAt`, `endsAt` theo ISO có timezone, `terms`, `sourceId`; đặt `claimRequirements.promotional:true`. `publishAt` nếu có cũng dùng ISO có timezone. Ưu đãi phải hợp lệ tại ngày dự kiến đăng và chưa hết hạn hiện tại. Helper còn dò từ khóa giá/khuyến mãi trong caption và `media[].visualText`; kiểm thủ công cả chữ trên ảnh, không coi regex là đủ. Banner do renderer tạo tự ghi `visualText`.

Với phần mềm/dịch vụ, dùng screenshot hoặc ảnh hoạt động đúng đã xác nhận. Không bịa bao bì, kết quả, giảm giá hoặc tính năng. Nhánh bài bán hàng dùng ảnh thật; nhánh banner có thể ghép ảnh gốc vào bố cục, giữ hình dạng, nhãn và biến thể.

## Chín định dạng và điều kiện riêng

| `format` | Đầu vào ngoài caption |
|---|---|
| `text` | Không bắt buộc media |
| `product_post` | `product` có nguồn xác nhận, ảnh role `product` hoặc `product_banner` |
| `personal_quote` | `person:{confirmed:true,sourceId:...}`, nguồn đúng người và ảnh role `portrait` |
| `visual_insight` | Ảnh minh họa thực, thống nhất insight của bài |
| `carousel_album` | Ít nhất hai ảnh, `order` liên tiếp 1, 2… theo thứ tự mảng |
| `infographic_diagram` | Ảnh infographic/sơ đồ thực |
| `broll_text` | Đúng một MP4 thành phẩm role `video`; không coi clip nguồn là bản đã dựng |
| `voice_video` | MP4 có âm thanh, `hasAudio:true`, `voice:{confirmed:true,sourceId:...}` và nguồn giọng thật |
| `comment_thread` | `comments` là mảng bình luận không rỗng theo thứ tự; caption là bài mở đầu |

Mọi bài hoàn chỉnh cần caption, kể cả ảnh insight, banner và video. Carousel dùng một caption chung. Có thể dùng `openingPost` khi tạo chuỗi bình luận, helper chuyển thành caption. Video có thể thêm media role `subtitles` trỏ file SRT thực.

Khách yêu cầu rõ chỉ làm ảnh: tạo job riêng `taskKind:"asset"`, `assetRequest:{"by":"NGUOI_YEU_CAU","instruction":"YEU_CAU_ANH_LE_NGUYEN_GOC"}`. Vẫn kiểm nguồn, sản phẩm/người và media. Tác vụ này không được duyệt thành bài đăng hoàn chỉnh và không xuất `Bài viết.txt`.

## QA, bản xem trước và duyệt

Chỉ ghi QA sau khi đọc caption, mở từng ảnh hoặc xem/nghe video thực. Với sản phẩm kiểm lại dữ kiện, ảnh gốc, chữ trên banner và thời hạn. JSON QA:

```json
{
  "reviewer":"NGUOI_HOAC_AGENT_DA_KIEM_THUC",
  "checks":{"factual":true,"brand":true,"captionMediaMatch":true,"productFidelity":true}
}
```

`factual/brand` bắt buộc; bài có media thêm `captionMediaMatch`; sản phẩm thêm `productFidelity`; ảnh cá nhân thêm `personIdentity`; video thêm `videoPlayback/videoTextReadable`; giọng đọc thêm `voiceAudible`. Các điều kiện không đạt phải sửa, không đặt true để qua cửa kiểm. QA video còn giải mã file thật qua FFmpeg, yêu cầu luồng hình và thêm luồng âm thanh với giọng đọc. Khi FFmpeg không ở PATH, truyền `--ffmpeg ABS_EXECUTABLE` cho lệnh QA, hoặc cấu hình `FREEUP_FFMPEG_PATH` từ môi trường đã kiểm.

Sau QA đạt, `export` giao bản xem thử **trước khi khách duyệt**; trạng thái `EXPORTED_FOR_REVIEW`. Khách duyệt đúng bản đang xem thì gọi `approve` với `{"by":"TEN_NGUOI_DUYET","instruction":"CHI_DAN_DUYET_THAT"}`. Hash gắn với nội dung, phiên bản và media; sửa hoặc thay byte media cần kiểm lại. Phê duyệt này là duyệt nội dung, không tự cấp quyền đăng lên mọi kênh/giờ.

Đầu ra ở **Nội dung của tôi/Nội dung đã tạo/<ngày>/<loại> - <tiêu đề> - <mã> - v<số>/**, gồm **Bài viết.txt**, **Xem bài.html** và media thực phù hợp. Ảnh renderer là **Ảnh 01.png**; ảnh nguồn JPG/WebP giữ đúng đuôi **Ảnh 01.jpg/.webp**, không đổi đuôi giả thành PNG. Video là **Video.mp4**, phụ đề nếu có là **Phụ đề.srt**. Trả các đường dẫn thật từ `delivery/files`. Không có lệnh publisher trong helper; đăng qua native tool chỉ sau chỉ dẫn và kiểm kết quả thực theo skill host.

## Render ảnh local hoặc dùng ảnh native

Ưu tiên native ảnh khi cần minh họa giàu ngữ nghĩa; đọc [9b-native-tools.md](9b-native-tools.md), lấy schema công cụ thực. Schema generation đã kiểm nhận `prompt`, `title?`, `referenceAssetIds`, `referenceMediaRefs?`, `count` từ 1–4; không tự thêm `size/aspectRatio/resolution`. Sau tool vẫn phải xuất, mở và kiểm file thật rồi mới gắn vào job.

Renderer local phù hợp khi đã có ảnh, screenshot, bố cục hoặc dữ liệu sơ đồ:

```text
node scripts/contentlab.cjs render --workspace ABS --input ABS_RENDER_JSON
```

```json
{
  "businessId":"ID_DOANH_NGHIEP_THAT",
  "sourceId":"ID_NGUON_DA_XAC_NHAN",
  "format":"product_banner",
  "brand":{"name":"TEN_THUONG_HIEU","colors":{"accent":"#087f76","background":"#f6f3eb","text":"#18353e"}},
  "product":{"confirmed":true},
  "cards":[{"headline":"TIEU_DE_NGAN_DA_KIEM","body":"THONG_TIN_SAN_PHAM_CO_NGUON","cta":"LOI_MOI_PHU_HOP","image":"DUONG_DAN_ANH_HOAC_SCREENSHOT_THAT"}]
}
```

Renderer nhận các format: `product_banner`, `personal_quote`, `visual_insight`, `carousel`, `infographic`, `broll_text`, `voice_video`; lưu ý tên renderer `carousel/infographic` khác khóa job. `personal_quote` thêm `person:{confirmed:true}` và ảnh gốc. `carousel` cần ít nhất hai cards. `visual_insight/infographic` cần `cards[].image` đã chọn hoặc ít nhất hai `panels:[{title,body},...]` có cấu trúc; không nhận một tấm toàn chữ như đã đủ minh họa. `brand.logo` tùy chọn là file ảnh local. Chữ được escape, mạng bị chặn trong trang render, tràn chữ/ảnh lỗi giải mã làm dừng. Kết quả `media` có thể chuyển sang job với sources tương ứng; `completePost:false` nghĩa render xong chưa phải bài hoàn chỉnh.

## Video 7/8 và phụ thuộc tùy chọn

Video input dùng `format:"broll_text"` hoặc `"voice_video"`, `duration` 3–90 giây, `clips:[{path,start,duration},...]`, `cards` chứa chữ ngắn trên video. Nhánh giọng thêm `voice:{path:"FILE_AUDIO_THAT"}`; nhạc tùy chọn `music:"FILE_NHAC_THAT"`; phụ đề tùy chọn `subtitles:[{start:0,end:2.5,text:"DONG_PHU_DE"},...]`. Thời gian tính bằng giây; clip phải đủ độ dài đã chọn. Renderer dựng MP4 thật, bỏ tiếng clip nguồn, ghép giọng/nhạc đã chọn; không tự tổng hợp giọng từ tên người. Cần giọng mới thì dùng công cụ giọng đã được host cấp, xác nhận giọng và xuất audio trước. Chọn thiếu nhạc vẫn có thể dựng không nhạc; thiếu giọng chỉ chờ nhánh 8.

Ảnh local cần module `puppeteer` và browser khả dụng. Video cần thêm FFmpeg; renderer tìm `ffmpeg-static` hoặc `ffmpeg` trong PATH, có thể dùng `FREEUP_FFMPEG_PATH`. Các cờ hỗ trợ: `--browser-module ABS_MODULE`, `--browser-executable ABS_BROWSER`, `--ffmpeg ABS_EXECUTABLE`. Không ghi đường dẫn máy người tặng vào skill hoặc hướng dẫn khách.

Bộ cài skill không tải phụ thuộc video khi khách chỉ mở menu/viết bài. Khi cần renderer, trợ lý chạy `contentlab.cjs renderer-setup --workspace ABS --install`; helper tự chuẩn bị Puppeteer-core/FFmpeg trong kho runtime riêng ngoài skill, dùng Chrome/Edge đã có và kiểm PNG/FFmpeg thật. Router đọc `runtime/renderer.json` và truyền cấu hình đã kiểm cho render/QA; khách không nhập npm hoặc sửa đường dẫn. Máy chưa có browser phù hợp/mạng không tải được thì báo đúng giới hạn và vẫn cho dùng nhánh đang đủ công cụ. Không gọi HTML/kịch bản/receipt là PNG/MP4 hoàn chỉnh.
