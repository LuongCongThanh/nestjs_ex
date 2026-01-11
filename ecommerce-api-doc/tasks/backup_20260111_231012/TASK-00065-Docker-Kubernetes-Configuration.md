# ### ✅ TASK 65: Docker & Kubernetes Configuration

> **Task Number:** 65  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Containerization and orchestration

**Các bước thực hiện:**

1. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY package*.json ./
   EXPOSE 3000
   CMD ["node", "dist/main"]
   ```

2. **Create .dockerignore:**

   ```
   node_modules
   dist
   .git
   .env
   *.md
   ```

3. **Create docker-compose.yml:**

   ```yaml
   version: "3.8"
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DB_HOST=postgres
         - REDIS_HOST=redis
       depends_on:
         - postgres
         - redis

     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: ecommerce_db
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: secret
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data

   volumes:
     postgres_data:
     redis_data:
   ```

4. **Kubernetes Deployment (deployment.yaml):**

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: ecommerce-api
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: ecommerce-api
     template:
       metadata:
         labels:
           app: ecommerce-api
       spec:
         containers:
           - name: api
             image: ecommerce-api:latest
             ports:
               - containerPort: 3000
             env:
               - name: NODE_ENV
                 value: "production"
   ```

5. **Kubernetes Service (service.yaml):**

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: ecommerce-api-service
   spec:
     type: LoadBalancer
     selector:
       app: ecommerce-api
     ports:
       - port: 80
         targetPort: 3000
   ```

6. **Kubernetes ConfigMap & Secrets:**
   - Store environment variables
   - Database credentials
   - API keys
7. **Health checks:**
   - Liveness probe: GET /health
   - Readiness probe: GET /health/ready
8. **CI/CD Pipeline (.github/workflows/deploy.yml):**

   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Build Docker image
           run: docker build -t ecommerce-api .
         - name: Push to registry
           run: docker push ecommerce-api
         - name: Deploy to K8s
           run: kubectl apply -f k8s/
   ```

9. **Helm Chart (optional):**
   - Package Kubernetes manifests
   - Easy deployment
10. **Test:**
    - `docker build -t ecommerce-api .`
    - `docker-compose up`
    - `kubectl apply -f k8s/`
11. **Documentation:**
    - Docker commands
    - Kubernetes deployment guide
    - Environment variables

**Kết quả mong đợi:** Production-ready containerized deployment

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
