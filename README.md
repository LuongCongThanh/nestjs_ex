# E-Commerce API (NestJS + Prisma + PostgreSQL)

A robust, enterprise-grade E-commerce API built with NestJS, utilizing Prisma ORM and PostgreSQL. The project follows a highly atomized task-driven development approach.

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Progressive Node.js framework)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/) (Type-safe database client)
- **Validation**: [class-validator](https://github.com/typestack/class-validator) & [class-transformer](https://github.com/typestack/class-transformer)
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose

## 📖 Documentation Guide

We use a fragmented documentation system to maintain clarity and scalability.

### 🏛️ Architecture & Governance

- **[Project Conventions](doc/project-conventions.en.md)**: Strict TypeScript and coding standards.
- **[Business Requirements Document](doc/ecommerce-api-doc/BUSINESS_REQUIREMENTS_DOCUMENT.md)**: Canonical BA/PM document covering business goals, scope, actors, KPI, requirements, and roadmap.
- **[Database Schema](doc/ecommerce-api-doc/DATABASE_SCHEMA.md)**: Detailed ERD and scaling projections.
- **[System Roadmap](doc/ecommerce-api-doc/PROJECT_ROADMAP.md)**: Implementation milestones and dependency graph.
- **[Documentation Structure](doc/ecommerce-api-doc/DOC_STRUCTURE.md)**: Overview of the 80 individual task blueprints.

### 🛠️ Execution & Operations

- **[Task Index](doc/ecommerce-api-doc/TASK_INDEX.md)**: Complete list of all 80 tasks.
- **[Project Status](doc/ecommerce-api-doc/PROJECT_STATUS.md)**: Current completion percentages.
- **[Commands Reference](doc/ecommerce-api-doc/COMMANDS.md)**: One-stop registry for all CLI commands (Build, Test, DB).
- **[Database Setup](doc/ecommerce-api-doc/DATABASE_SETUP.md)**: Step-by-step initialization guide.

---

## ⚡ Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js (v18+) & npm

### 2. Infrastructure Setup

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d
```

### 3. Application Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run migrations and seed data
npm run migration:run
npm run seed
```

### 4. Running the App

```bash
# Development mode
npm run start:dev
```

## 📜 Original Plan Archive

The project successfully transitioned from a monolithic planning document to a modular task-based system.

- **[Monolith Archive](doc/PLAN_ARCHIVE.md)**: Historical system blueprint.

---

Created by the E-commerce Engineering Team.
