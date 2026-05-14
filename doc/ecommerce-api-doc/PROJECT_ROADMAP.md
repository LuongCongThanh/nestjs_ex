# Project Roadmap & Code Implementation Review

> [!NOTE]
> This document tracks the **actual codebase implementation status**, charting dependencies, critical paths, and technical debt. The repository now uses the phased `TASK-101` to `TASK-329` numbering scheme, and the coding phase is still concentrated in the foundation layer.

---

## Executive Summary

The foundational layers of the E-commerce API (NestJS scaffolding, PostgreSQL connection, Prisma configuration, and basic JWT Auth) are successfully deployed into the codebase. The project is currently blocked at the structural entity layer (Phase 2), preventing higher-order business logic (Routing, Carts, Checkout) from proceeding.

---

## Codebase Status Report

### ✅ Completed Implementation (Foundation Baseline)

The following infrastructure is actively running in the repository:

- Project scaffolding (`package.json`, generic NestJS modules).
- Dockerized PostgreSQL infrastructure (`docker-compose.yml`).
- Early Database definitions (`User` Entity).
- Base JWT Authentication mechanism (Login/Register pipelines).

### 🚧 Critical Path Blockers (High Priority)

The following modules must be coded immediately. **Do not attempt to build UI or controllers until the Prisma schema and relational flows are thoroughly defined and migrated.**

1. **Module: Categories (`TASK-108`)**
   - _Dependency_: Required by Products.
2. **Module: Products (`TASK-109`)**
   - _Dependency_: Required by Carts and Orders.
3. **Module: Carts & Orders (`TASK-110`, `TASK-111`)**
   - _Dependency_: Finalizes the core relational schema.
4. **Module: Migrations (`TASK-112`)**
   - _Action_: Generating the SQL schema from the entities above.
5. **Infrastructure: Guards (`TASK-117`)**
   - _Action_: Securing endpoints using the previously built JWT framework.

---

## Dependency Graph (Critical Path)

The Mermaid diagram below visualizes the strict linear dependencies of the implementation phase. A node cannot be coded until its parents are completed and merged.

```mermaid
graph TD
   T106[TASK-106: Database Schema ✅] --> T108[TASK-108: Category Entity]
   T108 --> T109[TASK-109: Product Entity]
   T109 --> T110[TASK-110: Cart Entities]
   T109 --> T111[TASK-111: Order Entities]

   T110 --> T112[TASK-112: SQL Migrations]
   T111 --> T112

   T114[TASK-114: JWT Auth ✅] --> T117[TASK-117: Auth Guards]
   T117 --> T118[TASK-118: Users CRUD]
   T118 --> T119[TASK-119: User Profile]

   T112 --> T201[TASK-201: Categories CRUD]
   T117 --> T201
   T201 --> T202[TASK-202: Category Tree Hierarchy]

   T112 --> T203[TASK-203: Products CRUD]
   T201 --> T203
   T203 --> T204[TASK-204: Product Search]
   T203 --> T205[TASK-205: Stock DB Tx]

   T203 --> T207[TASK-207: Shopping Cart]
   T207 --> T208[TASK-208: Cart Math]
   T208 --> T209[TASK-209: Order Creation Tx]
   T209 --> T210[TASK-210: Order Mgmt]

   style T106 fill:#10b981,color:#fff
   style T114 fill:#10b981,color:#fff
   style T108 fill:#f59e0b,color:#fff
   style T109 fill:#f59e0b,color:#fff
   style T110 fill:#f59e0b,color:#fff
   style T111 fill:#f59e0b,color:#fff
   style T112 fill:#f59e0b,color:#fff
   style T117 fill:#f59e0b,color:#fff
```

---

## Development Constraints & Best Practices

> [!WARNING]
> Deviating from these practices will introduce insurmountable technical debt in Phase 5.

### Prisma Migration Strategy

- **Immutability**: NEVER edit a migration file that has already been executed (`migration:run`). If a mistake was made, run `migration:revert` or generate a new migration to adjust the schema.
- **Data vs. Schema**: Do not mix structural `ALTER TABLE` operations with complex `INSERT`/`UPDATE` data migrations in the same file.

### Test-Driven Development (TDD)

- **Simultaneous Testing**: Write unit tests alongside the service implementation. Do not save testing for "Phase 6".
- **Coverage**: Every critical financial calculation (e.g., Cart Math, Order Totals) demands 100% branch test coverage.

### Operational Routine

When beginning a work session:

1. Pull the latest code.
2. Spin up Docker: `docker-compose up -d`.
3. Review `PROJECT_STATUS.md` and the relevant phased task file.
4. Select the next unblocked task from the Dependency Graph.
