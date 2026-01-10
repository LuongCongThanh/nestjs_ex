# ### ✅ TASK 03: Setup Database PostgreSQL

> **Task Number:** 03  
> **Priority:** Core  
> **Status:** ✅ In Progress  
> **Dependencies:** None

---

## 🎯 **Mục tiêu**

Cài đặt và khởi động **PostgreSQL database server** bằng Docker Compose.

**✅ Đã có sẵn trong project:**

- TypeORM configuration ([typeorm.config.ts](../../ecommerce-api/src/config/typeorm.config.ts))
- Environment files (.env, .env.example, .env.test)
- Health check endpoint ([health.controller.ts](../../ecommerce-api/src/health/health.controller.ts))
- Migration scripts (package.json)
- Database connection trong AppModule

**📦 Cần thực hiện:**

- ✅ Tạo docker-compose.yml
- ✅ Tạo init.sql để setup extensions
- ✅ Start PostgreSQL container
- ✅ Verify connection

---

## 📋 **Các bước thực hiện**

### **STEP 1: Create docker-compose.yml**

**File:** `ecommerce-api/docker-compose.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: ecommerce-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root123
      POSTGRES_DB: ecommerce_db
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ecommerce-network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ecommerce-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: "False"
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ecommerce-network
    profiles:
      - tools # Optional: only start when explicitly requested

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local

networks:
  ecommerce-network:
    driver: bridge
```

**Tại sao dùng Docker Compose?**

---

### \*\*STEP 2: Create Initialization Script

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test database for E2E testing
CREATE DATABASE ecommerce_test;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_test TO postgres;

-- Set default timezone to UTC
ALTER DATABASE ecommerce_db SET timezone TO 'UTC';
ALTER DATABASE ecommerce_test SET timezone TO 'UTC';

-- Log successful initialization
SELECT 'Database initialization completed successfully' AS status;
```

**Note:** Init scripts chỉ chạy lần đầu khi database được tạo. Để re-run, cần `docker-compose down -v`.

---

### **STEP 3: Start PostgreSQL Container**

```bash
# Start only PostgreSQL (without pgAdmin)
docker-compose up -d postgres

# Start everything including pgAdmin
docker-compose --profile tools up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f postgres

# View initialization logs
docker-compose logs postgres | grep "init.sql"

# Stop services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## ✅ **Verification & Testing**

### **Test 1: Container Health Check (Docker)**

```bash
# Check container status
docker-compose ps

# Expected output:
NAME                  COMMAND                  SERVICE    STATUS          PORTS
ecommerce-postgres    "docker-entrypoint..."   postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
```

**Pass criteria:** Status shows `Up (healthy)` - healthcheck passed

---

### **Test 2: Direct Database Connection**

```bash
# Using Docker exec
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_db -c "SELECT version();"

# Using psql from host (Docker or native)
psql -h localhost -U postgres -d ecommerce_db -c "SELECT version();"
# Password: root123

# Expected output:
                                                version
------------------------------------------------------------------------------------------------------
 PostgreSQL 16.x on x86_64-pc-linux-musl, compiled by gcc (Alpine 13.2.1) 64-bit
(1 row)
```

**Pass criteria:** Connection succeeds và returns PostgreSQL version

---

### **Test 3: Database and Extensions Verification**

```bash
# List all databases
psql -h localhost -U postgres -c "\l"

# Check installed extensions
psql -h localhost -U postgres -d ecommerce_db -c "SELECT extname, extversion FROM pg_extension;"

# Expected output:
   extname   | extversion
-------------+------------
 plpgsql     | 1.0
 uuid-ossp   | 1.1
 pg_trgm     | 1.6
 pgcrypto    | 1.3
```

**Pass criteria:**

- Database `ecommerce_db` exists
- Extensions `uuid-ossp`, `pg_trgm`, `pgcrypto` installed

---

### **Test 4: Connection Readiness Check**

```bash
# Check if PostgreSQL is ready to accept connections
pg_isready -h localhost -p 5432 -U postgres

# Expected output:
localhost:5432 - accepting connections

# Docker alternative
docker exec ecommerce-postgres pg_isready -U postgres

# Expected output:
/var/run/postgresql:5432 - accepting connections
```

**Pass criteria:** Returns "accepting connections"

---

### **Test 5: PgAdmin Web Interface (Docker with tools profile)**

```bash
# Start pgAdmin (if not already started)
docker-compose --profile tools up -d pgadmin

# Open browser: http://localhost:5050
```

**Steps to test:**

1. **Login:**

   - Email: `admin@example.com`
   - Password: `admin123`

2. **Add Server:**

   - Right-click "Servers" → Register → Server
   - **General Tab:**
     - Name: `Ecommerce Local`
   - **Connection Tab:**
     - Host: `postgres` (Docker network name)
     - Port: `5432`
     - Maintenance database: `ecommerce_db`
     - Username: `postgres`
     - Password: `root123`
   - Click "Save"

3. **Browse Database:**
   - Expand: Servers → Ecommerce Local → Databases → ecommerce_db
   - Expand: Schemas → public → Extensions
   - Should see: uuid-ossp, pg_trgm, pgcrypto

**Pass criteria:** Successfully connected và can browse database structure

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Port 5432 Already in Use**

```
Error Message:
ERROR: for postgres  Cannot start service postgres: driver failed programming
external connectivity on endpoint ecommerce-postgres: Bind for 0.0.0.0:5432
failed: port is already allocated
```

**Root Cause:** Another PostgreSQL instance đã chạy trên port 5432

**Solutions:**

```bash
# Option 1: Stop existing PostgreSQL service

# macOS
brew services stop postgresql
brew services stop postgresql@16

# Linux
sudo systemctl stop postgresql

# Windows (PowerShell as Admin)
Stop-Service -Name postgresql-x64-16

# Then restart Docker containers
docker-compose down
docker-compose up -d

# Option 2: Change Docker port in docker-compose.yml
# Edit docker-compose.yml:
ports:
  - '5433:5432'  # Use port 5433 on host

# Update .env:
DB_PORT=5433

# Restart
docker-compose down
docker-compose up -d
```

**Verification:**

```bash
docker-compose ps  # Should show "Up (healthy)"
psql -h localhost -p 5433 -U postgres -d ecommerce_db -c "SELECT 1;"
```

---

### **Issue 2: Container Starts But Immediately Crashes**

```
Error Message:
ecommerce-postgres exited with code 1
```

**Root Cause:** Corrupted volume, incompatible data, hoặc insufficient permissions

**Solutions:**

```bash
# Step 1: Check logs for specific error
docker-compose logs postgres

# Common errors:
# - "FATAL: data directory has wrong ownership"
# - "PANIC: could not write to file"
# - "initdb: error: could not create directory"

# Step 2: Complete fresh start - remove all volumes
docker-compose down -v

# Step 3: Verify volumes are removed
docker volume ls | grep ecommerce

# Step 4: Start fresh
docker-compose up -d

# Step 5: Watch startup logs
docker-compose logs -f postgres
```

**Advanced solution - check disk space:**

```bash
# Check available disk space
df -h  # Linux/Mac
Get-PSDrive  # Windows PowerShell

# If low on space, clean Docker
docker system prune -a --volumes
```

**Verification:**

```bash
docker-compose ps  # Should show "Up (healthy)"
docker exec ecommerce-postgres psql -U postgres -c "SELECT 1;"
```

---

### **Issue 3: Cannot Connect from Host Machine**

```
Error Message:
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed:
Connection refused
```

**Root Cause:** Network configuration issues, firewall, hoặc wrong host

**Solutions:**

```bash
# Step 1: Verify container is running and healthy
docker-compose ps
# Should show "Up (healthy)"

# Step 2: Check if port is exposed
docker port ecommerce-postgres
# Expected: 5432/tcp -> 0.0.0.0:5432

# Step 3: Test from inside container first
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_db -c "SELECT 1;"
# If this works, problem is host → container connection

# Step 4: For macOS/Windows Docker Desktop users
# Edit .env to use host.docker.internal:
DB_HOST=host.docker.internal  # Instead of localhost

# OR add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows):
127.0.0.1  postgres

# Step 5: Check Docker network
docker network inspect ecommerce-api_ecommerce-network

# Step 6: Restart Docker Desktop (nuclear option)
# Docker Desktop → Troubleshoot → Restart
```

**Verification:**

```bash
pg_isready -h localhost -p 5432 -U postgres
psql -h localhost -U postgres -d ecommerce_db -c "SELECT current_database();"
```

---

### **Issue 4: Init Script (init.sql) Not Running**

```
Problem:
- Extensions not installed
- Test database (ecommerce_test) not created
- Custom initialization not executed
```

**Root Cause:** Init scripts chỉ chạy lần đầu khi database được created

**Solutions:**

```bash
# Step 1: Check if script was executed
docker-compose logs postgres | grep "init.sql"
docker-compose logs postgres | grep "Database initialization completed"

# Step 2: If no logs, script didn't run (database already exists)
# Complete fresh start:
docker-compose down -v
docker volume rm ecommerce-api_postgres_data 2>/dev/null || true
docker-compose up -d

# Step 3: Watch initialization
docker-compose logs -f postgres

# Step 4: Verify file exists and is mounted
docker exec ecommerce-postgres ls -la /docker-entrypoint-initdb.d/
# Should show: init.sql

# Step 5: If script has errors, run manually
docker exec -i ecommerce-postgres psql -U postgres -d ecommerce_db < docker/postgres/init.sql

# Step 6: Check for SQL syntax errors
cat docker/postgres/init.sql | docker exec -i ecommerce-postgres psql -U postgres -d ecommerce_db
```

**Verification:**

```bash
# Check extensions
psql -h localhost -U postgres -d ecommerce_db -c "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pgcrypto');"
# Should return 3 rows

# Check test database
psql -h localhost -U postgres -c "\l" | grep ecommerce_test
```

---

### **Issue 5: Permission Denied on Data Volume**

```
Error Message:
FATAL: data directory "/var/lib/postgresql/data/pgdata" has wrong ownership
HINT: The server must be started by the user that owns the data directory.
```

**Root Cause:** Volume ownership mismatch hoặc SELinux issues

**Solutions:**

```bash
# Step 1: Complete cleanup
docker-compose down
docker volume rm ecommerce-api_postgres_data

# Step 2: Recreate volume with proper permissions
docker volume create ecommerce-api_postgres_data

# Step 3: Start container
docker-compose up -d

# Alternative: Use bind mount with explicit directory (less recommended)
# Edit docker-compose.yml:
volumes:
  - ./data/postgres:/var/lib/postgresql/data

# Create directory with permissions
mkdir -p data/postgres
chmod 777 data/postgres  # Temporary for testing

# On Linux with SELinux, add :z flag:
volumes:
  - postgres_data:/var/lib/postgresql/data:z

# Step 4: Check Docker Desktop file sharing (Mac/Windows)
# Docker Desktop → Settings → Resources → File Sharing
# Ensure project directory is allowed
```

**Verification:**

```bash
docker-compose up -d
docker-compose logs postgres  # No permission errors
docker exec ecommerce-postgres ls -la /var/lib/postgresql/data/pgdata
# Should show postgres user ownership
```

---

## 📝 **Implementation Checklist**

- [x] `.env` files already configured with DB credentials
- [x] TypeORM config already setup
- [x] Health check endpoint already implemented
- [ ] Create `docker-compose.yml`
- [ ] Create `docker/postgres/init.sql`
- [ ] Run `docker-compose up -d postgres`
- [ ] Verify container health: `docker-compose ps`
- [ ] Run all 5 verification tests
- [ ] (Optional) Start pgAdmin for GUI management

---

## 🎯 **Post-Completion**

- [ ] PostgreSQL container running and healthy
- [ ] Database `ecommerce_db` accessible on `localhost:5432`
- [ ] Extensions installed (uuid-ossp, pg_trgm, pgcrypto)
- [ ] All 5 verification tests pass
- [ ] Ready to run migrations and connect from NestJS app

---

## ⏱️ **Time Tracking**

- **Estimated:** 1 hour (Docker) / 2 hours (Native)
  - Docker setup: 15 min
  - Init script: 10 min
  - Start containers: 5 min
  - Verification:20-30 minutes
  - Create docker files: 5 min
  - Start container: 2 min
  - Verification: 10 min
  - Troubleshooting (if needed): 10 min
- **Actual:** \_\_\_ minuteriteria\*\*

✅ PostgreSQL 16 server running and accessible  
✅ Database `ecommerce_db` created with UTF8 encoding  
✅ Extensions installed: `uuid-ossp`, `pg_trgm`, `pgcrypto`  
✅ Connection test successful via psql from host  
✅ Port 5432 accessible from host machine  
✅ `pg_isready` returns "accepting connections"  
✅ (Docker) Containers have `Up (healthy)` status  
✅ (Docker) Data persists across `docker-compose down` / `up`  
✅ (Optional) PgAdmin accessible and can connect to database  
✅ Credentials match `.env` file configuration

---

## 🔗 **Related Tasks**

- **Task 01**: Khởi tạo Project (project structure created)
- **Task 02**: ✅ Setup Environment Configuration (COMPLETED)
- **Task 04**: Next - Test connection from NestJS app
- **Task 11**: Generate & Run Migrations (requires this task)

---

## 📚 **Additional Resources**

### **Official Documentation**

- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [PgAdmin 4 Documentation](https://www.pgadmin.org/docs/pgadmin4/latest/)

### **Tools & GUI Clients**

- [pgAdmin 4](https://www.pgadmin.org/) - Web-based admin tool (included in docker-compose)
- [DBeaver](https://dbeaver.io/) - Universal database client
- [TablePlus](https://tableplus.com/) - Native database client (Mac/Windows)
- [Postico](https://eggerapps.at/postico/) - PostgreSQL client for Mac

### **Tutorials & Guides**

- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Docker Compose for PostgreSQL Best Practices](https://docs.docker.com/samples/postgres/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

### **TypeORM Resources** (already implemented in Task 02)

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)

---

## 💡 **Best Practices Recap**

### **Docker Approach (Recommended):**

✅ Use `postgres:16-alpine` for smaller image size  
✅ Always use named volumes for data persistence  
✅ Enable healthcheck for container monitoring  
✅ Use networks for container isolation  
✅ Use profiles for optional services (pgAdmin)  
✅ Mount init.sql for automatic setup  
✅ Match credentials in docker-compose.yml and .env

### **General Practices:**

✅ Never commit `.env` to git (use `.env.example`)  
✅ Use strong passwords in production  
✅ Enable required extensions (uuid-ossp for UUIDs)  
✅ Set timezone to UTC for consistency  
✅ Test connection before moving to next task  
✅ DocumeQuick Tips\*\*

- Use `docker-compose logs -f postgres` to watch startup
- First time? Use `docker-compose down -v` to reset completely
- pgAdmin credentials: admin@example.com / admin123
- To connect from pgAdmin, use host: `postgres` (not localhost)

---

\*\*🎉 Task hoàn thành khi PostgreSQL container running healthy
