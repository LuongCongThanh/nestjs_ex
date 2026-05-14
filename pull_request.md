Trong project có nhiều người cùng làm việc, Git workflow rất quan trọng để tránh:

- conflict liên tục
- code đè nhau
- deploy lỗi
- khó review
- khó rollback

Workflow phổ biến hiện nay thường kết hợp:

- Git Flow hoặc GitHub Flow
- Pull Request (PR)
- Code Review
- CI/CD

---

# Workflow Git chuẩn cho team nhiều người

## 1. Các branch chính

Ví dụ:

| Branch      | Ý nghĩa                 |
| ----------- | ----------------------- |
| `main`      | Code production ổn định |
| `develop`   | Branch tổng hợp để dev  |
| `feature/*` | Làm feature mới         |
| `bugfix/*`  | Sửa bug                 |
| `hotfix/*`  | Fix gấp production      |
| `release/*` | Chuẩn bị release        |

---

# Flow thực tế

## Bước 1 — Clone project

```bash
git clone <repo>
```

---

# Bước 2 — Luôn cập nhật branch develop/main

Ví dụ team dùng `develop`

```bash
git checkout develop
git pull origin develop
```

---

# Bước 3 — Tạo branch riêng để làm task

Ví dụ:

```bash
git checkout -b feature/login-page
```

hoặc:

```bash
git switch -c feature/login-page
```

---

# Quy tắc đặt tên branch

| Type     | Ví dụ                   |
| -------- | ----------------------- |
| Feature  | `feature/auth-login`    |
| Bug      | `bugfix/cart-total`     |
| Hotfix   | `hotfix/payment-error`  |
| Refactor | `refactor/user-service` |

---

# Bước 4 — Code + commit nhỏ

## Commit message chuẩn

### Conventional Commits

```bash
feat: add login api
fix: fix crash on checkout
refactor: clean auth service
style: format code
test: add unit test
```

---

# Bước 5 — Push branch lên remote

```bash
git push origin feature/login-page
```

---

# Bước 6 — Tạo Pull Request (PR)

Ví dụ:

```text
feature/login-page
→ merge vào develop
```

Team sẽ:

- review code
- comment
- CI test
- check coding convention

---

# Bước 7 — Resolve conflict nếu có

Trước khi merge:

```bash
git checkout develop
git pull origin develop

git checkout feature/login-page
git merge develop
```

Fix conflict → commit lại.

---

# Bước 8 — Merge PR

Có 3 kiểu merge:

| Type         | Ý nghĩa            |
| ------------ | ------------------ |
| Merge Commit | Giữ full history   |
| Squash Merge | Gộp commit sạch sẽ |
| Rebase Merge | History đẹp        |

Team hiện đại thường dùng:

```text
Squash Merge
```

để lịch sử commit sạch hơn.

---

# Bước 9 — Xóa branch cũ

Local:

```bash
git branch -d feature/login-page
```

Remote:

```bash
git push origin --delete feature/login-page
```

---

# Git Workflow thực tế trong công ty

## Flow phổ biến nhất hiện nay

```text
main
 └── develop
      ├── feature/auth
      ├── feature/cart
      ├── bugfix/payment
      └── feature/search
```

---

# Best Practices cực quan trọng

## 1. Không commit trực tiếp vào main

Sai:

```bash
git push origin main
```

Đúng:

```text
feature branch → PR → review → merge
```

---

# 2. Pull thường xuyên

```bash
git pull origin develop
```

tránh conflict lớn.

---

# 3. Commit nhỏ và rõ ràng

Sai:

```text
update code
fix stuff
```

Đúng:

```text
feat: add forgot password api
fix: validate email regex
```

---

# 4. Không để branch sống quá lâu

Branch sống lâu:

- conflict nhiều
- khó review
- khó merge

Tốt nhất:

```text
1 task = 1 branch
```

---

# 5. Review code bắt buộc

Review giúp:

- phát hiện bug
- học code lẫn nhau
- giữ coding standard

---

# 6. Dùng protected branch

Trên [GitHub](https://github.com?utm_source=chatgpt.com) / [GitLab](https://gitlab.com?utm_source=chatgpt.com):

- cấm push trực tiếp main
- bắt buộc PR
- bắt buộc CI pass

---

# Workflow nâng cao hơn

## GitHub Flow (startup/team nhỏ)

Đơn giản hơn:

```text
main
 ├── feature/a
 ├── feature/b
```

Flow:

```text
feature → PR → main
```

Deploy liên tục.

---

# Git Flow (enterprise/team lớn)

Nhiều branch hơn:

```text
main
develop
release/*
hotfix/*
feature/*
```

Ổn định nhưng hơi phức tạp.

---

# Workflow phù hợp cho bạn (Frontend/Next.js Team)

Với kiểu project React/Next.js microservice/team FE nhiều người:

## Khuyên dùng

```text
main
develop
feature/*
bugfix/*
```

Kèm:

- PR review
- Husky
- lint-staged
- CI/CD
- Conventional Commits

Rất phù hợp với stack của bạn:

- Next.js
- TypeScript
- ESLint
- Prettier
- Husky

---

# Công cụ nên dùng thêm

| Tool                                                                                             | Mục đích                |
| ------------------------------------------------------------------------------------------------ | ----------------------- |
| [Husky](https://typicode.github.io/husky/?utm_source=chatgpt.com)                                | Git hooks               |
| [lint-staged](https://github.com/lint-staged/lint-staged?utm_source=chatgpt.com)                 | Check file trước commit |
| [Commitlint](https://commitlint.js.org/?utm_source=chatgpt.com)                                  | Validate commit message |
| [GitHub Actions](https://github.com/features/actions?utm_source=chatgpt.com)                     | CI/CD                   |
| [Semantic Release](https://semantic-release.gitbook.io/semantic-release/?utm_source=chatgpt.com) | Auto release/version    |

---

# Ví dụ workflow hoàn chỉnh mỗi ngày

```bash
# cập nhật code mới
git checkout develop
git pull origin develop

# tạo branch task
git checkout -b feature/user-profile

# code...
git add .
git commit -m "feat: add user profile page"

# push
git push origin feature/user-profile

# tạo PR
# review
# merge
```

---

# Những lỗi người mới hay gặp

| Lỗi                   | Hậu quả        |
| --------------------- | -------------- |
| Commit trực tiếp main | Production lỗi |
| Không pull trước      | Conflict lớn   |
| Branch quá lâu        | Merge cực khổ  |
| Commit quá to         | Review khó     |
| Force push bừa        | Mất code team  |

---

# Nếu muốn level chuyên nghiệp hơn

Bạn nên học tiếp:

1. Rebase
2. Cherry-pick
3. Interactive rebase
4. Git hooks
5. CI/CD pipeline
6. Monorepo workflow
7. Trunk-based development
8. Release strategy
9. Semantic versioning
10. GitOps
