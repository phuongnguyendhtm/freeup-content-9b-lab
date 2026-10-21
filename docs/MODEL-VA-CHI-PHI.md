# Model và chi phí cho FreeUp Content trên 9B

**Ngày đối chiếu: 22/10/2026.** Giá dưới đây được kiểm tra bằng cách mở tài liệu chính thức của từng hãng; chưa có benchmark tiếng Việt riêng cho bộ quà FreeUp.

## Lựa chọn mặc định

**Dùng GPT-6.1 Sol, mức suy luận `high` khi kết nối hỗ trợ, để triển khai/kiểm thử installer và skill, đồng thời viết và duyệt nội dung hằng ngày.** Đây là lựa chọn cân bằng chất lượng và chi phí. Chỉ dùng **GPT-6 Astra** cho review khó nhất, lỗi kéo dài hoặc bài quan trọng mà Sol chưa đạt tiêu chí. Hướng dẫn OpenAI định vị Sol cho công việc phức tạp với chi phí thấp hơn Astra. [Official OpenAI documentation](https://developers.openai.com/api/docs/guides/latest-model)

**Claude Sonnet 5.5** là phương án pilot thay thế; **Opus 5.5** là tùy chọn premium nếu kết quả thực tế tốt hơn đủ để bù chi phí. Chưa có cơ sở để tuyên bố model nào thắng về giọng văn tiếng Việt FreeUp. Nên chấm mù cùng 20–30 đề bài theo đúng giọng, độ đúng dữ kiện, mức sửa tay và chi phí trên bài được chấp nhận. [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Claude model overview](https://platform.claude.com/docs/en/models/overview)

## Kết nối 9B hiện tại

Cấu hình đã được kiểm tra **chỉ đọc**: model chính là `openai/gpt-6.1-sol`; bốn ID OpenAI được khai báo gồm Astra, GPT-6.1 Sol, GPT-6 Sol và Luna, với trường `api: openai-chatgpt-responses`. Đây là kết nối kiểu ChatGPT/Responses đang có, **không phải bằng chứng khách đang trả tiền theo bảng giá direct API**.

Không cần yêu cầu khách mua API key trả phí để sử dụng kết nối 9B hiện đã thiết lập. Hóa đơn và hạn mức thực tế phụ thuộc cách xác thực, thuê bao, credit và provider/gateway. Giá API không quy đổi thành số tác vụ được bao gồm trong thuê bao ChatGPT/Codex. [ChatGPT/Codex pricing](https://learn.chatgpt.com/docs/pricing)

Model có tên trong cấu hình vẫn phải được kiểm tra toàn luồng: đọc skill, viết tiếng Việt, gọi tool, nhận kết quả tool và lưu bản nháp. GPT-6.1 Sol/Astra yêu cầu Responses API khi gọi tool; cấu hình kiểu Responses là tín hiệu phù hợp nhưng chưa chứng minh toàn bộ adapter hoạt động đúng. Không sửa cấu hình trong tài liệu này. [OpenAI compatibility guidance](https://developers.openai.com/api/docs/guides/latest-model)

## Giá API minh họa

**USD / 1 triệu token; Standard, đầu vào không cache, ngữ cảnh ngắn.** Đây là giá direct API niêm yết, chưa gồm phí gateway hay thuế.

| Model | Input | Output | 100 tác vụ mẫu |
|---|---:|---:|---:|
| GPT-6.1 Sol | $2 | $10 | $3.60 |
| GPT-6 Astra | $10 | $50 | $18.00 |
| GPT-6 Luna | $0.10 | $0.50 | $0.18 |
| Claude Sonnet 5.5 | $2 | $10 | $3.60 |
| Claude Opus 5.5 | $4 | $20 | $7.20 |
| Gemini 3.8 Flash | $0.75 | $3.75 | $1.35 |

Nguồn: [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

Giả định: mỗi tác vụ có **8.000 input + 2.000 output được tính tiền**, một lượt gọi. Tổng 100 tác vụ là 0,8 triệu input + 0,2 triệu output; ví dụ Sol: `0,8 × $2 + 0,2 × $10 = $3.60`. Chưa gồm lượt QA bổ sung, retry, thinking vượt giả định output, tìm kiếm, ảnh hoặc storage. Tokenizer khác nhau nên cùng nội dung tiếng Việt có thể dùng lượng token khác nhau.

Gemini 3.8 Flash đang có giá giới thiệu đến **31/12/2026**; từ **01/01/2027** là $1.50 input / $7.50 output, tức **$2.70/100 tác vụ mẫu**. Chỉ cân nhắc khi 9B/provider thực sự hỗ trợ và pilot đạt yêu cầu. [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

Thuê bao và API là các cơ chế sử dụng khác nhau. Riêng Claude Max/Team hiện có chương trình API credit cần claim và liên kết Console; không suy rộng quyền lợi đó sang mọi gói hoặc gateway. [Claude API credits](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers)

## Cách giữ chi phí thấp

- Bắt đầu với **một Sol**. Chỉ tự động chuyển model nếu 9B hỗ trợ và đã kiểm thử; không giả định có routing theo từng bước.
- Nạp skill và tài liệu cần cho việc hiện tại. Cache hồ sơ thương hiệu/hướng dẫn ổn định khi kết nối hỗ trợ; tính cả phí ghi cache và storage theo provider.
- Dùng code cho đếm từ, kiểm trường bắt buộc, schema, tên file, trùng lặp và đóng gói. Chạy code kiểm tra cục bộ không tiêu thụ token LLM; lượt nhờ model viết/sửa code vẫn có thể tiêu thụ usage.
- Giới hạn vòng viết–duyệt; đo số bài đạt, số lần sửa và usage thực tế. Batch có thể giảm chi phí direct API cho việc nền nếu adapter hỗ trợ. [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)

## Ảnh là ngân sách riêng

Tái sử dụng menu tĩnh, template và asset đã duyệt. Dùng render/validation cục bộ cho phần có thể dựng bằng code; chỉ gọi model ảnh khi cần tạo hoặc chỉnh ảnh mới. Không gộp chi phí tạo ảnh vào bảng token viết bài. Giá ảnh phụ thuộc model, kích thước, chất lượng, số lần thử và provider. [OpenAI image pricing](https://developers.openai.com/api/docs/pricing), [Gemini image pricing](https://ai.google.dev/gemini-api/docs/pricing)
