# Documentation Quick Start

Chào mừng đến với tài liệu E-Commerce API. Tài liệu này được tổ chức thành 80 task chia theo 3 phase. Đây là hướng dẫn nhanh để bắt đầu.

---

## Bắt đầu từ đây

| Bạn muốn... | Đọc file này |
|-------------|-------------|
| Biết dự án đang ở đâu, làm gì tiếp theo | [`ecommerce-api-doc/PROJECT_STATUS.md`](./ecommerce-api-doc/PROJECT_STATUS.md) |
| Hiểu mục tiêu kinh doanh và yêu cầu tổng thể | [`ecommerce-api-doc/BUSINESS_REQUIREMENTS_DOCUMENT.md`](./ecommerce-api-doc/BUSINESS_REQUIREMENTS_DOCUMENT.md) |
| Tìm một task cụ thể để implement | [`ecommerce-api-doc/TASK_INDEX.md`](./ecommerce-api-doc/TASK_INDEX.md) |
| Hiểu cấu trúc database | [`ecommerce-api-doc/DATABASE_SCHEMA.md`](./ecommerce-api-doc/DATABASE_SCHEMA.md) |
| Chạy lệnh dev / migration / seed | [`ecommerce-api-doc/COMMANDS.md`](./ecommerce-api-doc/COMMANDS.md) |
| Hiểu ngôn ngữ domain (Order, Cart, User...) | [`../CONTEXT.md`](../CONTEXT.md) |

---

## Cấu trúc tài liệu

```
doc/
├── QUICKSTART.md                    ← Bạn đang ở đây
├── be-skills-guide.md               ← Danh sách skill kỹ thuật tham khảo
├── project-conventions.vi.md        ← Quy ước code (tiếng Việt)
├── project-conventions.en.md        ← Quy ước code (tiếng Anh)
└── ecommerce-api-doc/
    ├── TASK_INDEX.md                ← Index toàn bộ 80 tasks
    ├── PROJECT_STATUS.md            ← Trạng thái hiện tại + priorities
    ├── PROJECT_ROADMAP.md           ← Dependency graph giữa các task
    ├── BUSINESS_REQUIREMENTS_DOCUMENT.md  ← Yêu cầu nghiệp vụ
    ├── DATABASE_SCHEMA.md           ← Sơ đồ ER + thiết kế DB
    ├── DATABASE_SETUP.md            ← Hướng dẫn cài đặt PostgreSQL
    ├── COMMANDS.md                  ← Lệnh dev thường dùng
    ├── 01-Phase-1-Foundation/       ← 25 tasks (✅ 100% done)
    ├── 02-Phase-2-Revenue/          ← 26 tasks (🔄 ~15% done)
    └── 03-Phase-3-Scale/            ← 29 tasks (⏳ 0% done)
```

---

## Cách dùng một Task file với AI

Mỗi task file là một bản đặc tả độc lập. Quy trình chuẩn:

1. **Chọn task tiếp theo** từ `PROJECT_STATUS.md` → mục "Immediate Priorities"
2. **Mở task file** tương ứng trong `TASK_INDEX.md`
3. **Đọc codebase hiện tại** trước khi bắt đầu — task file mô tả *mục tiêu*, không phải *trạng thái hiện tại*
4. **Implement** theo acceptance criteria trong task file
5. **Cập nhật `PROJECT_STATUS.md`** sau khi hoàn thành

> **Với AI pair-programmer:** Paste nội dung task file vào context, kèm theo output của `git status` và các file liên quan. AI sẽ dùng task file như một spec để implement.

---

## 3 Phases

| Phase | Phạm vi | Trạng thái |
|-------|---------|-----------|
| **Phase 1 — Foundation** | Setup, entities, auth, users | ✅ 100% done |
| **Phase 2 — Revenue** | Products, cart, orders, payments | 🔄 ~15% done |
| **Phase 3 — Scale** | Tests, caching, CI/CD, microservices | ⏳ Chưa bắt đầu |

Xem chi tiết tại [`PROJECT_STATUS.md`](./ecommerce-api-doc/PROJECT_STATUS.md).
