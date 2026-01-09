# ### ✅ TASK 64: Role-Based Access Control (RBAC)

> **Task Number:** 64  
> **Priority:** Core  
> **Status:** ⬜ Not Started

---

**Mục tiêu:** Fine-grained permissions management

**Các bước thực hiện:**

1. Tạo Permission entity:
   - name (e.g., 'users.create', 'products.delete')
   - description
   - resource (users, products, orders)
   - action (create, read, update, delete)
2. Tạo Role entity:
   - name (admin, manager, warehouse, customer_support)
   - description
   - permissions (ManyToMany với Permission)
3. Update User entity:
   - roles (ManyToMany với Role) - User có thể có nhiều roles
4. Generate module: `nest g module modules/rbac`
5. Seed permissions:

   ```typescript
   // User permissions
   "users.create", "users.read", "users.update", "users.delete";
   // Product permissions
   "products.create", "products.read", "products.update", "products.delete";
   // Order permissions
   "orders.read", "orders.update", "orders.cancel";
   // etc.
   ```

6. Seed roles:

   ```typescript
   Admin: all permissions
   Manager: products.*, orders.*, users.read
   Warehouse: products.update (stock), orders.read
   CustomerSupport: orders.read, orders.update, users.read
   ```

7. Create PermissionsGuard:

   ```typescript
   @Injectable()
   export class PermissionsGuard implements CanActivate {
     canActivate(context: ExecutionContext) {
       const requiredPermissions = this.reflector.get(
         "permissions",
         context.getHandler()
       );
       const user = context.switchToHttp().getRequest().user;
       return this.hasPermissions(user, requiredPermissions);
     }
   }
   ```

8. Create @RequirePermissions decorator:

   ```typescript
   @RequirePermissions('products.delete')
   @Delete(':id')
   async deleteProduct() { ... }
   ```

9. Implement RbacService:
   - `checkPermission(userId, permission)` - boolean
   - `getUserPermissions(userId)` - array
   - `assignRole(userId, roleId)`
   - `removeRole(userId, roleId)`
   - `createRole(name, permissions)`
   - `updateRole(roleId, permissions)`
10. Admin endpoints:
    - GET /roles
    - POST /roles
    - PATCH /roles/:id
    - DELETE /roles/:id
    - GET /permissions
    - POST /users/:id/roles
    - DELETE /users/:id/roles/:roleId
11. Apply guards globally hoặc per controller
12. Test permission checks

**Kết quả mong đợi:** Flexible, scalable permission system

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
