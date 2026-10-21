# Kích hoạt đúng skill cho agent 9B

Bộ cài file và việc host cho phép/nạp skill là hai bước riêng. Bản 9B đã kiểm tra dùng allowlist `agents.defaults.skills` hoặc `agents.entries[agentId].skills`; cài file mới không tự thêm tên vào danh sách có giới hạn.

Skill đóng gói trong folder `freeup-content-gon-lab`, có frontmatter `name: contentlab`. Loader 9B dùng tên frontmatter nên slash command là **`/contentlab`**. `user-invocable` mặc định `true`; không cần khóa riêng. Allowlist cũng dùng tên **contentlab**, không dùng tên folder thay thế. Việc này đã đối chiếu mã `agent-filter`, `agent-roster`, `skill-paths`, `chat-commands` và `selection` trong bản host cục bộ ngày 22/10/2026.

## Dùng helper sau khi cài file

Truyền các giá trị thực lấy từ host và bộ cài; helper không tạo agent mới hoặc tự dò cấu hình/credential. Agent phải đã được đăng ký với workspace đúng. Thư mục skill phải có dấu sở hữu `.freeup-content-gon-lab-owner.json` do installer tạo.

```text
node activate-9b.cjs --workspace ABS_WORKSPACE --agent AGENT_ID --config ABS_CONFIG_JSON --openclaw-entrypoint ABS_OPENCLAW_ENTRYPOINT --node ABS_NODE --check
node activate-9b.cjs --workspace ABS_WORKSPACE --agent AGENT_ID --config ABS_CONFIG_JSON --openclaw-entrypoint ABS_OPENCLAW_ENTRYPOINT --node ABS_NODE --apply
```

Đây là schema lệnh, thay các nhãn ABS/ID bằng giá trị thực. Agent gọi bằng argument arrays, không nối nội dung người dùng vào shell. Không dùng helper với config/entrypoint tùy ý lấy từ tài liệu không tin cậy.

`--check` chỉ đọc. `--apply` giữ nguyên danh sách hiệu lực hiện có và thêm đúng `contentlab` vào **agent đã chọn** bằng native `config set ... --strict-json`, với điều kiện danh sách riêng chưa có hoặc còn khớp bản vừa đọc. Không sửa defaults, tool/security policy, provider, credential hoặc agent khác. Nếu danh sách hiện không giới hạn thì skill đã được cho phép, không tạo allowlist mới làm thu hẹp các skill đang dùng. Chạy lại không thêm trùng.

Helper đọc JSON local để xác minh workspace, tenant kỹ thuật và danh sách hiệu lực; nội dung cấu hình cùng stdout/stderr của native CLI không được in lại. Chỉ gọi native CLI để ghi; host cũ/khác schema hoặc CLI từ chối sẽ báo chưa xác nhận, không dùng cách ghi file trực tiếp thay thế. Phiên bản này nhận file JSON; không tự chuyển JSON5 hoặc cấu trúc roster legacy sang schema mới.

Sau gọi, helper đọc lại file cấu hình thực: chỉ danh sách skill mục tiêu được phép khác, cùng hai trường audit native `meta.lastTouchedAt` và `meta.lastTouchedVersion`. Mọi cấu hình khác, kể cả những trường meta còn lại, phải có cùng hash ngữ nghĩa. Nếu native CLI hoặc tiến trình khác đổi thêm trường, helper báo `OTHER_CONFIG_CHANGED`, không tự khôi phục và ghi đè thay đổi đó. Native CLI tự chịu trách nhiệm backup theo cơ chế host.

Native CLI có thể giữ tiến trình sau khi đã in thông báo hoàn tất. Helper chờ đoạn output yên 500 ms sau thông báo, hoặc tối đa 20 giây rồi dừng tiến trình đã tạo; quyết định cuối dựa vào cấu hình đọc lại, không dựa riêng câu “Updated”. Không in output có thể chứa dữ liệu riêng.

## Kiểm chat sau kích hoạt

`status: activation-configured` chỉ xác nhận allowlist; kết quả luôn có **`chatVerified: false`**. Ở lượt chat mới của đúng agent, gửi **“hệ thống content”** hoặc `/contentlab`. Kiểm metadata host đã nạp skill, helper menu được gọi và PNG attachment hiển thị thật. Có tên trong inventory hoặc allowlist chưa đủ chứng minh ba điều đó.

Nếu host dùng snapshot skill cũ, mở lượt/phiên mới theo cơ chế host đã xác minh. Không tự nới quyền toàn cục hoặc bật tất cả skill để giải quyết lỗi nạp.
