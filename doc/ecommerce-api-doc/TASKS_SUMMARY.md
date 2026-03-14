# Task Architecture & Documentation Summary

> [!NOTE]
> This document explains the architecture of the fragmented task documentation system. It serves as an index and guide for navigating the 76 individual execution plans.

---

## Executive Summary
Large monolithic markdown files (like the original 3,880-line `plan.md`) are antithetical to agile development and cause cognitive overload for both human engineers and AI coding assistants. The E-commerce API project plan has been successfully fractured into 76 isolated, highly-detailed implementation plans located in the `tasks/` directory.

---

## Design Decisions
- **Isolation**: Each task file (e.g., `TASK-00001-Khởi-tạo-Project-NestJS.md`) contains the exact dependencies, schema, and API scope required to build *only* that feature.
- **Standardization**: Every implementation plan adheres to a strict template featuring an Executive Summary, Design Decisions, Bite-Sized Tasks, and Security/Performance Notes. This ensures AI coding agents (using the `executing-plans` skill) always receive a predictable prompt structure.
- **Prioritization Tagging**: Tasks are tagged as Core (01-65) and Optional/Advanced (66-73).

---

## Documentation Structure

```text
ecommerce-api/
├── plan.md (Original Monolith - Archived)
├── doc/ecommerce-api-doc/
│   ├── tasks/
│   │   ├── TASK-00001-Khởi-tạo-Project-NestJS.md
│   │   ├── TASK-00002-Setup-Environment-Configuration.md
│   │   ├── ... (68 core task implementation plans)
│   │   ├── TASK-004.5-Setup-Global-Validation-Error-Handling.md
│   │   ├── TASK-011.5-Migration-Best-Practices-Strategy.md
│   │   ├── TASK-023.5-Product-Images-File-Upload.md
│   │   ├── TASK-00066-GraphQL-API-Alternative-to-REST.md (Optional pipeline)
│   │   └── ... (7 advanced optional features)
│   └── scripts/
│       ├── split-tasks.ps1 (Archived - Used for initial monolith destruction)
│       ├── create-optional-tasks.ps1
│       └── check-progress.ps1 (Validates completion constraints)
```

---

## Bite-Sized Statistics

| Category | Count | Description |
|----------|-------|-------------|
| **Core Roadmap** | 65 | Tasks 01-65 (Mandatory MVP Path) |
| **Pipeline Injections** | 3 | Tasks 4.5, 11.5, 23.5 (Critical mid-path infrastructure additions) |
| **Advanced Operations** | 8 | Tasks 66-73 (Enterprise-grade optional features like 2FA and RecSys) |
| **TOTAL PLANS** | **76** | All architectural blueprints |

---

## Developer Workflow

> [!TIP]
> To execute a task efficiently using an AI pair-programmer:

1. **Pick the next task** from `TASKS_QUICK_SUMMARY.md`.
2. **Review the Blueprint**: Open `tasks/TASK-XXX.md` to internalize the architecture.
3. **Execute via AI Agent**: Prompt your AI assistant using the `executing-plans` skill and provide the `.md` path.
4. **Mark Complete**: Edit the `.md` file to change `> **Status:** Not Started` to `> **Status:** ✅ Done`, and update the Time Tracking metadata.
5. **Verify Project Velocity**: Run `.\check-progress.ps1` to recalculate the project burn-down chart.

## Security & Performance Notes
- **Security**: Advanced tasks (66-73) such as RBAC and Two-Factor Authentication require precise implementation of Guards. Do not attempt these tasks before TASK-15 (Application Guards) is fully verified.
- **Performance**: The `split-tasks.ps1` script is no longer required for daily operations. Do not re-run it, as it may overwrite the meticulously standardized individual implementation plans.
